import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AddDeviceDto } from './dto/add-device.dto';
import { RemoveDeviceDto } from './dto/remove-device.dto';
import { User } from './entities/user.entity';
import { UserPreference } from './entities/user-preference.entity';
import { UserDevice } from './entities/user-device.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  // 1. Inject all three repositories
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,

    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, preferences, push_token } = createUserDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new NotFoundException('User with this email alreadya exists');
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(password, salt);

    // 1 Create preference
    const newPreference = this.preferenceRepository.create({
      email_notifications: preferences.email_notifications,
      push_notifications: preferences.push_notifications,
    });
    // Save first in order to link it
    await this.preferenceRepository.save(newPreference);

    //2 Create the user
    const newUser = this.userRepository.create({
      name,
      email,
      password_hash,
      preference: newPreference // Link saved preference
    });
    // Save the user
    await this.userRepository.save(newUser);

    //3 Handle the devive
    if (push_token) {
      const newDevice = this.deviceRepository.create({
        device_token: push_token,
        user: newUser,
        device_type: 'unknown',
      });
      // Save the device
      await this.deviceRepository.save(newDevice);
    }

    // Return the user
    return newUser;
  }

  async getContactInfo(id: string) {
    // A. Find user, and 'join' related tables
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preference', 'devices'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // B. Format data to match contract
    const device_tokens = user.devices.map((device) => device.device_token);

    return {
      user_id: user.id,
      name: user.name,
      email: user.email,
      device_tokens: device_tokens,
      preferences: {
        email_notifications: user.preference?.email_notifications,
        push_notifications: user.preference?.push_notifications,
      },
    };
  }

  async validatePassword(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
      //Ask for password hash
      select: ['id', 'email', 'name', 'password_hash'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success, return user data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user;
    return result;
  }
  async addDevice(userId: string, addDeviceDto: AddDeviceDto) {
    // 1. Find the user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check if this token is *already registered for this user*
    const existingDevice = await this.deviceRepository.findOne({
      where: {
        device_token: addDeviceDto.device_token,
        user: { id: userId }, // Check for this specific user
      },
    });

    // 3. If the user already has this token, just return.
    if (existingDevice) {
      return existingDevice;
    }

    // 4. Create and save the new device
    const newDevice = this.deviceRepository.create({
      device_token: addDeviceDto.device_token,
      device_type: addDeviceDto.device_type || 'unknown',
      user: user, // Link it to the user
    });

    return this.deviceRepository.save(newDevice);
  }

  async removeDevice(removeDeviceDto: RemoveDeviceDto) {
    const { device_token } = removeDeviceDto;

    const device = await this.deviceRepository.findOne({
      where: { device_token },
    });

    if (!device) {
      return {
        success: true,
        message: 'Device token not found or already removed',
      };
    }

    await this.deviceRepository.remove(device);
    return { success: true, message: 'Device token removed' };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // 1. Find user
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Handle preference updates (if any)
    if (updateUserDto.preferences) {
      await this.preferenceRepository.update(
        user.preference.id,
        updateUserDto.preferences,
      );
    }

    // 3. Handle user updates (if any)
    // Delete preferences so typeorm doesn't try to update them
    delete updateUserDto.preferences;

    // 4. Merge new data and save
    await this.userRepository.update(id, updateUserDto);

    return this.userRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    // 1. Find the user preference relation
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preference'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Get the ID of the preference *before* we break the link
    const preferenceId = user.preference ? user.preference.id : null;

    // 3. Break the link from User -> Preference
    if (user.preference) {
      user.preference = null as any; 
      await this.userRepository.save(user);
    }

    // 4. Delete the User.
    await this.userRepository.remove(user);

    // 5. Finally, clean up the orphaned preference
    if (preferenceId) {
      await this.preferenceRepository.delete(preferenceId);
    }
  }
}

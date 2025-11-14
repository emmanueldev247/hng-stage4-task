import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, QueryFailedError } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { AddDeviceDto } from "./dto/add-device.dto";
import { RemoveDeviceDto } from "./dto/remove-device.dto";
import { User } from "./entities/user.entity";
import { UserPreference } from "./entities/user-preference.entity";
import { UserDevice } from "./entities/user-device.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  // 1. Inject all three repositories
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,

    @InjectRepository(UserDevice)
    private readonly deviceRepository: Repository<UserDevice>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, name, preferences, push_token } = createUserDto;

    return this.userRepository.manager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const prefRepo = em.getRepository(UserPreference);
      const deviceRepo = em.getRepository(UserDevice);

      const existingUser = await userRepo.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException("User with this email already exists");
      }

      if (push_token) {
        const existingDevice = await deviceRepo.findOne({
          where: { device_token: push_token },
          relations: ["user"],
        });
        if (existingDevice) {
          throw new ConflictException("Device token already registered");
        }
      }

      const salt = await bcrypt.genSalt();
      const password_hash = await bcrypt.hash(password, salt);

      const pref = prefRepo.create({
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
      });
      await prefRepo.save(pref);

      const user = userRepo.create({
        name,
        email,
        password_hash,
        preference: pref,
      });
      await userRepo.save(user);

      if (push_token) {
        const device = deviceRepo.create({
          device_token: push_token,
          device_type: "unknown",
          user,
        });
        await deviceRepo.save(device);
      }

      return user;
    });
  }

  async getContactInfo(id: string) {
    try {
      // A. Find user, and 'join' related tables
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["preference", "devices"],
      });

      if (!user) {
        throw new NotFoundException("User not found");
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
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException("Could not retrieve contact info");
    }
  }

  async validatePassword(loginUserDto: LoginUserDto) {
    try {
      const { email, password } = loginUserDto;

      // Find user
      const user = await this.userRepository.findOne({
        where: { email },
        //Ask for password hash
        select: ["id", "email", "name", "password_hash"],
      });

      if (!user) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Compare password
      const isPasswordMatch = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordMatch) {
        throw new UnauthorizedException("Invalid credentials");
      }

      // Success, return user data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password_hash, ...result } = user;
      return result;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException("Could not validate user");
    }
  }
  async addDevice(userId: string, addDeviceDto: AddDeviceDto) {
    try {
      // 1. Find the user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException("User not found");
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
        device_type: addDeviceDto.device_type || "unknown",
        user: user, // Link it to the user
      });

      return this.deviceRepository.save(newDevice);
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException("Could not add device token");
    }
  }

  async removeDevice(removeDeviceDto: RemoveDeviceDto) {
    try {
      const { device_token } = removeDeviceDto;

      const device = await this.deviceRepository.findOne({
        where: { device_token },
      });

      if (!device) {
        return {
          success: true,
          message: "Device token not found or already removed",
        };
      }

      await this.deviceRepository.remove(device);
      return { success: true, message: "Device token removed" };
    } catch (error) {
      throw new InternalServerErrorException("Could not remove device token");
    }
  }

  async update2(id: string, updateUserDto: UpdateUserDto) {
    try {
      // 1. Find user
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        throw new NotFoundException("User not found");
      }

      // 2. Handle preference updates (if any)
      if (updateUserDto.preferences) {
        await this.preferenceRepository.update(
          user.preference.id,
          updateUserDto.preferences
        );
      }

      // 3. Handle user updates (if any)
      // Delete preferences so typeorm doesn't try to update them
      delete updateUserDto.preferences;

      // 4. Merge new data and save
      await this.userRepository.update(id, updateUserDto);

      return this.userRepository.findOne({ where: { id } });
    } catch (e: any) {
      // Prisma examples:
      if (e.code === "P2002")
        throw new ConflictException("Email already in use");
      if (e.code === "P2025") throw new NotFoundException("User not found");
      throw e; // let Nest handle other cases (or map more codes)
    }
  }

  async update1(id: string, updateUserDto: UpdateUserDto) {
    try {
      // 1) Load user with preference relation
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["preference"],
        select: [
          "id",
          "name",
          "email",
          "password_hash",
          "created_at",
          "updated_at",
        ],
      });
      if (!user) throw new NotFoundException("User not found");

      // 2) Update/create preferences if provided
      if (updateUserDto.preferences) {
        const { email_notifications, push_notifications } =
          updateUserDto.preferences;

        if (user.preference) {
          await this.preferenceRepository.update(user.preference.id, {
            email_notifications,
            push_notifications,
          });
        } else {
          // user had no preference row yet — create one and link it
          const pref = this.preferenceRepository.create({
            email_notifications,
            push_notifications,
          });
          await this.preferenceRepository.save(pref);
          user.preference = pref;
          await this.userRepository.save(user);
        }
      }

      // 3) Prepare user fields (exclude nested preferences from the user update)
      const { preferences, password, ...rest } = updateUserDto;

      // hash password if being updated
      if (password !== undefined) {
        const salt = await bcrypt.genSalt();
        (rest as any).password_hash = await bcrypt.hash(password, salt);
      }

      // only apply defined props
      const data = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(data).length > 0) {
        await this.userRepository.update(id, data);
      }

      // 4) Return fresh row (with preference)
      return this.userRepository.findOne({
        where: { id },
        relations: ["preference"],
      });
    } catch (e: any) {
      console.error(e);
      // map common db errors if you want; these Prisma codes won’t apply to TypeORM
      if (e.status) throw e;
      throw new InternalServerErrorException("Could not update user");
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // 1) Load user with relations you'll touch
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["preference"],
        select: [
          "id",
          "name",
          "email",
          "password_hash",
          "created_at",
          "updated_at",
        ],
      });
      if (!user) throw new NotFoundException("User not found");

      // 2) Preferences (optional)
      if (updateUserDto.preferences) {
        const { email_notifications, push_notifications } =
          updateUserDto.preferences;

        if (user.preference) {
          await this.preferenceRepository.update(user.preference.id, {
            email_notifications,
            push_notifications,
          });
        } else {
          const pref = this.preferenceRepository.create({
            email_notifications,
            push_notifications,
          });
          await this.preferenceRepository.save(pref);
          user.preference = pref;
          await this.userRepository.save(user);
        }
      }

      // 3) Handle push_token via devices (optional)
      if ((updateUserDto as any).push_token) {
        const token = (updateUserDto as any).push_token as string;

        // device_token is globally unique in your schema
        const existing = await this.deviceRepository.findOne({
          where: { device_token: token },
          relations: ["user"],
        });

        if (existing) {
          // Token belongs to same user: do nothing.
          if (existing.user?.id !== user.id) {
            // Token is registered to a different user -> reject
            throw new ConflictException(
              "Device token already registered to another user"
            );
          }
        } else {
          const newDevice = this.deviceRepository.create({
            device_token: token,
            device_type: "unknown",
            user,
          });
          await this.deviceRepository.save(newDevice);
        }
      }

      // 4) Prepare user columns (exclude nested stuff + push_token)
      const { preferences, password, push_token, ...rest } =
        updateUserDto as any;

      // Only whitelist real User columns
      const data: Partial<typeof user> = {};
      if (rest.name !== undefined) data["name"] = rest.name;
      if (rest.email !== undefined) data["email"] = rest.email;

      // Hash password if supplied
      if (password !== undefined) {
        const salt = await bcrypt.genSalt();
        (data as any).password_hash = await bcrypt.hash(password, salt);
      }

      if (
        Object.keys(data).length === 0 &&
        !updateUserDto.preferences &&
        !push_token
      ) {
        throw new BadRequestException("No updates provided");
      }

      if (Object.keys(data).length > 0) {
        await this.userRepository.update(id, data);
      }

      // 5) Return fresh row
      return this.userRepository.findOne({
        where: { id },
        relations: ["preference", "devices"],
      });
    } catch (e: any) {
      // TypeORM/Postgres unique violation
      if (
        e instanceof QueryFailedError &&
        (e as any).driverError?.code === "23505"
      ) {
        // likely duplicate email, or duplicate device_token if you move that here
        throw new ConflictException("Unique constraint violated");
      }
      if (e.status) throw e;
      throw new InternalServerErrorException("Could not update user");
    }
  }
  async remove(id: string): Promise<void> {
    try {
      // 1. Find the user preference relation
      const user = await this.userRepository.findOne({
        where: { id },
        relations: ["preference"],
      });

      if (!user) {
        throw new NotFoundException("User not found");
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
    } catch (error) {
      throw new InternalServerErrorException("Could not delete user");
    }
  }
}

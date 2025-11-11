import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_devices' })
export class UserDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // This is the push_token
  @Column({ name: 'device_token', unique: true })
  device_token: string;

  // Store device type
  @Column({ name: 'device_type', nullable: true }) // e.g., 'ios', 'android', 'web'
  device_type: string;

<<<<<<< HEAD
  @ManyToOne(() => User, (user) => user.devices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
=======
  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' }) // Create the foreign key
<<<<<<< HEAD
>>>>>>> 65208b1 (feat(user-service): add coplete user service API (untested))
=======
>>>>>>> b78dd23 (feat(user-service): add coplete user service API (untested))
>>>>>>> eacfed9 (feat(user-service): add coplete user service API (untested))
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

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

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' }) // Create the foreign key
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

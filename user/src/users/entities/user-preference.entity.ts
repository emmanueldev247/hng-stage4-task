import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_preferences' })
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email_notifications', default: true })
  email_notifications: boolean;

  @Column({ name: 'push_notifications', default: true })
  push_notifications: boolean;

  @OneToOne(() => User, (user) => user.preference)
  user: User; // Link it back to the User

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

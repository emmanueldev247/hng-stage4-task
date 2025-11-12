import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserPreference } from './user-preference.entity';
import { UserDevice } from './user-device.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false }) // 'select: false' hide on normal queries
  password_hash: string;

  // It says one User has one UserPreference
  @OneToOne(() => UserPreference, (preference) => preference.user, {
    cascade: true, //Auto-saves the preference.
    nullable:true,
  })
  @JoinColumn({ name: 'preference_id' }) // Create the foreign key column
  preference: UserPreference;

  // Other relationship
  // One User can have MANY UserDevices
  @OneToMany(() => UserDevice, (device) => device.user, {
    cascade: true, // Auto-saves devices.
  })
  devices: UserDevice[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}

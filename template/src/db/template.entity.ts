import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'templates' })
@Unique('uq_templates_code_version', ['template_code', 'version'])
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_templates_code')
  @Column({ type: 'text' })
  template_code!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;
}

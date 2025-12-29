import { Entity, Column } from 'typeorm';
import { AuditedEntity } from '../../core';

@Entity('roles')
export class Role extends AuditedEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;
}

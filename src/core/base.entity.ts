import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
}

export abstract class CreationAuditedEntity extends BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdBy: number;
}

export abstract class AuditedEntity extends CreationAuditedEntity {
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  updatedBy: number;
}

export abstract class FullAuditedEntity extends AuditedEntity {
  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: number;
}

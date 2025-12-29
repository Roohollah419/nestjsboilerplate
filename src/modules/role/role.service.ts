import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../core';
import { Role } from './role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(roleRepository);
  }

  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.findOne({ name: createRoleDto.name });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    return this.create(createRoleDto);
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    if (updateRoleDto.name && updateRoleDto.name !== role.name) {
      const existing = await this.findOne({ name: updateRoleDto.name });
      if (existing) {
        throw new ConflictException('Role name already exists');
      }
    }

    return this.update(id, updateRoleDto);
  }

  async findByName(name: string): Promise<Role | null> {
    return this.findOne({ name });
  }

  async getActiveRoles(): Promise<Role[]> {
    return this.findAll({ where: { isActive: true } });
  }
}

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../core';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from '../role/role.entity';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    super(userRepository);
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { roleIds, ...userData } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username: userData.username }, { email: userData.email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const user = this.userRepository.create(userData);

    if (roleIds && roleIds.length > 0) {
      user.roles = await this.roleRepository.findByIds(roleIds);
    }

    return this.userRepository.save(user);
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const { roleIds, ...userData } = updateUserDto;
    const user = await this.findById(id);

    if (userData.username && userData.username !== user.username) {
      const existing = await this.findOne({ username: userData.username });
      if (existing) {
        throw new ConflictException('Username already exists');
      }
    }

    if (userData.email && userData.email !== user.email) {
      const existing = await this.findOne({ email: userData.email });
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, userData);

    if (roleIds !== undefined) {
      user.roles =
        roleIds.length > 0 ? await this.roleRepository.findByIds(roleIds) : [];
    }

    return this.userRepository.save(user);
  }

  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async assignRoles(userId: number, roleIds: number[]): Promise<User> {
    const user = await this.findById(userId);
    user.roles = await this.roleRepository.findByIds(roleIds);
    return this.userRepository.save(user);
  }
}

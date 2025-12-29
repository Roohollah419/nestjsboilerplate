# NestJS ABP-Style Boilerplate

A NestJS boilerplate inspired by ABP Framework (.NET), featuring automatic CRUD operations, audit logging, soft delete, JWT authentication, and role-based access control.

## Features

- **Base Entity Classes** - Auditing support (creation, modification, soft delete)
- **Base Service** - Automatic CRUD with pagination
- **JWT Authentication** - Token-based authentication
- **Role-Based Access Control** - Protect endpoints by roles
- **TypeORM** - PostgreSQL database with auto-migrations in development
- **Validation** - DTO validation with class-validator

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env` and update values:

```env
PORT=4040
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=peot

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
```

### 3. Create Database

Create the PostgreSQL database:

```sql
CREATE DATABASE peot;
```

### 4. Run Application

```bash
npm run start:dev
```

## Project Structure

```
src/
├── core/                     # Base classes
│   ├── base.entity.ts        # BaseEntity, CreationAuditedEntity, AuditedEntity, FullAuditedEntity
│   ├── base.service.ts       # BaseService with CRUD + pagination
│   └── index.ts
├── common/
│   ├── decorators/           # @CurrentUser, @Roles, @Public
│   └── guards/               # JwtAuthGuard, RolesGuard
├── modules/
│   ├── auth/                 # Authentication (login, JWT)
│   ├── user/                 # User management
│   └── role/                 # Role management
├── app.module.ts
└── main.ts
```

## Base Entities

Extend these classes for automatic audit fields:

| Entity | Fields |
|--------|--------|
| `BaseEntity` | `id` |
| `CreationAuditedEntity` | `id`, `createdAt`, `createdBy` |
| `AuditedEntity` | Above + `updatedAt`, `updatedBy` |
| `FullAuditedEntity` | Above + `deletedAt`, `deletedBy` (soft delete) |

### Example Entity

```typescript
import { Entity, Column } from 'typeorm';
import { FullAuditedEntity } from '../core';

@Entity('products')
export class Product extends FullAuditedEntity {
  @Column()
  name: string;

  @Column('decimal')
  price: number;
}
```

## Base Service

Extend `BaseService<T>` for automatic CRUD operations:

### Available Methods

| Method | Description |
|--------|-------------|
| `create(dto)` | Create entity |
| `findAll(options?)` | Get all entities |
| `findPaginated(page, limit, options?)` | Get paginated results |
| `findOne(where)` | Find by conditions |
| `findById(id)` | Find by ID (throws NotFoundException) |
| `update(id, dto)` | Update entity |
| `remove(id)` | Hard delete |
| `softRemove(id)` | Soft delete |
| `restore(id)` | Restore soft-deleted |
| `count(where?)` | Count entities |
| `exists(where)` | Check existence |

### Example Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../core';
import { Product } from './product.entity';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }

  // Add custom methods here
  async findByPriceRange(min: number, max: number): Promise<Product[]> {
    return this.repository
      .createQueryBuilder('product')
      .where('product.price BETWEEN :min AND :max', { min, max })
      .getMany();
  }
}
```

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "roles": [{ "id": 1, "name": "Admin" }]
  }
}
```

### Get Current User

```http
GET /auth/me
Authorization: Bearer <token>
```

## Protecting Endpoints

### JWT Guard

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  @Get()
  findAll() {
    // Only authenticated users
  }
}
```

### Role-Based Access

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles } from '../common/decorators';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  @Post()
  @Roles('Admin')
  create() {
    // Only Admin role
  }
}
```

### Get Current User in Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser } from '../common/decorators';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get('id')
  getUserId(@CurrentUser('id') userId: number) {
    return { userId };
  }
}
```

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get current user (auth required) |

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Create user |
| GET | `/users` | List users (supports `?page=1&limit=10`) |
| GET | `/users/:id` | Get user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Soft delete user |
| PUT | `/users/:id/roles` | Assign roles |

### Roles (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/roles` | Create role |
| GET | `/roles` | List roles |
| GET | `/roles/active` | List active roles |
| GET | `/roles/:id` | Get role |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete role |

## Creating a New Module

### 1. Create Entity

```typescript
// src/modules/product/product.entity.ts
import { Entity, Column } from 'typeorm';
import { AuditedEntity } from '../../core';

@Entity('products')
export class Product extends AuditedEntity {
  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  isActive: boolean;
}
```

### 2. Create DTOs

```typescript
// src/modules/product/dto/create-product.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  price: number;
}
```

### 3. Create Service

```typescript
// src/modules/product/product.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../core';
import { Product } from './product.entity';

@Injectable()
export class ProductService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    repository: Repository<Product>,
  ) {
    super(repository);
  }
}
```

### 4. Create Controller

```typescript
// src/modules/product/product.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateProductDto>) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
```

### 5. Create Module

```typescript
// src/modules/product/product.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

### 6. Register Module

```typescript
// src/app.module.ts
import { ProductModule } from './modules/product/product.module';

@Module({
  imports: [
    // ...
    ProductModule,
  ],
})
export class AppModule {}
```

## Seeding Initial Data

Create a seed script to add initial admin user and roles:

```typescript
// src/seeds/initial-seed.ts
import { DataSource } from 'typeorm';
import { Role } from '../modules/role/role.entity';
import { User } from '../modules/user/user.entity';

export async function seed(dataSource: DataSource) {
  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  // Create Admin role
  let adminRole = await roleRepository.findOne({ where: { name: 'Admin' } });
  if (!adminRole) {
    adminRole = roleRepository.create({ name: 'Admin', description: 'Administrator' });
    await roleRepository.save(adminRole);
  }

  // Create admin user
  const adminUser = await userRepository.findOne({ where: { username: 'admin' } });
  if (!adminUser) {
    const user = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      roles: [adminRole],
    });
    await userRepository.save(user);
  }
}
```

## Commands

```bash
npm run start:dev      # Development with hot reload
npm run build          # Build for production
npm run start:prod     # Run production build
npm run test           # Run unit tests
npm run test:e2e       # Run e2e tests
npm run lint           # Lint and fix code
```

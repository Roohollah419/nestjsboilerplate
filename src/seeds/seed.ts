import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Role } from '../modules/role/role.entity';
import { User } from '../modules/user/user.entity';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'peot',
  entities: [Role, User],
  synchronize: true,
});

async function seed() {
  console.log('Connecting to database...');
  await dataSource.initialize();

  const roleRepository = dataSource.getRepository(Role);
  const userRepository = dataSource.getRepository(User);

  // Create Admin role
  console.log('Creating Admin role...');
  let adminRole = await roleRepository.findOne({ where: { name: 'Admin' } });
  if (!adminRole) {
    adminRole = roleRepository.create({
      name: 'Admin',
      description: 'System Administrator',
      isActive: true,
    });
    await roleRepository.save(adminRole);
    console.log('Admin role created');
  } else {
    console.log('Admin role already exists');
  }

  // Create User role
  console.log('Creating User role...');
  let userRole = await roleRepository.findOne({ where: { name: 'User' } });
  if (!userRole) {
    userRole = roleRepository.create({
      name: 'User',
      description: 'Regular User',
      isActive: true,
    });
    await roleRepository.save(userRole);
    console.log('User role created');
  } else {
    console.log('User role already exists');
  }

  // Create admin user
  console.log('Creating admin user...');
  const existingAdmin = await userRepository.findOne({ where: { username: 'admin' } });
  if (!existingAdmin) {
    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      roles: [adminRole],
    });
    await userRepository.save(admin);
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }

  console.log('Seed completed successfully!');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

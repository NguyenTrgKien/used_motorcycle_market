import dataSource from '../data-source';
import { User } from '../modules/user/entities/user.entity';
import { UserRole, UserStatus } from '../shared/enums/user.enum';
import { hashPass } from '../utils/handlePassword';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName =
    process.env.ADMIN_FULL_NAME?.trim() || 'System Administrator';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required.');
  }

  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      existingUser.role = UserRole.ADMIN;
      existingUser.status = UserStatus.ACTIVE;
      existingUser.isVerified = true;
      await userRepository.save(existingUser);
      console.log(`Admin role granted to ${email}.`);
      return;
    }

    const admin = userRepository.create({
      email,
      fullName,
      password: await hashPass(password),
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isVerified: true,
    });
    await userRepository.save(admin);
    console.log(`Admin account created for ${email}.`);
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

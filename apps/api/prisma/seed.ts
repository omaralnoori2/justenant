import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting database...');

  // Delete all data in correct order (respecting foreign keys)
  await prisma.maintenanceRequest.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.cmtSubscription.deleteMany();
  await prisma.serviceProviderProfile.deleteMany();
  await prisma.tenantProfile.deleteMany();
  await prisma.landlordProfile.deleteMany();
  await prisma.cmtProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.subscriptionTier.deleteMany();
  console.log('All data cleared.');

  // Subscription tiers
  const tiers = await Promise.all([
    prisma.subscriptionTier.create({
      data: { name: 'Starter', maxTenants: 50, maxProperties: 5, pricePerMonth: 99 },
    }),
    prisma.subscriptionTier.create({
      data: { name: 'Growth', maxTenants: 200, maxProperties: 20, pricePerMonth: 299 },
    }),
    prisma.subscriptionTier.create({
      data: { name: 'Enterprise', maxTenants: 9999, maxProperties: 999, pricePerMonth: 999 },
    }),
  ]);
  console.log(`${tiers.length} subscription tiers created.`);

  // Super Admin
  await prisma.user.create({
    data: {
      email: 'superadmin@justanent.com',
      passwordHash: await bcrypt.hash('SuperAdmin@123', 10),
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('Super Admin created: superadmin@justanent.com / SuperAdmin@123');

  // Portal Team
  await prisma.user.create({
    data: {
      email: 'portal@justanent.com',
      passwordHash: await bcrypt.hash('Portal@123', 10),
      role: Role.PORTAL_TEAM,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('Portal Team created: portal@justanent.com / Portal@123');

  console.log('Seed complete.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

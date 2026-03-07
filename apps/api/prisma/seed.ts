import { PrismaClient, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Subscription tiers
  const tiers = await Promise.all([
    prisma.subscriptionTier.upsert({
      where: { name: 'Starter' },
      update: {},
      create: { name: 'Starter', maxTenants: 50, maxProperties: 5, pricePerMonth: 99 },
    }),
    prisma.subscriptionTier.upsert({
      where: { name: 'Growth' },
      update: {},
      create: { name: 'Growth', maxTenants: 200, maxProperties: 20, pricePerMonth: 299 },
    }),
    prisma.subscriptionTier.upsert({
      where: { name: 'Enterprise' },
      update: {},
      create: { name: 'Enterprise', maxTenants: 9999, maxProperties: 999, pricePerMonth: 999 },
    }),
  ]);
  console.log(`✓ ${tiers.length} subscription tiers created`);

  // Super Admin
  const superAdminEmail = 'superadmin@justanent.com';
  const existing = await prisma.user.findUnique({ where: { email: superAdminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: await bcrypt.hash('SuperAdmin@123', 10),
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
    console.log('✓ Super Admin created: superadmin@justanent.com / SuperAdmin@123');
  } else {
    console.log('✓ Super Admin already exists');
  }

  // Portal Team member
  const portalEmail = 'portal@justanent.com';
  const existingPortal = await prisma.user.findUnique({ where: { email: portalEmail } });
  if (!existingPortal) {
    await prisma.user.create({
      data: {
        email: portalEmail,
        passwordHash: await bcrypt.hash('Portal@123', 10),
        role: Role.PORTAL_TEAM,
        status: UserStatus.ACTIVE,
      },
    });
    console.log('✓ Portal Team created: portal@justanent.com / Portal@123');
  }

  // Test CMT
  const cmtEmail = 'testcmt@example.com';
  const existingCmt = await prisma.user.findUnique({ where: { email: cmtEmail } });
  if (!existingCmt) {
    const cmtUser = await prisma.user.create({
      data: {
        email: cmtEmail,
        passwordHash: await bcrypt.hash('TestCMT@12', 10),
        role: Role.CMT,
        status: UserStatus.ACTIVE,
      },
    });
    await prisma.cmtProfile.create({
      data: {
        userId: cmtUser.id,
        businessName: 'Test CMT Company',
        businessAddress: '123 Test Street',
        contactPhone: '555-0123',
        status: 'APPROVED',
        subscriptionTierId: tiers.find(t => t.name === 'Growth')?.id,
      },
    });
    console.log('✓ Test CMT created: testcmt@example.com / TestCMT@12');
  }

  console.log('Seeding complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

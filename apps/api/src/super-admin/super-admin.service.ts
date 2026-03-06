import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [totalUsers, totalCmts, totalTenants, totalProperties, totalUnits] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.cmtProfile.count(),
      this.prisma.tenantProfile.count(),
      this.prisma.property.count(),
      this.prisma.unit.count(),
    ]);

    const cmtsByStatus = await this.prisma.cmtProfile.groupBy({
      by: ['status'],
      _count: true,
    });

    const usersByRole = await this.prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    return {
      totalUsers,
      totalCmts,
      totalTenants,
      totalProperties,
      totalUnits,
      cmtsByStatus: Object.fromEntries(cmtsByStatus.map((r) => [r.status, r._count])),
      usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count])),
    };
  }

  getAllUsers(role?: string, status?: string) {
    return this.prisma.user.findMany({
      where: {
        role: role as any,
        status: status as any,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAllCmtsWithDetails() {
    return this.prisma.cmtProfile.findMany({
      include: {
        user: { select: { id: true, email: true, status: true } },
        subscriptionTier: true,
        _count: {
          select: {
            tenants: true,
            properties: true,
            serviceProviders: true,
            landlords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getSubscriptionRevenue() {
    return this.prisma.cmtSubscription.findMany({
      include: {
        cmt: { select: { businessName: true } },
        tier: { select: { name: true, pricePerMonth: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPortalTeamMember(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'PORTAL_TEAM',
        status: 'ACTIVE',
      },
    });
  }

  async createCmtAccount(data: {
    email: string;
    password: string;
    businessName: string;
    businessAddress: string;
    contactPhone: string;
    licenseNumber?: string;
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with CMT profile - APPROVED status ready to use
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'CMT',
        status: 'ACTIVE',
        cmtProfile: {
          create: {
            businessName: data.businessName,
            businessAddress: data.businessAddress,
            contactPhone: data.contactPhone,
            licenseNumber: data.licenseNumber,
            status: 'APPROVED', // Automatically approved when created by Super Admin
          },
        },
      },
      include: { cmtProfile: true },
    });

    return {
      message: 'CMT account created successfully and is ready to use',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        cmtProfile: user.cmtProfile,
      },
    };
  }
}

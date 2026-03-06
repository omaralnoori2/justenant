import { Injectable } from '@nestjs/common';
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
}

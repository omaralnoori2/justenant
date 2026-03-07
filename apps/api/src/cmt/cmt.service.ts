import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class CmtService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const cmt = await this.getCmtByUserId(userId);

    const [tenantCount, propertyCount, pendingMaintenance, activeTenants] = await Promise.all([
      this.prisma.tenantProfile.count({ where: { cmtId: cmt.id } }),
      this.prisma.property.count({ where: { cmtId: cmt.id } }),
      this.prisma.maintenanceRequest.count({
        where: {
          status: 'PENDING',
          tenant: { cmtId: cmt.id },
        },
      }),
      this.prisma.tenantProfile.count({
        where: { cmtId: cmt.id, user: { status: 'ACTIVE' } },
      }),
    ]);

    return {
      businessName: cmt.businessName,
      subscriptionTier: cmt.subscriptionTier,
      stats: { tenantCount, propertyCount, pendingMaintenance, activeTenants },
    };
  }

  async getProfile(userId: string) {
    const cmt = await this.getCmtByUserId(userId);
    return cmt;
  }

  async getLandlords(userId: string) {
    const cmt = await this.getCmtByUserId(userId);
    return this.prisma.landlordProfile.findMany({
      where: { cmtId: cmt.id },
      include: {
        user: { select: { id: true, email: true, status: true, createdAt: true } },
        _count: { select: { properties: true } },
      },
    });
  }

  async getTenants(userId: string) {
    const cmt = await this.getCmtByUserId(userId);
    return this.prisma.tenantProfile.findMany({
      where: { cmtId: cmt.id },
      include: {
        user: { select: { id: true, email: true, status: true } },
        unit: { include: { property: { select: { name: true } } } },
      },
    });
  }

  async getServiceProviders(userId: string) {
    const cmt = await this.getCmtByUserId(userId);
    return this.prisma.serviceProviderProfile.findMany({
      where: { cmtId: cmt.id },
      include: {
        user: { select: { id: true, email: true, status: true } },
      },
    });
  }

  async approveUser(cmtUserId: string, targetUserId: string) {
    const cmt = await this.getCmtByUserId(cmtUserId);

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        tenantProfile: true,
        landlordProfile: true,
        spProfile: true,
      },
    });
    if (!target) throw new NotFoundException('User not found');

    const belongsToCmt =
      target.tenantProfile?.cmtId === cmt.id ||
      target.landlordProfile?.cmtId === cmt.id ||
      target.spProfile?.cmtId === cmt.id;

    if (!belongsToCmt) throw new ForbiddenException('User does not belong to your CMT');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, status: true },
    });
  }

  async rejectUser(cmtUserId: string, targetUserId: string, reason?: string) {
    const cmt = await this.getCmtByUserId(cmtUserId);

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        tenantProfile: true,
        landlordProfile: true,
        spProfile: true,
      },
    });
    if (!target) throw new NotFoundException('User not found');

    const belongsToCmt =
      target.tenantProfile?.cmtId === cmt.id ||
      target.landlordProfile?.cmtId === cmt.id ||
      target.spProfile?.cmtId === cmt.id;

    if (!belongsToCmt) throw new ForbiddenException('User does not belong to your CMT');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: 'REJECTED' },
      select: { id: true, email: true, status: true },
    });
  }

  private async getCmtByUserId(userId: string) {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { userId },
      include: { subscriptionTier: true },
    });
    if (!cmt) throw new NotFoundException('CMT profile not found');
    if (cmt.status !== 'APPROVED') throw new ForbiddenException('CMT account is not approved');
    return cmt;
  }
}


  async createTenant(cmtUserId: string, data: { email: string; firstName: string; lastName: string; phone: string; password: string }) {
    try {
      const cmt = await this.getCmtByUserId(cmtUserId);
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email already exists');

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: Role.TENANT,
          status: 'ACTIVE',
        },
      });

      await this.prisma.tenantProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          cmtId: cmt.id,
        },
      });

      return { id: user.id, email: user.email, role: user.role, status: user.status };
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  async createLandlord(cmtUserId: string, data: { email: string; firstName: string; lastName: string; phone: string; password: string }) {
    try {
      const cmt = await this.getCmtByUserId(cmtUserId);
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email already exists');

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: Role.LANDLORD,
          status: 'ACTIVE',
        },
      });

      await this.prisma.landlordProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          cmtId: cmt.id,
        },
      });

      return { id: user.id, email: user.email, role: user.role, status: user.status };
    } catch (error) {
      console.error('Error creating landlord:', error);
      throw error;
    }
  }

  async createServiceProvider(cmtUserId: string, data: { email: string; firstName: string; lastName: string; phone: string; password: string; serviceType?: string }) {
    try {
      const cmt = await this.getCmtByUserId(cmtUserId);
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new BadRequestException('Email already exists');

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: Role.SERVICE_PROVIDER,
          status: 'ACTIVE',
        },
      });

      await this.prisma.serviceProviderProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          serviceType: data.serviceType || 'General',
          cmtId: cmt.id,
        },
      });

      return { id: user.id, email: user.email, role: user.role, status: user.status };
    } catch (error) {
      console.error('Error creating service provider:', error);
      throw error;
    }
  }
}

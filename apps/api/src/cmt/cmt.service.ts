import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const cmt = await this.getCmtByUserId(cmtUserId);
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'TENANT',
        status: 'ACTIVE',
        tenantProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            cmtId: cmt.id,
          },
        },
      },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async createLandlord(cmtUserId: string, data: { email: string; firstName: string; lastName: string; phone: string; password: string }) {
    const cmt = await this.getCmtByUserId(cmtUserId);
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'LANDLORD',
        status: 'ACTIVE',
        landlordProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            cmtId: cmt.id,
          },
        },
      },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async createServiceProvider(cmtUserId: string, data: { email: string; firstName: string; lastName: string; phone: string; password: string; serviceType?: string }) {
    const cmt = await this.getCmtByUserId(cmtUserId);
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already exists');

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'SERVICE_PROVIDER',
        status: 'ACTIVE',
        spProfile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            serviceType: data.serviceType,
            cmtId: cmt.id,
          },
        },
      },
      select: { id: true, email: true, role: true, status: true },
    });
  }
}

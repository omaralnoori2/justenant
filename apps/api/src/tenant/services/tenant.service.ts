import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  private async getTenantProfileByUserId(userId: string) {
    const tenant = await this.prisma.tenantProfile.findUnique({
      where: { userId },
      include: { unit: true },
    });
    if (!tenant) throw new NotFoundException('Tenant profile not found');
    return tenant;
  }

  // Get tenant profile with unit and lease info
  async getProfile(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    return this.prisma.tenantProfile.findUnique({
      where: { id: tenant.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        unit: {
          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                type: true,
              },
            },
          },
        },
        cmt: {
          select: {
            id: true,
            businessName: true,
            businessAddress: true,
            contactPhone: true,
          },
        },
      },
    });
  }

  // Get assigned unit details
  async getUnit(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    if (!tenant.unit) {
      throw new NotFoundException('No unit assigned to this tenant');
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: tenant.unit!.id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            landlord: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  // Get tenant's CMT details (for contact info)
  async getCMTDetails(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    return this.prisma.cmtProfile.findUnique({
      where: { id: tenant.cmtId },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        contactPhone: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  // Get maintenance request count for dashboard
  async getMaintenanceStats(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    const [total, pending, completed] = await Promise.all([
      this.prisma.maintenanceRequest.count({
        where: { tenantId: tenant.id },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          tenantId: tenant.id,
          status: 'PENDING',
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          tenantId: tenant.id,
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalRequests: total,
      pendingRequests: pending,
      completedRequests: completed,
    };
  }

  // Get all maintenance requests for tenant
  async getMaintenanceRequests(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: { tenantId: tenant.id },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            serviceType: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get contact details (landlord, CMT)
  async getContacts(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);
    const unit = tenant.unit ? await this.prisma.unit.findUnique({
      where: { id: tenant.unit.id },
      include: {
        property: {
          select: {
            landlord: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    }) : null;

    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { id: tenant.cmtId },
      select: {
        id: true,
        businessName: true,
        contactPhone: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    return {
      landlord: unit?.property?.landlord || null,
      cmt: cmt,
      tenant: {
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        phone: tenant.phone,
        email: (await this.prisma.user.findUnique({ where: { id: tenant.userId } }))
          ?.email,
      },
    };
  }
}

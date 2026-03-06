import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UpdatePropertyDto {
  name?: string;
  address?: string;
}

@Injectable()
export class LandlordService {
  constructor(private prisma: PrismaService) {}

  private async getLandlordProfileByUserId(userId: string) {
    const landlord = await this.prisma.landlordProfile.findUnique({
      where: { userId },
    });
    if (!landlord) throw new NotFoundException('Landlord profile not found');
    return landlord;
  }

  // Get landlord profile with CMT info
  async getProfile(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    return this.prisma.landlordProfile.findUnique({
      where: { id: landlord.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
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

  // Get all properties owned by landlord
  async getProperties(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    return this.prisma.property.findMany({
      where: { landlordId: landlord.id },
      include: {
        units: {
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            units: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single property details
  async getProperty(propertyId: string, userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        units: {
          include: {
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                leaseStart: true,
                leaseEnd: true,
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

    if (!property || property.landlordId !== landlord.id) {
      throw new ForbiddenException('Property not found or access denied');
    }

    return property;
  }

  // Update property details
  async updateProperty(
    propertyId: string,
    userId: string,
    data: UpdatePropertyDto,
  ) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.landlordId !== landlord.id) {
      throw new ForbiddenException('Property not found or access denied');
    }

    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        name: data.name,
        address: data.address,
      },
      include: {
        units: {
          include: {
            tenant: true,
          },
        },
      },
    });
  }

  // Delete property (only if no tenants)
  async deleteProperty(propertyId: string, userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { units: true },
    });

    if (!property || property.landlordId !== landlord.id) {
      throw new ForbiddenException('Property not found or access denied');
    }

    const occupiedUnits = property.units.filter((u) => u.tenantId);
    if (occupiedUnits.length > 0) {
      throw new ForbiddenException(
        'Cannot delete property with occupied units. Remove tenants first.',
      );
    }

    return this.prisma.property.delete({
      where: { id: propertyId },
    });
  }

  // Get units in a property
  async getPropertyUnits(propertyId: string, userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.landlordId !== landlord.id) {
      throw new ForbiddenException('Property not found or access denied');
    }

    return this.prisma.unit.findMany({
      where: { propertyId },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            leaseStart: true,
            leaseEnd: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ floor: 'asc' }, { unitNumber: 'asc' }],
    });
  }

  // Get all tenants across landlord's properties
  async getTenants(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const properties = await this.prisma.property.findMany({
      where: { landlordId: landlord.id },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    return this.prisma.unit.findMany({
      where: {
        propertyId: { in: propertyIds },
        tenantId: { not: null },
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            leaseStart: true,
            leaseEnd: true,
            user: {
              select: {
                email: true,
                status: true,
              },
            },
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get dashboard stats
  async getDashboardStats(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const [propertyCount, unitCount, tenantCount, occupiedUnitCount] =
      await Promise.all([
        this.prisma.property.count({
          where: { landlordId: landlord.id },
        }),
        this.prisma.unit.count({
          where: {
            property: { landlordId: landlord.id },
          },
        }),
        this.prisma.unit.count({
          where: {
            property: { landlordId: landlord.id },
            tenantId: { not: null },
          },
        }),
        this.prisma.unit.count({
          where: {
            property: { landlordId: landlord.id },
            isOccupied: true,
          },
        }),
      ]);

    return {
      properties: propertyCount,
      totalUnits: unitCount,
      activeUnits: occupiedUnitCount,
      vacantUnits: unitCount - occupiedUnitCount,
    };
  }

  // Get maintenance requests for landlord's properties
  async getMaintenanceRequests(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    // Get all properties owned by landlord
    const properties = await this.prisma.property.findMany({
      where: { landlordId: landlord.id },
      select: { id: true },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get all units in those properties
    const units = await this.prisma.unit.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true, tenantId: true },
    });

    const tenantIds = units
      .filter((u) => u.tenantId)
      .map((u) => u.tenantId as string);

    // Get maintenance requests for those tenants
    return this.prisma.maintenanceRequest.findMany({
      where: {
        tenantId: { in: tenantIds },
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            unit: {
              select: {
                name: true,
                property: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            serviceType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get specific tenant details
  async getTenantDetails(tenantId: string, userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const tenant = await this.prisma.tenantProfile.findUnique({
      where: { id: tenantId },
      include: {
        user: {
          select: {
            email: true,
            status: true,
            createdAt: true,
          },
        },
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Verify landlord owns the property
    if (tenant.unit?.property.landlordId !== landlord.id) {
      throw new ForbiddenException('Tenant not found or access denied');
    }

    return tenant;
  }

  // Get rental income stats
  async getRentalStats(userId: string) {
    const landlord = await this.getLandlordProfileByUserId(userId);

    const properties = await this.prisma.property.findMany({
      where: { landlordId: landlord.id },
      include: {
        units: {
          where: { tenantId: { not: null } },
        },
      },
    });

    const totalOccupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.length,
      0,
    );
    const totalUnits = await this.prisma.unit.count({
      where: {
        property: { landlordId: landlord.id },
      },
    });

    return {
      totalProperties: properties.length,
      totalUnits: totalUnits,
      occupiedUnits: totalOccupiedUnits,
      occupancyRate: totalUnits > 0 ? (totalOccupiedUnits / totalUnits) * 100 : 0,
    };
  }
}

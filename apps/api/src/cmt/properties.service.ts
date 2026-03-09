import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';

import { User } from '@prisma/client';

export interface CreatePropertyDto {
  name: string;
  address: string;
  landlordId?: string;
  cmtId?: string; // For Super Admin to assign CMT to property
}

export interface BulkGenerateUnitsDto {
  mode: 'tower' | 'villa'; // tower = X towers, Y floors, Z units per floor | villa = individual units
  towers?: number; // X: number of towers (A, B, C...)
  floors?: number; // Y: number of floors per tower
  unitsPerFloor?: number; // Z: number of units per floor
  towerNames?: string[]; // Custom tower names, defaults to A, B, C...
  startingUnit?: number; // Starting unit number
}

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  private async getCmtIdByUserId(userId: string): Promise<string> {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { userId },
    });
    if (!cmt) throw new NotFoundException('CMT profile not found');
    if (cmt.status !== 'APPROVED') throw new ForbiddenException('CMT account is not approved');
    return cmt.id;
  }

  async createProperty(userId: string, data: CreatePropertyDto, userRole: Role) {
    let cmtId: string | undefined;

    // Super Admin can create properties with or without a CMT assignment
    if (userRole === Role.SUPER_ADMIN) {
      cmtId = data.cmtId; // Can be undefined if not assigned yet
    } else {
      // CMT users must have their own CMT ID
      cmtId = await this.getCmtIdByUserId(userId);
    }

    return this.prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        type: 'TOWER',
        cmtId,
        landlordId: data.landlordId,
      },
    });
  }

  async getProperties(userId: string, userRole: Role) {
    let where: any;

    if (userRole === Role.SUPER_ADMIN) {
      // Super Admin can see all properties
      where = {};
    } else {
      // CMT users can only see their own properties
      const cmtId = await this.getCmtIdByUserId(userId);
      where = { cmtId };
    }

    return this.prisma.property.findMany({
      where,
      include: {
        units: {
          orderBy: { createdAt: 'asc' },
          include: {
            tenant: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
            landlord: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        landlord: true,
        cmt: true,
      },
    });
  }

  async getProperty(id: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { createdAt: 'asc' },
          include: {
            tenant: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
            landlord: {
              include: {
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
        landlord: true,
        cmt: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check access: Super Admin can view any property, CMT can only view their own
    if (userRole !== Role.SUPER_ADMIN) {
      const cmtId = await this.getCmtIdByUserId(userId);
      if (property.cmtId !== cmtId) {
        throw new ForbiddenException('Property not found or access denied');
      }
    }

    return property;
  }

  async updateProperty(id: string, userId: string, data: Partial<CreatePropertyDto>, userRole: Role) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check access: Super Admin can update any property, CMT can only update their own
    if (userRole !== Role.SUPER_ADMIN) {
      const cmtId = await this.getCmtIdByUserId(userId);
      if (property.cmtId !== cmtId) {
        throw new ForbiddenException('Property not found or access denied');
      }
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        landlordId: data.landlordId,
        cmtId: data.cmtId,
      },
      include: { units: true },
    });
  }

  async deleteProperty(id: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Check access: Super Admin can delete any property, CMT can only delete their own
    if (userRole !== Role.SUPER_ADMIN) {
      const cmtId = await this.getCmtIdByUserId(userId);
      if (property.cmtId !== cmtId) {
        throw new ForbiddenException('Property not found or access denied');
      }
    }

    return this.prisma.property.delete({
      where: { id },
    });
  }

  async generateUnitsForProperty(
    propertyId: string,
    userId: string,
    config: BulkGenerateUnitsDto,
    userRole: Role,
  ) {
    // Verify access through getProperty
    await this.getProperty(propertyId, userId, userRole);

    interface UnitData {
      propertyId: string;
      name: string;
      floor?: number;
      unitNumber?: number;
    }
    const units: UnitData[] = [];

    if (config.mode === 'tower') {
      const towers = config.towers || 1;
      const floors = config.floors || 10;
      const unitsPerFloor = config.unitsPerFloor || 5;
      const towerNames = config.towerNames || Array.from({ length: towers }, (_, i) =>
        String.fromCharCode(65 + i),
      );

      // Generate X*Y*Z units with Tower naming
      // Format: Flat [floor][unit] Tower [Letter]
      for (let t = 0; t < towers; t++) {
        for (let f = 1; f <= floors; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            const unitName = `Flat ${f}${u.toString().padStart(2, '0')} Tower ${towerNames[t]}`;
            units.push({
              propertyId,
              name: unitName,
              floor: f,
              unitNumber: u,
            });
          }
        }
      }
    }

    // Bulk create units (append to existing)
    const result = await this.prisma.unit.createMany({
      data: units,
    });

    return { generated: result.count };
  }

  async getUnits(propertyId: string, userId: string, userRole: Role) {
    // Verify access
    await this.getProperty(propertyId, userId, userRole);

    return this.prisma.unit.findMany({
      where: { propertyId },
      include: {
        tenant: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
        landlord: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });
  }

  async updateUnitName(propertyId: string, unitId: string, userId: string, name: string) {
    // Verify access
    await this.getProperty(propertyId, userId);

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });
    if (!unit || unit.propertyId !== propertyId) {
      throw new ForbiddenException('Unit not found or access denied');
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { name },
    });
  }

  async assignTenantToUnit(propertyId: string, unitId: string, userId: string, tenantId: string) {
    try {
      // Verify access
      const cmtId = await this.getCmtIdByUserId(userId);
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.cmtId !== cmtId) {
        throw new ForbiddenException('Property not found or access denied');
      }

      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });
      if (!unit || unit.propertyId !== propertyId) {
        throw new ForbiddenException('Unit not found or access denied');
      }

      const tenant = await this.prisma.tenantProfile.findUnique({
        where: { id: tenantId },
        include: { user: true },
      });
      if (!tenant || tenant.cmtId !== cmtId) {
        throw new ForbiddenException('Tenant not found or access denied');
      }

      // If tenant is already assigned to another unit, remove them first
      if (tenant.id) {
        await this.prisma.unit.updateMany({
          where: { tenantId: tenantId },
          data: { tenantId: null },
        });
      }

      return this.prisma.unit.update({
        where: { id: unitId },
        data: { tenantId: tenantId },
        include: { tenant: { include: { user: true } } },
      });
    } catch (error) {
      console.error('Error assigning tenant to unit:', error);
      throw error;
    }
  }

  async removeTenantFromUnit(propertyId: string, unitId: string, userId: string) {
    // Verify access
    const cmtId = await this.getCmtIdByUserId(userId);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.cmtId !== cmtId) {
      throw new ForbiddenException('Property not found or access denied');
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });
    if (!unit || unit.propertyId !== propertyId) {
      throw new ForbiddenException('Unit not found or access denied');
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { tenantId: null },
    });
  }

  async assignLandlordToUnit(propertyId: string, unitId: string, userId: string, landlordId: string) {
    try {
      // Verify access
      const cmtId = await this.getCmtIdByUserId(userId);
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property || property.cmtId !== cmtId) {
        throw new ForbiddenException('Property not found or access denied');
      }

      const unit = await this.prisma.unit.findUnique({
        where: { id: unitId },
      });
      if (!unit || unit.propertyId !== propertyId) {
        throw new ForbiddenException('Unit not found or access denied');
      }

      const landlord = await this.prisma.landlordProfile.findUnique({
        where: { id: landlordId },
        include: { user: true },
      });
      if (!landlord || landlord.cmtId !== cmtId) {
        throw new ForbiddenException('Landlord not found or access denied');
      }

      return this.prisma.unit.update({
        where: { id: unitId },
        data: { landlordId: landlordId },
        include: { landlord: { include: { user: true } } },
      });
    } catch (error) {
      console.error('Error assigning landlord to unit:', error);
      throw error;
    }
  }

  async removeLandlordFromUnit(propertyId: string, unitId: string, userId: string) {
    // Verify access
    const cmtId = await this.getCmtIdByUserId(userId);
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.cmtId !== cmtId) {
      throw new ForbiddenException('Property not found or access denied');
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });
    if (!unit || unit.propertyId !== propertyId) {
      throw new ForbiddenException('Unit not found or access denied');
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { landlordId: null },
    });
  }

  async assignCmtToProperty(propertyId: string, cmtId: string) {
    // Verify that CMT exists and is approved
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { id: cmtId },
    });
    if (!cmt || cmt.status !== 'APPROVED') {
      throw new ForbiddenException('CMT not found or not approved');
    }

    // Verify property exists
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Assign CMT to property
    return this.prisma.property.update({
      where: { id: propertyId },
      data: { cmtId },
      include: { cmt: true, units: true },
    });
  }
}

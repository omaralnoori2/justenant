import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

import { User } from '@prisma/client';

export interface CreatePropertyDto {
  name: string;
  address: string;
  landlordId?: string;
  cmtId?: string; // For Super Admin to assign CMT to property
  // CMT admin account fields (required when Super Admin creates property)
  cmtEmail?: string;
  cmtPassword?: string;
  cmtBusinessName?: string;
  cmtBusinessAddress?: string;
  cmtContactPhone?: string;
  cmtLicenseNumber?: string;
}

export interface BulkGenerateUnitsDto {
  mode: 'tower' | 'villa';
  towers?: number;
  floors?: number;
  unitsPerFloor?: number;
  towerNames?: string[];
  startingUnit?: number;
  duplicateAction?: 'skip' | 'next'; // skip = skip duplicates, next = continue from next available tower/area letter
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

    if (userRole === Role.SUPER_ADMIN) {
      // Super Admin must create a dedicated CMT admin account for each property
      if (data.cmtEmail && data.cmtPassword && data.cmtBusinessName && data.cmtBusinessAddress && data.cmtContactPhone) {
        // Check if email already exists
        const existing = await this.prisma.user.findUnique({ where: { email: data.cmtEmail } });
        if (existing) throw new ConflictException('CMT email already registered');

        const passwordHash = await bcrypt.hash(data.cmtPassword, 10);

        // Create CMT user + profile in a transaction
        const cmtUser = await this.prisma.user.create({
          data: {
            email: data.cmtEmail,
            passwordHash,
            role: 'CMT',
            status: 'ACTIVE',
            cmtProfile: {
              create: {
                businessName: data.cmtBusinessName,
                businessAddress: data.cmtBusinessAddress,
                contactPhone: data.cmtContactPhone,
                licenseNumber: data.cmtLicenseNumber,
                status: 'APPROVED',
              },
            },
          },
          include: { cmtProfile: true },
        });

        cmtId = cmtUser.cmtProfile!.id;
      } else {
        cmtId = data.cmtId; // Fallback to existing CMT if provided
      }
    } else {
      // CMT users must have their own CMT ID
      cmtId = await this.getCmtIdByUserId(userId);
    }

    const property = await this.prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        type: 'TOWER',
        cmtId,
        landlordId: data.landlordId,
      },
      include: {
        cmt: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    return property;
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
        _count: { select: { units: true } },
        landlord: true,
        cmt: true,
      },
    });
  }

  async getProperty(id: string, userId: string, userRole: Role) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        _count: { select: { units: true } },
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

  // Find which tower/area letters already exist for a property
  async getExistingTowers(propertyId: string, userId: string, userRole: Role) {
    await this.getProperty(propertyId, userId, userRole);

    const units = await this.prisma.unit.findMany({
      where: { propertyId },
      select: { name: true },
    });

    const towerLetters = new Set<string>();
    const areaLetters = new Set<string>();
    for (const u of units) {
      const towerMatch = u.name.match(/Tower\s([A-Z]+)$/);
      if (towerMatch) towerLetters.add(towerMatch[1]);
      const areaMatch = u.name.match(/Area\s([A-Z]+)$/);
      if (areaMatch) areaLetters.add(areaMatch[1]);
    }

    // Find next available letter
    const findNextLetter = (existing: Set<string>): string => {
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(65 + i);
        if (!existing.has(letter)) return letter;
      }
      return String.fromCharCode(65 + existing.size);
    };

    return {
      existingTowers: Array.from(towerLetters).sort(),
      existingAreas: Array.from(areaLetters).sort(),
      nextTowerLetter: findNextLetter(towerLetters),
      nextAreaLetter: findNextLetter(areaLetters),
      totalUnits: units.length,
    };
  }

  async generateUnitsForProperty(
    propertyId: string,
    userId: string,
    config: BulkGenerateUnitsDto,
    userRole: Role,
  ) {
    await this.getProperty(propertyId, userId, userRole);

    // Get existing tower/area letters to detect conflicts
    const existing = await this.getExistingTowers(propertyId, userId, userRole);

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

      let towerNames: string[];
      if (config.towerNames) {
        towerNames = config.towerNames;
      } else if (config.duplicateAction === 'next' && existing.existingTowers.length > 0) {
        // Start from next available letter
        const startCode = existing.nextTowerLetter.charCodeAt(0);
        towerNames = Array.from({ length: towers }, (_, i) =>
          String.fromCharCode(startCode + i),
        );
      } else {
        towerNames = Array.from({ length: towers }, (_, i) =>
          String.fromCharCode(65 + i),
        );
      }

      for (let t = 0; t < towers; t++) {
        for (let f = 1; f <= floors; f++) {
          for (let u = 1; u <= unitsPerFloor; u++) {
            const unitName = `Flat ${f}${u.toString().padStart(2, '0')} Tower ${towerNames[t]}`;
            units.push({ propertyId, name: unitName, floor: f, unitNumber: u });
          }
        }
      }
    } else if (config.mode === 'villa') {
      const areas = config.towers || 1;
      const blocks = config.floors || 1;
      const villasPerBlock = config.unitsPerFloor || 1;

      let areaNames: string[];
      if (config.towerNames) {
        areaNames = config.towerNames;
      } else if (config.duplicateAction === 'next' && existing.existingAreas.length > 0) {
        const startCode = existing.nextAreaLetter.charCodeAt(0);
        areaNames = Array.from({ length: areas }, (_, i) =>
          String.fromCharCode(startCode + i),
        );
      } else {
        areaNames = Array.from({ length: areas }, (_, i) =>
          String.fromCharCode(65 + i),
        );
      }

      for (let a = 0; a < areas; a++) {
        for (let b = 1; b <= blocks; b++) {
          for (let v = 1; v <= villasPerBlock; v++) {
            const villaName = `Villa ${b}${v.toString().padStart(2, '0')} Area ${areaNames[a]}`;
            units.push({ propertyId, name: villaName, floor: b, unitNumber: v });
          }
        }
      }
    }

    // Check for duplicates
    const existingUnits = await this.prisma.unit.findMany({
      where: { propertyId },
      select: { name: true },
    });
    const existingNames = new Set(existingUnits.map(u => u.name));
    const hasDuplicates = units.some(u => existingNames.has(u.name));

    // If duplicates found and no action specified, return conflict info for frontend to ask user
    if (hasDuplicates && !config.duplicateAction) {
      const duplicateCount = units.filter(u => existingNames.has(u.name)).length;
      const label = config.mode === 'tower' ? 'Tower' : 'Area';
      const nextLetter = config.mode === 'tower' ? existing.nextTowerLetter : existing.nextAreaLetter;
      const existingLetters = config.mode === 'tower' ? existing.existingTowers : existing.existingAreas;
      return {
        conflict: true,
        generated: 0,
        duplicateCount,
        existingLetters,
        nextLetter,
        message: `${duplicateCount} units already exist (${label} ${existingLetters.join(', ')}). You can skip duplicates or continue from ${label} ${nextLetter}.`,
      };
    }

    // Skip duplicates if action is 'skip'
    const unitsToCreate = config.duplicateAction === 'skip'
      ? units.filter(u => !existingNames.has(u.name))
      : units;

    if (unitsToCreate.length === 0) {
      return { generated: 0, skipped: units.length, message: 'All units already exist' };
    }

    const result = await this.prisma.unit.createMany({ data: unitsToCreate });
    const skipped = units.length - unitsToCreate.length;
    return { generated: result.count, skipped };
  }

  async getUnits(propertyId: string, userId: string, userRole: Role, page = 1, limit = 50) {
    // Verify access
    await this.getProperty(propertyId, userId, userRole);

    const skip = (page - 1) * limit;
    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where: { propertyId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
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
      }),
      this.prisma.unit.count({ where: { propertyId } }),
    ]);

    return { units, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUnitName(propertyId: string, unitId: string, userId: string, userRole: Role, name: string) {
    // Verify access
    await this.getProperty(propertyId, userId, userRole);

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

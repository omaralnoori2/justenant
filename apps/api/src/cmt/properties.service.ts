import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatePropertyDto {
  name: string;
  address: string;
  landlordId?: string;
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

  async createProperty(cmtId: string, data: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        name: data.name,
        address: data.address,
        cmtId,
        landlordId: data.landlordId,
      },
    });
  }

  async getProperties(cmtId: string) {
    return this.prisma.property.findMany({
      where: { cmtId },
      include: { units: true, landlord: true },
    });
  }

  async getProperty(id: string, cmtId: string) {
    return this.prisma.property.findUnique({
      where: { id },
      include: { units: true, landlord: true },
    });
  }

  async updateProperty(id: string, cmtId: string, data: Partial<CreatePropertyDto>) {
    return this.prisma.property.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        landlordId: data.landlordId,
      },
      include: { units: true },
    });
  }

  async deleteProperty(id: string, cmtId: string) {
    return this.prisma.property.delete({
      where: { id },
    });
  }

  async generateUnitsForProperty(
    propertyId: string,
    cmtId: string,
    config: BulkGenerateUnitsDto,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.cmtId !== cmtId) {
      throw new Error('Property not found or access denied');
    }

    const units = [];

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

    // Bulk create units
    return this.prisma.unit.createMany({
      data: units,
      skipDuplicates: true,
    });
  }

  async getUnits(propertyId: string, cmtId: string) {
    // Verify access
    await this.getProperty(propertyId, cmtId);

    return this.prisma.unit.findMany({
      where: { propertyId },
    });
  }

  async updateUnitName(propertyId: string, unitId: string, cmtId: string, name: string) {
    // Verify access
    await this.getProperty(propertyId, cmtId);

    return this.prisma.unit.update({
      where: { id: unitId },
      data: { name },
    });
  }
}

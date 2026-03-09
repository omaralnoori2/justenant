import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PropertiesService, CreatePropertyDto, BulkGenerateUnitsDto } from './properties.service';

@Controller('cmt/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CMT)
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  // Get all properties for the CMT or Super Admin
  @Get()
  async getProperties(@CurrentUser() user: User) {
    return this.propertiesService.getProperties(user.id, user.role as Role);
  }

  // Create a new property (Super Admin only)
  @Post()
  @Roles(Role.SUPER_ADMIN)
  async createProperty(@CurrentUser() user: User, @Body() data: CreatePropertyDto) {
    return this.propertiesService.createProperty(user.id, data, user.role as Role);
  }

  // Get a specific property
  @Get(':id')
  async getProperty(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.getProperty(id, user.id, user.role as Role);
  }

  // Update property details
  @Patch(':id')
  async updateProperty(@CurrentUser() user: User, @Param('id') id: string, @Body() data: Partial<CreatePropertyDto>) {
    return this.propertiesService.updateProperty(id, user.id, data, user.role as Role);
  }

  // Delete property
  @Delete(':id')
  async deleteProperty(@CurrentUser() user: User, @Param('id') id: string) {
    return this.propertiesService.deleteProperty(id, user.id, user.role as Role);
  }

  // Bulk generate units with X*Y*Z naming
  @Post(':id/generate-units')
  async generateUnits(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Body() config: BulkGenerateUnitsDto,
  ) {
    return this.propertiesService.generateUnitsForProperty(propertyId, user.id, config, user.role as Role);
  }

  // Get all units in a property
  @Get(':id/units')
  async getUnits(@CurrentUser() user: User, @Param('id') propertyId: string) {
    return this.propertiesService.getUnits(propertyId, user.id, user.role as Role);
  }

  // Update unit name
  @Patch(':propertyId/units/:unitId')
  async updateUnitName(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
    @Body('name') name: string,
  ) {
    return this.propertiesService.updateUnitName(propertyId, unitId, user.id, name);
  }

  // Assign tenant to unit
  @Post(':propertyId/units/:unitId/assign-tenant')
  async assignTenantToUnit(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
    @Body('tenantId') tenantId: string,
  ) {
    return this.propertiesService.assignTenantToUnit(propertyId, unitId, user.id, tenantId);
  }

  // Remove tenant from unit
  @Post(':propertyId/units/:unitId/remove-tenant')
  async removeTenantFromUnit(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.propertiesService.removeTenantFromUnit(propertyId, unitId, user.id);
  }

  // Assign landlord to unit
  @Post(':propertyId/units/:unitId/assign-landlord')
  async assignLandlordToUnit(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
    @Body('landlordId') landlordId: string,
  ) {
    return this.propertiesService.assignLandlordToUnit(propertyId, unitId, user.id, landlordId);
  }

  // Remove landlord from unit
  @Post(':propertyId/units/:unitId/remove-landlord')
  async removeLandlordFromUnit(
    @CurrentUser() user: User,
    @Param('propertyId') propertyId: string,
    @Param('unitId') unitId: string,
  ) {
    return this.propertiesService.removeLandlordFromUnit(propertyId, unitId, user.id);
  }

  // Assign CMT admin to property (Super Admin only)
  @Patch(':id/assign-cmt')
  @Roles(Role.SUPER_ADMIN)
  async assignCmtToProperty(
    @CurrentUser() user: User,
    @Param('id') propertyId: string,
    @Body('cmtId') cmtId: string,
  ) {
    return this.propertiesService.assignCmtToProperty(propertyId, cmtId);
  }
}

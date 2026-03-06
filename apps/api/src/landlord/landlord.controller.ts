import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { LandlordService } from './services/landlord.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '@prisma/client';

@Controller('landlord')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LANDLORD)
export class LandlordController {
  constructor(private landlordService: LandlordService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.landlordService.getProfile(user.id);
  }

  @Get('dashboard-stats')
  getDashboardStats(@CurrentUser() user: User) {
    return this.landlordService.getDashboardStats(user.id);
  }

  @Get('rental-stats')
  getRentalStats(@CurrentUser() user: User) {
    return this.landlordService.getRentalStats(user.id);
  }

  @Get('properties')
  getProperties(@CurrentUser() user: User) {
    return this.landlordService.getProperties(user.id);
  }

  @Get('properties/:propertyId')
  getProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: User,
  ) {
    return this.landlordService.getProperty(propertyId, user.id);
  }

  @Patch('properties/:propertyId')
  updateProperty(
    @Param('propertyId') propertyId: string,
    @Body() data: { name?: string; address?: string },
    @CurrentUser() user: User,
  ) {
    return this.landlordService.updateProperty(propertyId, user.id, data);
  }

  @Delete('properties/:propertyId')
  deleteProperty(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: User,
  ) {
    return this.landlordService.deleteProperty(propertyId, user.id);
  }

  @Get('properties/:propertyId/units')
  getPropertyUnits(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: User,
  ) {
    return this.landlordService.getPropertyUnits(propertyId, user.id);
  }

  @Get('tenants')
  getTenants(@CurrentUser() user: User) {
    return this.landlordService.getTenants(user.id);
  }

  @Get('tenants/:tenantId')
  getTenantDetails(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: User,
  ) {
    return this.landlordService.getTenantDetails(tenantId, user.id);
  }

  @Get('maintenance-requests')
  getMaintenanceRequests(@CurrentUser() user: User) {
    return this.landlordService.getMaintenanceRequests(user.id);
  }
}

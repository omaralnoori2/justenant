import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '@prisma/client';

@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TENANT)
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.tenantService.getProfile(user.id);
  }

  @Get('unit')
  getUnit(@CurrentUser() user: User) {
    return this.tenantService.getUnit(user.id);
  }

  @Get('cmt-details')
  getCMTDetails(@CurrentUser() user: User) {
    return this.tenantService.getCMTDetails(user.id);
  }

  @Get('maintenance-stats')
  getMaintenanceStats(@CurrentUser() user: User) {
    return this.tenantService.getMaintenanceStats(user.id);
  }

  @Get('maintenance-requests')
  getMaintenanceRequests(@CurrentUser() user: User) {
    return this.tenantService.getMaintenanceRequests(user.id);
  }

  @Get('contacts')
  getContacts(@CurrentUser() user: User) {
    return this.tenantService.getContacts(user.id);
  }
}

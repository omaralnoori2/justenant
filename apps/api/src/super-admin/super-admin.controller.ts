import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('stats')
  getPlatformStats() {
    return this.superAdminService.getPlatformStats();
  }

  @Get('users')
  getAllUsers(@Query('role') role?: string, @Query('status') status?: string) {
    return this.superAdminService.getAllUsers(role, status);
  }

  @Get('cmts')
  getAllCmts() {
    return this.superAdminService.getAllCmtsWithDetails();
  }

  @Get('revenue')
  getRevenue() {
    return this.superAdminService.getSubscriptionRevenue();
  }
}

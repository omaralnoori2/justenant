import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CmtService } from './cmt.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('cmt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CMT)
export class CmtController {
  constructor(private cmtService: CmtService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: User) {
    return this.cmtService.getDashboard(user.id);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.cmtService.getProfile(user.id);
  }

  @Get('landlords')
  getLandlords(@CurrentUser() user: User) {
    return this.cmtService.getLandlords(user.id);
  }

  @Get('tenants')
  getTenants(@CurrentUser() user: User) {
    return this.cmtService.getTenants(user.id);
  }

  @Get('service-providers')
  getServiceProviders(@CurrentUser() user: User) {
    return this.cmtService.getServiceProviders(user.id);
  }

  @Post('users/:userId/approve')
  approveUser(@CurrentUser() user: User, @Param('userId') targetId: string) {
    return this.cmtService.approveUser(user.id, targetId);
  }

  @Post('users/:userId/reject')
  rejectUser(
    @CurrentUser() user: User,
    @Param('userId') targetId: string,
    @Body('reason') reason?: string,
  ) {
    return this.cmtService.rejectUser(user.id, targetId, reason);
  }

  @Get('test-deploy')
  testDeploy() {
    return { message: 'Deployment test successful', timestamp: new Date() };
  }
}

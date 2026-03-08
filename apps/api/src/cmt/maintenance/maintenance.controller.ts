import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { User } from '@prisma/client';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  // ─── TENANT ENDPOINTS ──────────────────────────────────────────────

  @Post('maintenance/requests')
  @Roles(Role.TENANT)
  createMaintenanceRequest(
    @CurrentUser() user: User,
    @Body() data: CreateMaintenanceDto,
  ) {
    return this.maintenanceService.createMaintenanceRequest(user.id, data);
  }

  @Get('maintenance/requests')
  @Roles(Role.TENANT)
  getTenantRequests(@CurrentUser() user: User) {
    return this.maintenanceService.getTenantRequests(user.id);
  }

  @Get('maintenance/requests/:id')
  @Roles(Role.TENANT)
  getTenantRequest(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.getTenantRequestById(id, user.id);
  }

  @Patch('maintenance/requests/:id/notes')
  @Roles(Role.TENANT)
  addTenantNotes(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.addTenantNotes(id, user.id, notes);
  }

  // ─── CMT ENDPOINTS ────────────────────────────────────────────────

  @Get('cmt/maintenance')
  @Roles(Role.CMT)
  getMaintenanceRequests(@CurrentUser() user: User) {
    return this.maintenanceService.getMaintenanceRequestsForCmt(user.id);
  }

  @Get('cmt/maintenance/pending')
  @Roles(Role.CMT)
  getPendingRequests(@CurrentUser() user: User) {
    return this.maintenanceService.getPendingMaintenanceRequests(user.id);
  }

  @Post('cmt/maintenance/:id/assign')
  @Roles(Role.CMT)
  assignToProvider(
    @Param('id') id: string,
    @Body('providerId') providerId: string,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.assignToServiceProvider(
      id,
      providerId,
      user.id,
    );
  }

  @Patch('cmt/maintenance/:id')
  @Roles(Role.CMT)
  updateMaintenanceRequest(
    @Param('id') id: string,
    @Body() data: UpdateMaintenanceDto,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.updateMaintenanceRequest(id, user.id, data);
  }

  @Get('cmt/maintenance/stats')
  @Roles(Role.CMT)
  getDashboardStats(@CurrentUser() user: User) {
    return this.maintenanceService.getDashboardStats(user.id);
  }

  // ─── SERVICE PROVIDER ENDPOINTS ────────────────────────────────────

  @Get('maintenance/tasks')
  @Roles(Role.SERVICE_PROVIDER)
  getServiceProviderTasks(@CurrentUser() user: User) {
    return this.maintenanceService.getServiceProviderTasks(user.id);
  }

  @Get('maintenance/tasks/:id')
  @Roles(Role.SERVICE_PROVIDER)
  getServiceProviderTask(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.getServiceProviderTask(id, user.id);
  }

  @Patch('maintenance/tasks/:id')
  @Roles(Role.SERVICE_PROVIDER)
  updateServiceProviderTask(
    @Param('id') id: string,
    @Body() data: UpdateMaintenanceDto,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.updateServiceProviderTask(id, user.id, data);
  }

  @Get('maintenance/stats')
  @Roles(Role.SERVICE_PROVIDER)
  getServiceProviderStats(@CurrentUser() user: User) {
    return this.maintenanceService.getServiceProviderStats(user.id);
  }
}

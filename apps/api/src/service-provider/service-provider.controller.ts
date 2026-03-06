import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ServiceProviderService } from './services/service-provider.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '@prisma/client';

@Controller('service-provider')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SERVICE_PROVIDER)
export class ServiceProviderController {
  constructor(private serviceProviderService: ServiceProviderService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.serviceProviderService.getProfile(user.id);
  }

  @Get('dashboard-stats')
  getDashboardStats(@CurrentUser() user: User) {
    return this.serviceProviderService.getDashboardStats(user.id);
  }

  @Get('tasks')
  getTasks(
    @CurrentUser() user: User,
    @Query('status') status?: string,
  ) {
    return this.serviceProviderService.getTasks(user.id, status);
  }

  @Get('tasks/:taskId')
  getTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.serviceProviderService.getTask(taskId, user.id);
  }

  @Post('tasks/:taskId/start')
  startTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: User,
  ) {
    return this.serviceProviderService.startTask(taskId, user.id);
  }

  @Post('tasks/:taskId/complete')
  completeTask(
    @Param('taskId') taskId: string,
    @Body('providerNotes') providerNotes: string,
    @CurrentUser() user: User,
  ) {
    return this.serviceProviderService.completeTask(
      taskId,
      user.id,
      providerNotes,
    );
  }

  @Patch('tasks/:taskId/notes')
  updateTaskNotes(
    @Param('taskId') taskId: string,
    @Body('providerNotes') providerNotes: string,
    @CurrentUser() user: User,
  ) {
    return this.serviceProviderService.updateTaskNotes(
      taskId,
      user.id,
      providerNotes,
    );
  }

  @Get('completed-tasks/month')
  getCompletedTasksThisMonth(@CurrentUser() user: User) {
    return this.serviceProviderService.getCompletedTasksThisMonth(user.id);
  }

  @Get('work-summary')
  getWorkSummary(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date();

    return this.serviceProviderService.getWorkSummary(user.id, start, end);
  }

  @Get('task-history')
  getTaskHistory(
    @CurrentUser() user: User,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.serviceProviderService.getTaskHistory(user.id, limitNum);
  }

  @Get('cmt-contact')
  getCmtContact(@CurrentUser() user: User) {
    return this.serviceProviderService.getCmtContact(user.id);
  }

  @Get('response-time-stats')
  getResponseTimeStats(@CurrentUser() user: User) {
    return this.serviceProviderService.getResponseTimeStats(user.id);
  }
}

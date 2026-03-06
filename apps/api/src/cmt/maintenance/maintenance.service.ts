import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  private async getCmtIdByUserId(userId: string): Promise<string> {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { userId },
    });
    if (!cmt) throw new NotFoundException('CMT profile not found');
    if (cmt.status !== 'APPROVED')
      throw new ForbiddenException('CMT account is not approved');
    return cmt.id;
  }

  private async getTenantProfileByUserId(userId: string) {
    const tenant = await this.prisma.tenantProfile.findUnique({
      where: { userId },
    });
    if (!tenant) throw new NotFoundException('Tenant profile not found');
    return tenant;
  }

  private async getServiceProviderByUserId(userId: string) {
    const sp = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!sp) throw new NotFoundException('Service Provider profile not found');
    return sp;
  }

  // TENANT: Create maintenance request
  async createMaintenanceRequest(
    userId: string,
    data: CreateMaintenanceDto,
  ) {
    const tenant = await this.getTenantProfileByUserId(userId);

    return this.prisma.maintenanceRequest.create({
      data: {
        title: data.title,
        description: data.description,
        mediaUrls: data.mediaUrls || [],
        status: MaintenanceStatus.PENDING,
        tenantId: tenant.id,
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
  }

  // TENANT: List own requests
  async getTenantRequests(userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: { tenantId: tenant.id },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // TENANT: Get single request
  async getTenantRequestById(requestId: string, userId: string) {
    const tenant = await this.getTenantProfileByUserId(userId);

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });

    if (!request || request.tenantId !== tenant.id) {
      throw new ForbiddenException('Request not found or access denied');
    }

    return request;
  }

  // TENANT: Add tenant notes
  async addTenantNotes(
    requestId: string,
    userId: string,
    notes: string,
  ) {
    const tenant = await this.getTenantProfileByUserId(userId);

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.tenantId !== tenant.id) {
      throw new ForbiddenException('Request not found or access denied');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        tenantNotes: notes,
        updatedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
  }

  // CMT: List all maintenance requests for CMT
  async getMaintenanceRequestsForCmt(userId: string) {
    const cmtId = await this.getCmtIdByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: {
        tenant: {
          cmtId,
        },
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // CMT: List pending (unassigned) requests
  async getPendingMaintenanceRequests(userId: string) {
    const cmtId = await this.getCmtIdByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: {
        tenant: {
          cmtId,
        },
        status: MaintenanceStatus.PENDING,
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // CMT: Assign request to service provider
  async assignToServiceProvider(
    requestId: string,
    providerId: string,
    userId: string,
  ) {
    const cmtId = await this.getCmtIdByUserId(userId);

    // Verify request exists and belongs to CMT
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { tenant: true },
    });

    if (!request || request.tenant.cmtId !== cmtId) {
      throw new ForbiddenException('Request not found or access denied');
    }

    // Verify provider exists and belongs to same CMT
    const provider = await this.prisma.serviceProviderProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider || provider.cmtId !== cmtId) {
      throw new ForbiddenException(
        'Service Provider not found or does not belong to your CMT',
      );
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        providerId,
        status: MaintenanceStatus.ASSIGNED,
        updatedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
  }

  // CMT: Update request status and notes
  async updateMaintenanceRequest(
    requestId: string,
    userId: string,
    data: UpdateMaintenanceDto,
  ) {
    const cmtId = await this.getCmtIdByUserId(userId);

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: { tenant: true },
    });

    if (!request || request.tenant.cmtId !== cmtId) {
      throw new ForbiddenException('Request not found or access denied');
    }

    // Validate status transitions
    if (data.status && !this.isValidStatusTransition(request.status, data.status)) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to ${data.status}`,
      );
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: data.status,
        cmtNotes: data.cmtNotes,
        updatedAt: new Date(),
      },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
  }

  // CMT: Get dashboard stats
  async getDashboardStats(userId: string) {
    const cmtId = await this.getCmtIdByUserId(userId);

    const [pending, assigned, inProgress, completed] = await Promise.all([
      this.prisma.maintenanceRequest.count({
        where: {
          tenant: { cmtId },
          status: MaintenanceStatus.PENDING,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          tenant: { cmtId },
          status: MaintenanceStatus.ASSIGNED,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          tenant: { cmtId },
          status: MaintenanceStatus.IN_PROGRESS,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          tenant: { cmtId },
          status: MaintenanceStatus.COMPLETED,
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      pending,
      assigned,
      inProgress,
      completedThisMonth: completed,
    };
  }

  // SERVICE PROVIDER: Get assigned tasks
  async getServiceProviderTasks(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: { providerId: sp.id },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // SERVICE PROVIDER: Get single task
  async getServiceProviderTask(taskId: string, userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    return task;
  }

  // SERVICE PROVIDER: Update task status and notes
  async updateServiceProviderTask(
    taskId: string,
    userId: string,
    data: UpdateMaintenanceDto,
  ) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    // Service provider can only change status to IN_PROGRESS (if ASSIGNED) or COMPLETED (if IN_PROGRESS)
    if (
      data.status &&
      task.status === MaintenanceStatus.ASSIGNED &&
      data.status !== MaintenanceStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Service Provider can only set status to IN_PROGRESS for ASSIGNED tasks',
      );
    }

    if (
      data.status &&
      task.status === MaintenanceStatus.IN_PROGRESS &&
      data.status !== MaintenanceStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Service Provider can only set status to COMPLETED for IN_PROGRESS tasks',
      );
    }

    const updateData: any = {
      providerNotes: data.providerNotes,
      updatedAt: new Date(),
    };

    if (data.status) {
      updateData.status = data.status;
      if (data.status === MaintenanceStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: taskId },
      data: updateData,
      include: {
        tenant: { include: { user: true } },
        provider: { include: { user: true } },
      },
    });
  }

  // SERVICE PROVIDER: Get stats
  async getServiceProviderStats(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const [assigned, inProgress, completed] = await Promise.all([
      this.prisma.maintenanceRequest.count({
        where: {
          providerId: sp.id,
          status: MaintenanceStatus.ASSIGNED,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          providerId: sp.id,
          status: MaintenanceStatus.IN_PROGRESS,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          providerId: sp.id,
          status: MaintenanceStatus.COMPLETED,
          completedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      assigned,
      inProgress,
      completedThisMonth: completed,
    };
  }

  private isValidStatusTransition(
    from: MaintenanceStatus,
    to: MaintenanceStatus,
  ): boolean {
    const validTransitions: Record<MaintenanceStatus, MaintenanceStatus[]> = {
      [MaintenanceStatus.PENDING]: [
        MaintenanceStatus.ASSIGNED,
        MaintenanceStatus.REJECTED,
      ],
      [MaintenanceStatus.ASSIGNED]: [
        MaintenanceStatus.IN_PROGRESS,
        MaintenanceStatus.REJECTED,
      ],
      [MaintenanceStatus.IN_PROGRESS]: [
        MaintenanceStatus.COMPLETED,
        MaintenanceStatus.REJECTED,
      ],
      [MaintenanceStatus.COMPLETED]: [],
      [MaintenanceStatus.REJECTED]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}

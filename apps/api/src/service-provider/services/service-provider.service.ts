import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceStatus } from '../../common/enums/maintenance-status.enum';

@Injectable()
export class ServiceProviderService {
  constructor(private prisma: PrismaService) {}

  private async getServiceProviderByUserId(userId: string) {
    const sp = await this.prisma.serviceProviderProfile.findUnique({
      where: { userId },
    });
    if (!sp) throw new NotFoundException('Service Provider profile not found');
    return sp;
  }

  // Get service provider profile
  async getProfile(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    return this.prisma.serviceProviderProfile.findUnique({
      where: { id: sp.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
          },
        },
        cmt: {
          select: {
            id: true,
            businessName: true,
            businessAddress: true,
            contactPhone: true,
          },
        },
      },
    });
  }

  // Get dashboard statistics
  async getDashboardStats(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const [assigned, inProgress, completed, completedThisMonth] =
      await Promise.all([
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
      totalCompleted: completed,
      completedThisMonth,
    };
  }

  // Get all tasks for service provider
  async getTasks(userId: string, status?: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const where: any = { providerId: sp.id };
    if (status) {
      where.status = status;
    }

    return this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            unit: {
              select: {
                name: true,
                property: {
                  select: {
                    name: true,
                    address: true,
                  },
                },
              },
            },
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Get single task
  async getTask(taskId: string, userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            unit: {
              select: {
                name: true,
                property: {
                  select: {
                    name: true,
                    address: true,
                  },
                },
              },
            },
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    return task;
  }

  // Start task (ASSIGNED -> IN_PROGRESS)
  async startTask(taskId: string, userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    if (task.status !== MaintenanceStatus.ASSIGNED) {
      throw new ForbiddenException(
        'Can only start tasks that are ASSIGNED',
      );
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: taskId },
      data: {
        status: MaintenanceStatus.IN_PROGRESS,
        updatedAt: new Date(),
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Complete task (IN_PROGRESS -> COMPLETED)
  async completeTask(
    taskId: string,
    userId: string,
    providerNotes: string,
  ) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    if (task.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new ForbiddenException(
        'Can only complete tasks that are IN_PROGRESS',
      );
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: taskId },
      data: {
        status: MaintenanceStatus.COMPLETED,
        providerNotes: providerNotes,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Update task notes
  async updateTaskNotes(
    taskId: string,
    userId: string,
    providerNotes: string,
  ) {
    const sp = await this.getServiceProviderByUserId(userId);

    const task = await this.prisma.maintenanceRequest.findUnique({
      where: { id: taskId },
    });

    if (!task || task.providerId !== sp.id) {
      throw new ForbiddenException('Task not found or access denied');
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: taskId },
      data: {
        providerNotes: providerNotes,
        updatedAt: new Date(),
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Get completed tasks for this month
  async getCompletedTasksThisMonth(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: {
        providerId: sp.id,
        status: MaintenanceStatus.COMPLETED,
        completedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            unit: {
              select: {
                name: true,
                property: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });
  }

  // Get work summary for period
  async getWorkSummary(userId: string, startDate: Date, endDate: Date) {
    const sp = await this.getServiceProviderByUserId(userId);

    const tasks = await this.prisma.maintenanceRequest.findMany({
      where: {
        providerId: sp.id,
        status: MaintenanceStatus.COMPLETED,
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalTasks = tasks.length;
    const averageCompletionTime = totalTasks > 0
      ? tasks.reduce((sum, task) => {
          const createdTime = new Date(task.createdAt).getTime();
          const completedTime = new Date(task.completedAt!).getTime();
          return sum + (completedTime - createdTime);
        }, 0) / totalTasks
      : 0;

    return {
      totalTasksCompleted: totalTasks,
      averageCompletionTimeMs: averageCompletionTime,
      averageCompletionTimeDays: Math.round(averageCompletionTime / (1000 * 60 * 60 * 24) * 10) / 10,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    };
  }

  // Get task history/timeline
  async getTaskHistory(userId: string, limit: number = 20) {
    const sp = await this.getServiceProviderByUserId(userId);

    return this.prisma.maintenanceRequest.findMany({
      where: { providerId: sp.id },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            unit: {
              select: {
                name: true,
                property: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  // Get CMT contact for support
  async getCmtContact(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    return this.prisma.cmtProfile.findUnique({
      where: { id: sp.cmtId },
      select: {
        id: true,
        businessName: true,
        businessAddress: true,
        contactPhone: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });
  }

  // Get response time stats (for tenant contact within X hours)
  async getResponseTimeStats(userId: string) {
    const sp = await this.getServiceProviderByUserId(userId);

    const assignedTasks = await this.prisma.maintenanceRequest.findMany({
      where: {
        providerId: sp.id,
        status: { in: [MaintenanceStatus.ASSIGNED, MaintenanceStatus.IN_PROGRESS] },
      },
    });

    const responseTimes = assignedTasks
      .map((task) => {
        const createdTime = new Date(task.createdAt).getTime();
        const nowTime = new Date().getTime();
        const hoursElapsed = (nowTime - createdTime) / (1000 * 60 * 60);
        return hoursElapsed;
      })
      .sort((a, b) => a - b);

    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    return {
      averageResponseTimeHours: Math.round(averageResponseTime * 10) / 10,
      maxResponseTimeHours: Math.round(maxResponseTime * 10) / 10,
      pendingTasks: assignedTasks.length,
    };
  }
}

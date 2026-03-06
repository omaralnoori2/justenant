import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CmtStatus, UserStatus } from '@prisma/client';

@Injectable()
export class PortalTeamService {
  constructor(private prisma: PrismaService) {}

  getPendingCmts() {
    return this.prisma.cmtProfile.findMany({
      where: { status: CmtStatus.PENDING },
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
        subscriptionTier: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  getAllCmts(status?: CmtStatus) {
    return this.prisma.cmtProfile.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { id: true, email: true, status: true, createdAt: true } },
        subscriptionTier: true,
        _count: { select: { tenants: true, properties: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveCmt(cmtId: string, tierId: string) {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { id: cmtId },
      include: { user: true },
    });
    if (!cmt) throw new NotFoundException('CMT not found');
    if (cmt.status !== CmtStatus.PENDING) {
      throw new BadRequestException('CMT is not in pending status');
    }

    const tier = await this.prisma.subscriptionTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Subscription tier not found');

    await this.prisma.$transaction([
      this.prisma.cmtProfile.update({
        where: { id: cmtId },
        data: { status: CmtStatus.APPROVED, subscriptionTierId: tierId },
      }),
      this.prisma.user.update({
        where: { id: cmt.userId },
        data: { status: UserStatus.ACTIVE },
      }),
    ]);

    return { message: 'CMT approved successfully' };
  }

  async rejectCmt(cmtId: string, reason: string) {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { id: cmtId },
      include: { user: true },
    });
    if (!cmt) throw new NotFoundException('CMT not found');

    await this.prisma.$transaction([
      this.prisma.cmtProfile.update({
        where: { id: cmtId },
        data: { status: CmtStatus.REJECTED, rejectionReason: reason },
      }),
      this.prisma.user.update({
        where: { id: cmt.userId },
        data: { status: UserStatus.REJECTED },
      }),
    ]);

    return { message: 'CMT rejected' };
  }

  async suspendCmt(cmtId: string) {
    const cmt = await this.prisma.cmtProfile.findUnique({
      where: { id: cmtId },
      include: { user: true },
    });
    if (!cmt) throw new NotFoundException('CMT not found');

    await this.prisma.$transaction([
      this.prisma.cmtProfile.update({
        where: { id: cmtId },
        data: { status: CmtStatus.SUSPENDED },
      }),
      this.prisma.user.update({
        where: { id: cmt.userId },
        data: { status: UserStatus.SUSPENDED },
      }),
    ]);

    return { message: 'CMT suspended' };
  }

  async assignTier(cmtId: string, tierId: string) {
    const cmt = await this.prisma.cmtProfile.findUnique({ where: { id: cmtId } });
    if (!cmt) throw new NotFoundException('CMT not found');

    const tier = await this.prisma.subscriptionTier.findUnique({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Tier not found');

    return this.prisma.cmtProfile.update({
      where: { id: cmtId },
      data: { subscriptionTierId: tierId },
    });
  }

  getSubscriptionTiers() {
    return this.prisma.subscriptionTier.findMany({ where: { isActive: true } });
  }
}

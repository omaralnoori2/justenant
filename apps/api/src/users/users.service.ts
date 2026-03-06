import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        cmtProfile: true,
        landlordProfile: true,
        tenantProfile: true,
        spProfile: true,
      },
    });
  }

  findAll(filters?: { role?: string; status?: string }) {
    return this.prisma.user.findMany({
      where: {
        role: filters?.role as any,
        status: filters?.status as any,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

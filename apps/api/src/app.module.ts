import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CmtModule } from './cmt/cmt.module';
import { TenantModule } from './tenant/tenant.module';
import { LandlordModule } from './landlord/landlord.module';
import { PortalTeamModule } from './portal-team/portal-team.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CmtModule,
    TenantModule,
    LandlordModule,
    PortalTeamModule,
    SuperAdminModule,
  ],
})
export class AppModule {}

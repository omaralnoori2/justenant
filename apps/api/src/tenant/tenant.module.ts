import { Module } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { TenantController } from './tenant.controller';

@Module({
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}

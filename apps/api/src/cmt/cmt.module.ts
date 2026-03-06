import { Module } from '@nestjs/common';
import { CmtService } from './cmt.service';
import { CmtController } from './cmt.controller';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  providers: [CmtService, PropertiesService],
  controllers: [CmtController, PropertiesController],
  imports: [MaintenanceModule],
})
export class CmtModule {}

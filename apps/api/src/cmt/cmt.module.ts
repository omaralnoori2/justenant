import { Module } from '@nestjs/common';
import { CmtService } from './cmt.service';
import { CmtController } from './cmt.controller';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  providers: [CmtService, PropertiesService],
  controllers: [CmtController, PropertiesController],
})
export class CmtModule {}

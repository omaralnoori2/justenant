import { Module } from '@nestjs/common';
import { CmtService } from './cmt.service';
import { CmtController } from './cmt.controller';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [CmtService, PropertiesService, PrismaService],
  controllers: [CmtController, PropertiesController],
})
export class CmtModule {}

import { Module } from '@nestjs/common';
import { CmtService } from './cmt.service';
import { CmtController } from './cmt.controller';

@Module({
  providers: [CmtService],
  controllers: [CmtController],
})
export class CmtModule {}

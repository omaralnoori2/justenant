import { Module } from '@nestjs/common';
import { LandlordService } from './services/landlord.service';
import { LandlordController } from './landlord.controller';

@Module({
  providers: [LandlordService],
  controllers: [LandlordController],
  exports: [LandlordService],
})
export class LandlordModule {}

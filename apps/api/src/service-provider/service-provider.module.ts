import { Module } from '@nestjs/common';
import { ServiceProviderService } from './services/service-provider.service';
import { ServiceProviderController } from './service-provider.controller';

@Module({
  providers: [ServiceProviderService],
  controllers: [ServiceProviderController],
  exports: [ServiceProviderService],
})
export class ServiceProviderModule {}

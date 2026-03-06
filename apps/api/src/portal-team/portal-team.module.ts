import { Module } from '@nestjs/common';
import { PortalTeamService } from './portal-team.service';
import { PortalTeamController } from './portal-team.controller';

@Module({
  providers: [PortalTeamService],
  controllers: [PortalTeamController],
})
export class PortalTeamModule {}

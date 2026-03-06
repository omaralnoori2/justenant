import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PortalTeamService } from './portal-team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ApproveCmtDto } from './dto/approve-cmt.dto';
import { RejectCmtDto } from './dto/reject-cmt.dto';

@Controller('portal-team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PORTAL_TEAM, Role.SUPER_ADMIN)
export class PortalTeamController {
  constructor(private portalTeamService: PortalTeamService) {}

  @Get('cmts/pending')
  getPendingCmts() {
    return this.portalTeamService.getPendingCmts();
  }

  @Get('cmts')
  getAllCmts(@Query('status') status?: string) {
    return this.portalTeamService.getAllCmts(status as any);
  }

  @Post('cmts/:id/approve')
  approveCmt(@Param('id') id: string, @Body() dto: ApproveCmtDto) {
    return this.portalTeamService.approveCmt(id, dto.tierId);
  }

  @Post('cmts/:id/reject')
  rejectCmt(@Param('id') id: string, @Body() dto: RejectCmtDto) {
    return this.portalTeamService.rejectCmt(id, dto.reason);
  }

  @Patch('cmts/:id/suspend')
  suspendCmt(@Param('id') id: string) {
    return this.portalTeamService.suspendCmt(id);
  }

  @Patch('cmts/:id/tier')
  assignTier(@Param('id') id: string, @Body('tierId') tierId: string) {
    return this.portalTeamService.assignTier(id, tierId);
  }

  @Get('subscription-tiers')
  getSubscriptionTiers() {
    return this.portalTeamService.getSubscriptionTiers();
  }
}

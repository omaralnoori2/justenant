import { IsOptional, IsEnum, IsString } from 'class-validator';
import { MaintenanceStatus } from '../../../common/enums/maintenance-status.enum';

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsString()
  cmtNotes?: string;

  @IsOptional()
  @IsString()
  providerNotes?: string;

  @IsOptional()
  @IsString()
  tenantNotes?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}

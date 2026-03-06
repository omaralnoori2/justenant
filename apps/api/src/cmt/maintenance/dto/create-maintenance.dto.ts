import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateMaintenanceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediaUrls?: string[];
}

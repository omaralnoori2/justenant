import { IsString } from 'class-validator';

export class ApproveCmtDto {
  @IsString()
  tierId: string;
}

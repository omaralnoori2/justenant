import { IsString, MinLength } from 'class-validator';

export class RejectCmtDto {
  @IsString()
  @MinLength(10)
  reason: string;
}

import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterCmtDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  businessName: string;

  @IsString()
  businessAddress: string;

  @IsString()
  contactPhone: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;
}

import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @MinLength(10, { message: 'Mobile must be at least 10 digits' })
  @Matches(/^\d+$/, { message: 'Mobile must contain only digits' })
  mobile: string;

  @IsString()
  @MinLength(4, { message: 'OTP must be at least 4 digits' })
  @MaxLength(8, { message: 'OTP must be at most 8 digits' })
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp: string;
}

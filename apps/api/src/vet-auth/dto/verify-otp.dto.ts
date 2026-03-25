import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class VetVerifyOtpDto {
  @IsString()
  @MinLength(10, { message: 'Mobile must be at least 10 digits' })
  @Matches(/^\d+$/, { message: 'Mobile must contain only digits' })
  mobile!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(8)
  @Matches(/^\d+$/)
  otp!: string;
}

import { IsString, IsOptional, Matches, MinLength } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MinLength(10, { message: 'Mobile must be at least 10 digits' })
  @Matches(/^\d+$/, { message: 'Mobile must contain only digits' })
  mobile: string;

  /** Optional country code (e.g. "91" for India). Uses server default if not set. */
  @IsOptional()
  @IsString()
  countryCode?: string;
}

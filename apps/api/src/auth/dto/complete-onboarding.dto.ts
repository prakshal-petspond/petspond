import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CompleteOnboardingDto {
  @IsString()
  @MinLength(1, { message: 'Name is required' })
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5,10}$/, { message: 'Pincode must be 5–10 digits' })
  pincode?: string;
}

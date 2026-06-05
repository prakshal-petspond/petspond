import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  ValidateNested,
  IsEmail,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

class WeeklyAvailabilityBlockDto {
  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  dayOfWeek!: number;

  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  startMinute!: number;

  @IsNumber()
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  endMinute!: number;
}

class ClinicServiceItemDto {
  @IsString()
  @MinLength(1)
  id!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  icon!: string;
}

export class OnboardingTeamVetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  veterinaryRegistrationNumber?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  specializations?: string[];
}

export class OnboardingFrontStaffDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  mobile?: string;
}

/** 3-step clinic onboarding payload (vet-crm web). */
export class VetCompleteClinicSetupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  clinicName!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsString()
  @MinLength(1)
  address!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(10)
  pincode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyAvailabilityBlockDto)
  weeklyAvailability!: WeeklyAvailabilityBlockDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClinicServiceItemDto)
  servicesOffered!: ClinicServiceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingTeamVetDto)
  @ArrayMaxSize(50)
  additionalVeterinarians?: OnboardingTeamVetDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OnboardingFrontStaffDto)
  @ArrayMaxSize(50)
  frontOfficeStaff?: OnboardingFrontStaffDto[];
}

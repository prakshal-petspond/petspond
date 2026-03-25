import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateClinicDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(1)
  @Max(500)
  totalDoctors!: number;

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
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  placeId?: string;
}

export class VetCompleteOnboardingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;

  @IsString()
  @MinLength(1)
  veterinaryRegistrationNumber!: string;

  @IsNumber()
  @Min(1950)
  @Max(2100)
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  yearOfRegistration!: number;

  @IsArray()
  @IsString({ each: true })
  qualifications!: string[];

  @IsArray()
  @IsString({ each: true })
  specializations!: string[];

  @IsOptional()
  @IsString()
  clinicId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateClinicDto)
  newClinic?: CreateClinicDto;
}

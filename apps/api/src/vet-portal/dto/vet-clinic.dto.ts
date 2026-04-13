import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class HourDto {
  @IsString()
  @MinLength(1)
  day!: string;

  @IsString()
  @MinLength(1)
  hours!: string;
}

class ServiceDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  icon!: string;
}

class VaccineDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  pricePaise!: number;
}

export class UpdateClinicBodyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  address?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  placeId?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  listingImage?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reviewCount?: number;

  @IsOptional()
  @IsBoolean()
  is24_7?: boolean;

  @IsOptional()
  @IsString()
  closingTimeLabel?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HourDto)
  hours?: HourDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facilities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoGallery?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  servicesOffered?: ServiceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VaccineDto)
  vaccinesOffered?: VaccineDto[];

  @IsOptional()
  @IsBoolean()
  acceptsConsultations?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsVaccinations?: boolean;

  @IsOptional()
  @IsInt()
  establishedYear?: number;
}

export class InviteDoctorBodyDto {
  @IsString()
  @MinLength(10)
  mobile!: string;
}

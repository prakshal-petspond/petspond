import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { VendorServiceMode, VendorServiceType } from '@petspond/types';

class WeeklyBlockDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsNumber()
  @Min(0)
  @Max(1439)
  startMinute!: number;

  @IsNumber()
  @Min(1)
  @Max(1440)
  endMinute!: number;
}

export class VendorUpdateProfileBodyDto {
  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  displayTitle?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['grooming', 'training', 'walking'], { each: true })
  serviceTypes?: VendorServiceType[];

  @IsOptional()
  @IsArray()
  @IsEnum(['on_site', 'doorstep'], { each: true })
  serviceModes?: VendorServiceMode[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyBlockDto)
  weeklyAvailability?: WeeklyBlockDto[];

  @IsOptional()
  @IsString()
  promo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

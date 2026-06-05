import {
  ArrayMinSize,
  IsArray,
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

export class VendorCompleteOnboardingBodyDto {
  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  displayTitle?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['grooming', 'training', 'walking'], { each: true })
  serviceTypes!: VendorServiceType[];

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(['on_site', 'doorstep'], { each: true })
  serviceModes!: VendorServiceMode[];

  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  serviceRadiusKm!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyBlockDto)
  weeklyAvailability!: WeeklyBlockDto[];

  @IsOptional()
  @IsString()
  promo?: string;
}

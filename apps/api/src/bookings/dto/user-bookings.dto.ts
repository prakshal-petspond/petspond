import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateConsultationBodyDto {
  @IsString()
  @MinLength(1)
  clinicId!: string;

  @IsString()
  @MinLength(1)
  vetId!: string;

  @IsString()
  @MinLength(1)
  petId!: string;

  @IsArray()
  @IsString({ each: true })
  reasonIds!: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(1)
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  paymentMethodLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountPaise?: number;
}

export class ConfirmPaymentBodyDto {
  @IsOptional()
  @IsString()
  stripeSessionId?: string;
}

export class CreateVaccinationBodyDto {
  @IsString()
  @MinLength(1)
  clinicId!: string;

  @IsString()
  @MinLength(1)
  petId!: string;

  @IsArray()
  @IsString({ each: true })
  vaccineIds!: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(1)
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  paymentMethodLabel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discountPaise?: number;
}

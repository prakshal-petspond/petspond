import { IsIn, IsOptional, IsString, MinLength, IsNumber, Min, IsArray } from 'class-validator';

export class CreateWalkInDto {
  @IsString()
  @MinLength(1)
  petName!: string;

  @IsOptional()
  @IsString()
  petSpecies?: string;

  @IsOptional()
  @IsString()
  petBreed?: string;

  @IsString()
  @MinLength(1)
  ownerName!: string;

  @IsOptional()
  @IsString()
  ownerMobile?: string;

  @IsOptional()
  @IsString()
  vetId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasonIds?: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPaise?: number;
}

export class UpdateQueueStatusDto {
  @IsIn(['waiting', 'in_consultation', 'ready_checkout'])
  queueStatus!: 'waiting' | 'in_consultation' | 'ready_checkout';

  @IsOptional()
  @IsString()
  roomLabel?: string;

  @IsOptional()
  @IsString()
  vetId?: string;
}

export class CollectPaymentDto {
  @IsOptional()
  @IsString()
  paymentMethodLabel?: string;
}

import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateVetCheckoutDto {
  @IsInt()
  @Min(50)
  amountPaise!: number;

  @IsString()
  @MinLength(1)
  vetId!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  /** Deep link or https URL Stripe redirects to after success */
  @IsString()
  @MinLength(1)
  successUrl!: string;

  @IsString()
  @MinLength(1)
  cancelUrl!: string;
}

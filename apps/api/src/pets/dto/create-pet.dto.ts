import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

const species = ['dog', 'cat', 'bird', 'other'] as const;
const gender = ['male', 'female', 'other'] as const;
const services = ['grooming', 'walking', 'nutrition', 'veterinary'] as const;

export class CreatePetBodyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(species)
  species!: (typeof species)[number];

  @IsString()
  @MinLength(1)
  breed!: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(gender)
  gender?: (typeof gender)[number];

  @IsOptional()
  @IsArray()
  @IsEnum(services, { each: true })
  servicesNeeded?: (typeof services)[number][];

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  neutered?: boolean;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  microchipId?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;
}

import { IsEmail, IsString, MinLength } from 'class-validator';

export class VetLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class VetRegisterSendEmailOtpDto {
  @IsEmail()
  email!: string;
}

export class VetRegisterVerifyEmailOtpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(4)
  otp!: string;
}

export class VetRegisterSetPasswordDto {
  @IsString()
  @MinLength(10)
  registrationToken!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class VetGoogleAuthDto {
  @IsString()
  idToken!: string;
}

export class VetOnboardingSendPhoneOtpDto {
  @IsString()
  @MinLength(10)
  mobile!: string;
}

export class VetOnboardingPhoneOtpDto {
  @IsString()
  @MinLength(10)
  mobile!: string;

  @IsString()
  @MinLength(4)
  otp!: string;
}

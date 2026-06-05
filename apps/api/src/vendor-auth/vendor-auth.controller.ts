import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Vendor } from '@petspond/types';
import { SendOtpDto } from '@/auth/dto/send-otp.dto';
import { VerifyOtpDto } from '@/auth/dto/verify-otp.dto';
import { R2StorageService } from '@/storage/r2-storage.service';
import { imageUploadInterceptor } from '@/uploads/image-upload.interceptor';
import { VendorAuthService } from './vendor-auth.service';
import { VendorJwtAuthGuard } from './vendor-jwt-auth.guard';
import { CurrentVendor } from './current-vendor.decorator';
import { VendorCompleteOnboardingBodyDto } from './dto/complete-onboarding.dto';
import { VendorUpdateProfileBodyDto } from './dto/update-profile.dto';

@Controller('vendor-auth')
export class VendorAuthController {
  constructor(
    private readonly vendorAuth: VendorAuthService,
    private readonly storage: R2StorageService,
  ) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.vendorAuth.sendOtp(dto.mobile, dto.countryCode);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    try {
      return await this.vendorAuth.verifyOtp(dto.mobile, dto.otp);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        process.env.NODE_ENV === 'production' ? 'Verification failed. Please try again.' : message,
      );
    }
  }

  @Get('me')
  @UseGuards(VendorJwtAuthGuard)
  me(@CurrentVendor() vendor: Vendor) {
    return vendor;
  }

  @Post('complete-onboarding')
  @UseGuards(VendorJwtAuthGuard)
  completeOnboarding(@CurrentVendor() vendor: Vendor, @Body() body: VendorCompleteOnboardingBodyDto) {
    return this.vendorAuth.completeOnboarding(vendor.id, body);
  }

  @Patch('profile')
  @UseGuards(VendorJwtAuthGuard)
  updateProfile(@CurrentVendor() vendor: Vendor, @Body() body: VendorUpdateProfileBodyDto) {
    return this.vendorAuth.updateProfile(vendor.id, body);
  }

  @Post('upload-photo')
  @UseGuards(VendorJwtAuthGuard)
  @UseInterceptors(imageUploadInterceptor)
  uploadPhoto(@CurrentVendor() vendor: Vendor, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided');
    return this.storage.uploadImage(file, `vendors/${vendor.id}`);
  }
}

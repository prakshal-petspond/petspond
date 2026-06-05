import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/auth/current-user.decorator';
import type { User } from '@petspond/types';
import { R2StorageService } from '@/storage/r2-storage.service';
import { imageUploadInterceptor } from './image-upload.interceptor';

@Controller('user/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly storage: R2StorageService) {}

  @Post('pet-photo')
  @UseInterceptors(imageUploadInterceptor)
  uploadPetPhoto(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No image file provided');
    return this.storage.uploadImage(file, `pets/${user.id}`);
  }
}

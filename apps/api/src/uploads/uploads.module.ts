import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { R2StorageService } from '@/storage/r2-storage.service';
import { UploadsController } from './uploads.controller';
import { PublicFilesController } from './public-files.controller';

@Module({
  imports: [AuthModule],
  controllers: [UploadsController, PublicFilesController],
  providers: [R2StorageService],
  exports: [R2StorageService],
})
export class UploadsModule {}

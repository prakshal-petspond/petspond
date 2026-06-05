import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { R2StorageService } from '@/storage/r2-storage.service';

/** Serves uploaded images from R2 through the API (private bucket safe). */
@Controller('public/files')
export class PublicFilesController {
  constructor(private readonly storage: R2StorageService) {}

  @Get(':folder/:userId/:filename')
  async serveNested(
    @Param('folder') folder: string,
    @Param('userId') userId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.serveKey(`${folder}/${userId}/${filename}`, res);
  }

  private async serveKey(key: string, res: Response) {
    try {
      const { buffer, contentType } = await this.storage.getObject(key);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}

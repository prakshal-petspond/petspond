import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

@Injectable()
export class R2StorageService {
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? 'petspond';

    this.client =
      accountId && accessKeyId && secretAccessKey
        ? new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  /** App-served URL (works with private R2 buckets). Prefer over raw R2 URLs on mobile. */
  buildFileUrl(key: string): string {
    const apiBase = (
      this.config.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${this.config.get<string>('PORT') ?? 3000}`
    ).replace(/\/$/, '');
    return `${apiBase}/public/files/${key}`;
  }

  async getObject(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    if (!this.client) {
      throw new BadRequestException('Image storage is not configured.');
    }
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes?.length) throw new NotFoundException('File not found');
    return {
      buffer: Buffer.from(bytes),
      contentType: response.ContentType ?? 'application/octet-stream',
    };
  }

  async uploadImage(file: Express.Multer.File, folder: string): Promise<{ url: string; key: string }> {
    if (!this.client) {
      throw new BadRequestException(
        'Image storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.',
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file provided');
    }

    const contentType = file.mimetype || 'image/jpeg';
    const ext = EXT_BY_MIME[contentType] ?? '.jpg';
    const key = `${folder.replace(/\/$/, '')}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
      }),
    );

    return { url: this.buildFileUrl(key), key };
  }
}

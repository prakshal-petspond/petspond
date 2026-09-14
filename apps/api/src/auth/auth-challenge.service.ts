import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

const DEFAULT_OTP_TTL_MS = 5 * 60 * 1000;
const DEFAULT_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  async setOtp(kind: string, subject: string, otp: string, ttlMs = DEFAULT_OTP_TTL_MS): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs);
    await this.prisma.authChallenge.upsert({
      where: { kind_subject: { kind, subject } },
      create: {
        kind,
        subject,
        codeHash: hashSecret(otp),
        expiresAt,
        attempts: 0,
      },
      update: {
        codeHash: hashSecret(otp),
        expiresAt,
        attempts: 0,
        payload: Prisma.JsonNull,
      },
    });
  }

  /** Consumes the challenge (one-shot). */
  async consumeOtp(
    kind: string,
    subject: string,
    otp: string,
  ): Promise<'ok' | 'missing' | 'mismatch'> {
    const row = await this.prisma.authChallenge.findUnique({
      where: { kind_subject: { kind, subject } },
    });
    if (!row) return 'missing';
    await this.prisma.authChallenge.delete({ where: { id: row.id } }).catch(() => undefined);
    if (row.expiresAt.getTime() < Date.now()) return 'missing';
    return row.codeHash === hashSecret(otp.trim()) ? 'ok' : 'mismatch';
  }

  /** Peek whether a non-expired OTP exists (does not consume). */
  async hasOtp(kind: string, subject: string): Promise<boolean> {
    const row = await this.prisma.authChallenge.findUnique({
      where: { kind_subject: { kind, subject } },
    });
    if (!row) return false;
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.authChallenge.delete({ where: { id: row.id } }).catch(() => undefined);
      return false;
    }
    return true;
  }

  async createToken(
    kind: string,
    email: string,
    ttlMs = DEFAULT_TOKEN_TTL_MS,
  ): Promise<string> {
    const token = `${kind}_${Date.now().toString(36)}_${randomBytes(8).toString('hex')}`;
    const subject = token;
    await this.prisma.authChallenge.upsert({
      where: { kind_subject: { kind, subject } },
      create: {
        kind,
        subject,
        codeHash: hashSecret(token),
        payload: { email: email.toLowerCase().trim() },
        expiresAt: new Date(Date.now() + ttlMs),
      },
      update: {
        codeHash: hashSecret(token),
        payload: { email: email.toLowerCase().trim() },
        expiresAt: new Date(Date.now() + ttlMs),
        attempts: 0,
      },
    });
    return token;
  }

  async consumeToken(kind: string, token: string): Promise<string | null> {
    const row = await this.prisma.authChallenge.findUnique({
      where: { kind_subject: { kind, subject: token } },
    });
    if (!row) return null;
    await this.prisma.authChallenge.delete({ where: { id: row.id } }).catch(() => undefined);
    if (row.expiresAt.getTime() < Date.now()) return null;
    if (row.codeHash !== hashSecret(token)) return null;
    const payload = row.payload as { email?: string } | null;
    return payload?.email ?? null;
  }

  async purgeExpired(): Promise<number> {
    const result = await this.prisma.authChallenge.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

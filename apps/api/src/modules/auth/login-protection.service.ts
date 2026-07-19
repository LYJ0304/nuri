import { createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_ATTEMPTS = 30;
const MAX_ACCOUNT_FAILURES = 5;
const INVALID_CREDENTIALS = 'Invalid email or password';

type LoginMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type LoginFailureReason = 'INVALID_CREDENTIALS' | 'ACCOUNT_INACTIVE';

@Injectable()
export class LoginProtectionService {
  constructor(private readonly prisma: PrismaService) {}

  async assertAllowed(email: string, metadata: LoginMetadata): Promise<void> {
    const since = new Date(Date.now() - WINDOW_MS);
    const emailHash = this.hashEmail(email);
    const ipAddress = this.normalizeIp(metadata.ipAddress);
    const [ipAttempts, accountFailures] = await this.prisma.$transaction([
      this.prisma.loginSecurityEvent.count({
        where: { ipAddress, createdAt: { gte: since } },
      }),
      this.prisma.loginSecurityEvent.count({
        where: {
          emailHash,
          outcome: 'FAILURE',
          createdAt: { gte: since },
        },
      }),
    ]);

    if (ipAttempts >= MAX_IP_ATTEMPTS || accountFailures >= MAX_ACCOUNT_FAILURES) {
      await this.writeEvent(email, null, metadata, 'BLOCKED', 'RATE_LIMITED');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
  }

  async recordFailure(
    email: string,
    userId: string | null,
    metadata: LoginMetadata,
    reason: LoginFailureReason,
  ): Promise<never> {
    await this.writeEvent(email, userId, metadata, 'FAILURE', reason);
    throw new UnauthorizedException(INVALID_CREDENTIALS);
  }

  async recordSuccess(
    email: string,
    userId: string,
    metadata: LoginMetadata,
  ): Promise<void> {
    await this.writeEvent(email, userId, metadata, 'SUCCESS', null);
  }

  private writeEvent(
    email: string,
    userId: string | null,
    metadata: LoginMetadata,
    outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
    reason: LoginFailureReason | 'RATE_LIMITED' | null,
  ) {
    return this.prisma.loginSecurityEvent.create({
      data: {
        userId,
        emailHash: this.hashEmail(email),
        ipAddress: this.normalizeIp(metadata.ipAddress),
        userAgent: metadata.userAgent?.slice(0, 512),
        outcome,
        reason,
      },
    });
  }

  private hashEmail(email: string): string {
    return createHash('sha256').update(email).digest('hex');
  }

  private normalizeIp(ipAddress: string | undefined): string {
    return ipAddress?.slice(0, 64) || 'unknown';
  }
}

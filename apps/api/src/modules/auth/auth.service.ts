import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { AuthSessionListResponse, AuthTokenResponse } from '@nuri/contracts';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { SignInDto } from '../dto/sign-in.dto';
import { SignUpDto } from '../dto/sign-up.dto';
import { UserService } from '../users/users.service';
import { hashRefreshToken } from './refresh-token-hash';

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type RefreshTokenPayload = {
  sub: string;
  sid: string;
  jti: string;
  type: 'refresh';
  exp: number;
};

type AuthResult = {
  response: AuthTokenResponse;
  refreshToken: string;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: JwtSignOptions['expiresIn'];

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as JwtSignOptions['expiresIn'] ?? '30d';
  }

  async signUp(dto: SignUpDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.userService.create(normalizedEmail, passwordHash);

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async signIn(dto: SignInDto, metadata: SessionMetadata): Promise<AuthResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);

    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Account is not active');

    const sessionId = randomUUID();
    const refreshToken = await this.signInitialRefreshToken(user.id, sessionId);
    const refreshExpiresAt = this.readTokenExpiration(refreshToken);

    const result = await this.createAuthResult(user, sessionId, refreshToken, refreshExpiresAt);

    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshExpiresAt,
        userAgent: metadata.userAgent?.slice(0, 512),
        ipAddress: metadata.ipAddress?.slice(0, 64),
      },
    });

    return result;
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');

    const payload = await this.verifyRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    const now = new Date();

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= now
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const presentedHash = hashRefreshToken(refreshToken);
    if (!this.hashesMatch(presentedHash, session.refreshTokenHash)) {
      await this.markSessionRevoked(session.id, now);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.user.status !== 'ACTIVE') {
      await this.markSessionRevoked(session.id, now);
      throw new UnauthorizedException('Account is not active');
    }

    const rotatedRefreshToken = await this.signRotatedRefreshToken(
      session.userId,
      session.id,
      session.expiresAt,
    );
    const result = await this.createAuthResult(
      session.user,
      session.id,
      rotatedRefreshToken,
      session.expiresAt,
    );
    const rotatedHash = hashRefreshToken(rotatedRefreshToken);
    const rotation = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: presentedHash,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        refreshTokenHash: rotatedHash,
        lastUsedAt: now,
      },
    });

    if (rotation.count !== 1) {
      await this.markSessionRevoked(session.id, now);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return result;
  }

  async signOut(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      await this.prisma.authSession.updateMany({
        where: { id: payload.sid, userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      return;
    }
  }

  async signOutAll(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listSessions(
    userId: string,
    currentSessionId: string | undefined,
  ): Promise<AuthSessionListResponse> {
    const sessions = await this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: session.id === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.authSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createAuthResult(
    user: { id: string; email: string },
    sessionId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<AuthResult> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      sid: sessionId,
    });

    return {
      response: {
        accessToken,
        user: { id: user.id, email: user.email },
      },
      refreshToken,
      refreshExpiresAt,
    };
  }

  private signInitialRefreshToken(userId: string, sessionId: string) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        jti: randomUUID(),
        type: 'refresh',
      },
      {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
      },
    );
  }

  private signRotatedRefreshToken(
    userId: string,
    sessionId: string,
    expiresAt: Date,
  ) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        sid: sessionId,
        jti: randomUUID(),
        type: 'refresh',
      },
      {
        secret: this.refreshSecret,
        expiresIn: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
      },
    );
  }

  private async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
        secret: this.refreshSecret,
      });
      if (
        payload.type !== 'refresh' ||
        !payload.sub ||
        !payload.sid ||
        !payload.jti ||
        !payload.exp
      ) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private readTokenExpiration(token: string): Date {
    const payload = this.jwtService.decode<{ exp?: number }>(token);
    if (!payload?.exp) throw new Error('Refresh token has no expiration');
    return new Date(payload.exp * 1000);
  }

  private hashesMatch(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private async markSessionRevoked(sessionId: string, revokedAt: Date): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt },
    });
  }
}

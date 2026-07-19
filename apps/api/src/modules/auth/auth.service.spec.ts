import assert from 'node:assert/strict';
import test from 'node:test';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { UserService } from '../users/users.service';
import { AuthService } from './auth.service';
import { readRefreshTokenCookie } from './refresh-token-cookie';
import { hashRefreshToken } from './refresh-token-hash';

type TestUser = {
  id: string;
  email: string;
  passwordHash: string;
  status: 'ACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

type TestSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UpdateSessionArgs = {
  where: {
    id?: string;
    userId?: string;
    refreshTokenHash?: string;
    revokedAt?: null;
    expiresAt?: { gt: Date };
  };
  data: {
    refreshTokenHash?: string;
    lastUsedAt?: Date;
    revokedAt?: Date;
  };
};

async function createHarness() {
  const password = 'correct horse battery staple';
  const user: TestUser = {
    id: 'user-1',
    email: 'counselor@example.com',
    passwordHash: await argon2.hash(password),
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let session: TestSession | undefined;

  const userService = {
    findByEmail: async (email: string) => {
      await Promise.resolve();
      return email === user.email ? user : null;
    },
  } as unknown as UserService;

  const prisma = {
    authSession: {
      create: async ({ data }: { data: Omit<TestSession, 'lastUsedAt' | 'revokedAt' | 'createdAt' | 'updatedAt'> }) => {
        await Promise.resolve();
        const now = new Date();
        session = {
          ...data,
          lastUsedAt: null,
          revokedAt: null,
          createdAt: now,
          updatedAt: now,
        };
        return session;
      },
      findUnique: async () => {
        await Promise.resolve();
        return session ? { ...session, user } : null;
      },
      findFirst: async ({ where }: { where: { id?: string; userId?: string; revokedAt?: null; expiresAt?: { gt: Date } } }) => {
        await Promise.resolve();
        if (!session || (where.id && session.id !== where.id) || (where.userId && session.userId !== where.userId)) return null;
        if (where.revokedAt === null && session.revokedAt !== null) return null;
        if (where.expiresAt && session.expiresAt <= where.expiresAt.gt) return null;
        return { ...session, user };
      },
      findMany: async () => {
        await Promise.resolve();
        return session && !session.revokedAt && session.expiresAt > new Date() ? [session] : [];
      },
      updateMany: async ({ where, data }: UpdateSessionArgs) => {
        await Promise.resolve();
        if (!session) return { count: 0 };
        if (where.id && session.id !== where.id) return { count: 0 };
        if (where.userId && session.userId !== where.userId) return { count: 0 };
        if (where.refreshTokenHash && session.refreshTokenHash !== where.refreshTokenHash) return { count: 0 };
        if (where.revokedAt === null && session.revokedAt !== null) return { count: 0 };
        if (where.expiresAt && session.expiresAt <= where.expiresAt.gt) return { count: 0 };
        session = { ...session, ...data, updatedAt: new Date() };
        return { count: 1 };
      },
    },
  } as unknown as PrismaService;

  const config = new ConfigService({
    JWT_ACCESS_SECRET: 'access-secret-for-auth-service-tests',
    JWT_REFRESH_SECRET: 'refresh-secret-for-auth-service-tests',
    JWT_REFRESH_EXPIRES_IN: '30d',
  });
  const jwt = new JwtService({
    secret: 'access-secret-for-auth-service-tests',
    signOptions: { expiresIn: '15m' },
  });
  const service = new AuthService(userService, jwt, config, prisma);

  return {
    password,
    service,
    prisma,
    config,
    jwt,
    user,
    getSession: () => session,
  };
}

void test('rotates refresh tokens and revokes the session when an old token is reused', async () => {
  const harness = await createHarness();
  const signedIn = await harness.service.signIn(
    { email: 'counselor@example.com', password: harness.password },
    { userAgent: 'test-agent', ipAddress: '127.0.0.1' },
  );
  const initialSession = harness.getSession();

  assert.ok(initialSession);
  assert.equal(initialSession.refreshTokenHash, hashRefreshToken(signedIn.refreshToken));
  assert.notEqual(initialSession.refreshTokenHash, signedIn.refreshToken);

  const refreshed = await harness.service.refresh(signedIn.refreshToken);
  const rotatedSession = harness.getSession();

  assert.ok(rotatedSession?.lastUsedAt);
  assert.equal(rotatedSession.refreshTokenHash, hashRefreshToken(refreshed.refreshToken));
  assert.notEqual(refreshed.refreshToken, signedIn.refreshToken);

  await assert.rejects(
    () => harness.service.refresh(signedIn.refreshToken),
    UnauthorizedException,
  );
  assert.ok(harness.getSession()?.revokedAt);
});

void test('reads only the configured refresh cookie', () => {
  const request = {
    headers: {
      cookie: 'other=value; nuri_refresh_token=token%2Evalue',
    },
  };

  assert.equal(readRefreshTokenCookie(request as never), 'token.value');
});

void test('lists active sessions without token hashes and revokes owned sessions', async () => {
  const harness = await createHarness();
  const signedIn = await harness.service.signIn(
    { email: 'counselor@example.com', password: harness.password },
    { userAgent: 'test-agent', ipAddress: '127.0.0.1' },
  );
  const session = harness.getSession();
  assert.ok(session);

  const sessions = await harness.service.listSessions(harness.user.id, session.id);
  assert.deepEqual(sessions, [
    {
      id: session.id,
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: null,
      expiresAt: session.expiresAt.toISOString(),
      isCurrent: true,
    },
  ]);
  const listedSession = sessions[0];
  assert.ok(listedSession);
  assert.equal('refreshTokenHash' in listedSession, false);

  await assert.rejects(
    () => harness.service.revokeSession('another-user', session.id),
    NotFoundException,
  );
  await harness.service.revokeSession(harness.user.id, session.id);
  assert.ok(harness.getSession()?.revokedAt);
  assert.deepEqual(await harness.service.listSessions(harness.user.id, session.id), []);

  await harness.service.signOut(signedIn.refreshToken);
});

void test('rejects access tokens as soon as all sessions are revoked', async () => {
  const harness = await createHarness();
  const signedIn = await harness.service.signIn(
    { email: 'counselor@example.com', password: harness.password },
    {},
  );
  const payload = await harness.jwt.verifyAsync<{
    sub: string;
    email: string;
    sid: string;
  }>(signedIn.response.accessToken);
  const strategy = new JwtStrategy(harness.config, harness.prisma);

  assert.equal((await strategy.validate(payload)).sessionId, payload.sid);
  await harness.service.signOutAll(harness.user.id);
  await assert.rejects(() => strategy.validate(payload), UnauthorizedException);
});

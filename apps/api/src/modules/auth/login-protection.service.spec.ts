import assert from 'node:assert/strict';
import test from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginProtectionService } from './login-protection.service';

type EventData = {
  userId: string | null;
  emailHash: string;
  ipAddress: string;
  userAgent?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  reason: string | null;
};

function createHarness(counts: number[]) {
  const events: EventData[] = [];
  const prisma = {
    $transaction: (operations: Array<Promise<number>>) => Promise.all(operations),
    loginSecurityEvent: {
      count: () => Promise.resolve(counts.shift() ?? 0),
      create: ({ data }: { data: EventData }) => {
        events.push(data);
        return Promise.resolve(data);
      },
    },
  } as unknown as PrismaService;

  return { service: new LoginProtectionService(prisma), events };
}

void test('blocks repeated account failures with the generic login message', async () => {
  const { service, events } = createHarness([0, 5]);

  await assert.rejects(
    () => service.assertAllowed('counselor@example.com', { ipAddress: '127.0.0.1' }),
    (error: unknown) =>
      error instanceof UnauthorizedException &&
      error.message === 'Invalid email or password',
  );
  assert.equal(events[0]?.outcome, 'BLOCKED');
  assert.equal(events[0]?.reason, 'RATE_LIMITED');
});

void test('records login outcomes without storing the raw email', async () => {
  const { service, events } = createHarness([0, 0]);
  await service.assertAllowed('counselor@example.com', { ipAddress: '127.0.0.1' });
  await service.recordSuccess('counselor@example.com', 'user-1', {
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  });

  assert.equal(events[0]?.outcome, 'SUCCESS');
  assert.equal(events[0]?.emailHash.length, 64);
  assert.notEqual(events[0]?.emailHash, 'counselor@example.com');
  assert.equal(events[0]?.userAgent, 'test-agent');
});

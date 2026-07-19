import assert from 'node:assert/strict';
import test from 'node:test';
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TrustedOriginGuard } from './trusted-origin.guard';

function createContext(origin: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        get: (name: string) => name.toLowerCase() === 'origin' ? origin : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

const guard = new TrustedOriginGuard(new ConfigService({
  WEB_ORIGIN: 'http://localhost:3000',
}));

void test('allows the configured web origin', () => {
  assert.equal(guard.canActivate(createContext('http://localhost:3000')), true);
});

void test('rejects missing, malformed, and untrusted origins', () => {
  assert.throws(() => guard.canActivate(createContext(undefined)), ForbiddenException);
  assert.throws(() => guard.canActivate(createContext('not-a-url')), ForbiddenException);
  assert.throws(() => guard.canActivate(createContext('https://attacker.example')), ForbiddenException);
});

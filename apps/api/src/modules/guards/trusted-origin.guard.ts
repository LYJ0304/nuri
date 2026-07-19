import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class TrustedOriginGuard implements CanActivate {
  private readonly trustedOrigin: string;

  constructor(configService: ConfigService) {
    this.trustedOrigin = new URL(
      configService.getOrThrow<string>('WEB_ORIGIN'),
    ).origin;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const origin = request.get('origin');

    if (!origin) throw new ForbiddenException('Origin is required');

    try {
      if (new URL(origin).origin !== this.trustedOrigin) {
        throw new ForbiddenException('Origin is not allowed');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Origin is not allowed');
    }

    return true;
  }
}

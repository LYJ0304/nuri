import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const trustedProxies = (process.env.TRUSTED_PROXY_IPS ?? 'loopback')
    .split(',')
    .map((proxy) => proxy.trim())
    .filter(Boolean);
  app.set('trust proxy', trustedProxies);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.API_PORT ?? 3001, '0.0.0.0');
}
void bootstrap();

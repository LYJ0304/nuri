import { Module } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { JwtModule } from '@nestjs/jwt';
  import { PassportModule } from '@nestjs/passport';
  import { UsersModule } from '../users/users.module';
  import { AuthController } from './auth.controller';
  import { AuthService } from './auth.service';
  import { JwtAuthGuard } from './guards/jwt-auth.guard';
  import { JwtStrategy } from './strategies/jwt.strategy';

  @Module({
    imports: [
      UsersModule,
      PassportModule,
      JwtModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn:
              configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
          },
        }),
      }),
    ],
    controllers: [AuthController],
    providers: [
      AuthService,
      JwtStrategy,
      JwtAuthGuard,
    ],
    exports: [
      AuthService,
      JwtAuthGuard,
    ],
  })
  export class AuthModule {}

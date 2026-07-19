import { plainToInstance } from 'class-transformer';
import { IsInt, IsString, IsUrl, Matches, Max, Min, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1)
  REDIS_URL!: string;

  @IsUrl({ require_tld: false })
  AI_WORKER_URL!: string;

  @IsUrl({ require_tld: false })
  WEB_ORIGIN = 'http://localhost:3000';

  @IsString()
  @MinLength(1)
  TRUSTED_PROXY_IPS = 'loopback';

  @IsInt() @Min(1) @Max(65535) API_PORT = 3001;
  @IsString() @MinLength(32) JWT_ACCESS_SECRET!: string;
  @IsString() @Matches(/^\d+[smhd]$/) JWT_ACCESS_EXPIRES_IN = '15m';
  @IsString() @MinLength(32) JWT_REFRESH_SECRET!: string;
  @IsString() @Matches(/^\d+[smhd]$/) JWT_REFRESH_EXPIRES_IN = '30d';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}

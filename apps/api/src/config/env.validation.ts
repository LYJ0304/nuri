import { plainToInstance } from 'class-transformer';
import { IsInt, IsString, IsUrl, Max, Min, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsUrl({ require_tld: false }) DATABASE_URL!: string;
  @IsUrl({ require_tld: false }) REDIS_URL!: string;
  @IsUrl({ require_tld: false }) AI_WORKER_URL!: string;
  @IsInt() @Min(1) @Max(65535) API_PORT = 3001;
  @IsString() @MinLength(32) JWT_ACCESS_SECRET!: string;
  @IsString() JWT_ACCESS_EXPIRES_IN = '15m';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) throw new Error(errors.toString());
  return validated;
}

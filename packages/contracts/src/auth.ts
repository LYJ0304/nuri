import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: AuthUserSchema,
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;

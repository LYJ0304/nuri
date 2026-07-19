import { z } from 'zod';

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

export const AuthTokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  user: AuthUserSchema,
});

export const AuthenticatedUserSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
});

export const AuthSessionSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.string().datetime(),
  lastUsedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
  isCurrent: z.boolean(),
});

export const AuthSessionListResponseSchema = z.array(AuthSessionSchema);

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthTokenResponse = z.infer<typeof AuthTokenResponseSchema>;
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthSessionListResponse = z.infer<typeof AuthSessionListResponseSchema>;

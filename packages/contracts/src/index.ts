import { z } from 'zod';

export * from './cases.js';
export * from './consultations.js';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

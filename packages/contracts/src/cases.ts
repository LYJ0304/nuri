import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const CreateCaseRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: optionalText(30),
  clientEmail: z.string().trim().email().optional().nullable(),
  clientBirthDate: z.string().date().optional().nullable(),
  clientAddress: optionalText(500),
  clientMemo: optionalText(2_000),
});

export const UpdateCaseRequestSchema = CreateCaseRequestSchema.partial();

export const CaseListQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'CLOSED', 'ARCHIVED']).optional(),
});

export type CreateCaseRequest = z.infer<typeof CreateCaseRequestSchema>;
export type UpdateCaseRequest = z.infer<typeof UpdateCaseRequestSchema>;
export type CaseListQuery = z.infer<typeof CaseListQuerySchema>;

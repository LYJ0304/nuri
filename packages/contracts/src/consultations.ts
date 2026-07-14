import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const ConsultationContentSchema = z.object({
  presentingProblem: z.string().trim().min(1).max(10_000),
  observations: optionalText(10_000),
  interventions: optionalText(10_000),
  clientResponse: optionalText(10_000),
  assessment: optionalText(10_000),
  followUpPlan: optionalText(10_000),
  privateNote: optionalText(10_000),
});

export const CreateConsultationRequestSchema = z.object({
  occurredAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(1_440).optional().nullable(),
  channel: z.enum(['IN_PERSON', 'PHONE', 'VIDEO', 'OTHER']),
  subject: optionalText(200),
  summary: optionalText(2_000),
  content: ConsultationContentSchema,
});

export const UpdateConsultationRequestSchema = z.object({
  version: z.number().int().positive(),
  occurredAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().min(1).max(1_440).optional().nullable(),
  channel: z.enum(['IN_PERSON', 'PHONE', 'VIDEO', 'OTHER']).optional(),
  subject: optionalText(200),
  summary: optionalText(2_000),
  content: ConsultationContentSchema.optional(),
});

export const FinalizeConsultationRequestSchema = z.object({
  version: z.number().int().positive(),
});

export const AmendConsultationRequestSchema = z.object({
  version: z.number().int().positive(),
  changeReason: z.string().trim().min(1).max(500),
  content: ConsultationContentSchema,
});

export const DeleteConsultationRequestSchema = z.object({
  version: z.number().int().positive(),
});

export const ConsultationListQuerySchema = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'FINALIZED', 'AMENDED']).optional(),
});

export type ConsultationContent = z.infer<typeof ConsultationContentSchema>;
export type CreateConsultationRequest = z.infer<
  typeof CreateConsultationRequestSchema
>;
export type UpdateConsultationRequest = z.infer<
  typeof UpdateConsultationRequestSchema
>;
export type FinalizeConsultationRequest = z.infer<
  typeof FinalizeConsultationRequestSchema
>;
export type AmendConsultationRequest = z.infer<
  typeof AmendConsultationRequestSchema
>;
export type DeleteConsultationRequest = z.infer<
  typeof DeleteConsultationRequestSchema
>;
export type ConsultationListQuery = z.infer<
  typeof ConsultationListQuerySchema
>;

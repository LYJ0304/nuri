import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

const optionalText = z.string().optional();

export const ClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthDate: optionalText,
  gender: optionalText,
  occupation: optionalText,
  phoneNumber: optionalText,
  address: optionalText,
  protectionCategory: optionalText,
  householdType: optionalText,
  hasDisability: optionalText,
  longTermCare: optionalText,
  emergencyContact: optionalText,
  housingType: optionalText,
  housingOwnership: optionalText,
  familyRelationship: optionalText,
  familyName: optionalText,
  familyGender: optionalText,
  familyBirthDate: optionalText,
  familyOccupation: optionalText,
  familyCohabitation: optionalText,
  familyNotes: optionalText,
  createdAt: z.string(),
});

export const CreateClientRequestSchema = ClientSchema.omit({ id: true, createdAt: true }).extend({
  name: z.string().min(1),
});

export const CounselingRecordSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  title: z.string(),
  sessionDate: z.string(),
  sessionType: z.string(),
  sessionNumber: z.number().int().positive().optional(),
  presentingConcern: z.string(),
  sessionContent: z.string(),
  counselorObservation: optionalText,
  intervention: optionalText,
  riskLevel: z.enum(['none', 'attention', 'urgent']),
  followUpPlan: optionalText,
  summaryStatus: z.enum(['not-requested', 'pending', 'completed']),
  createdAt: z.string(),
});

export const CreateCounselingRecordRequestSchema = CounselingRecordSchema.omit({ id: true, clientId: true, createdAt: true }).extend({
  title: z.string().min(1),
  presentingConcern: z.string().min(1),
  sessionContent: z.string().min(1),
});

export const ClientListResponseSchema = z.array(ClientSchema);
export const CounselingRecordListResponseSchema = z.array(CounselingRecordSchema);

export type Client = z.infer<typeof ClientSchema>;
export type CreateClientRequest = z.infer<typeof CreateClientRequestSchema>;
export type CounselingRecord = z.infer<typeof CounselingRecordSchema>;
export type CreateCounselingRecordRequest = z.infer<typeof CreateCounselingRecordRequestSchema>;

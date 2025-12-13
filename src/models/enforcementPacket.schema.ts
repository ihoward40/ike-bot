import { z } from 'zod';

export const enforcementPacketSchema = z.object({
  id: z.string().uuid().optional(),
  beneficiary_id: z.string().uuid('Invalid beneficiary ID'),
  packet_type: z.enum(['ucc_lien', 'foia_request', 'irs_rebuttal', 'affidavit', 'notice_of_default', 'other']),
  description: z.string().optional(),
  status: z.enum(['draft', 'pending', 'sent', 'completed', 'failed']).default('draft'),
  target_agency: z.string().optional(),
  documents: z.record(z.string(), z.any()).optional(),
  tracking_number: z.string().optional(),
  date_sent: z.string().optional(),
  date_completed: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createEnforcementPacketSchema = enforcementPacketSchema.omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const updateEnforcementPacketSchema = createEnforcementPacketSchema.partial().omit({ beneficiary_id: true });

export const listEnforcementPacketsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['draft', 'pending', 'sent', 'completed', 'failed']).optional(),
  beneficiary_id: z.string().uuid().optional(),
  packet_type: z.enum(['ucc_lien', 'foia_request', 'irs_rebuttal', 'affidavit', 'notice_of_default', 'other']).optional(),
});

export type EnforcementPacket = z.infer<typeof enforcementPacketSchema>;
export type CreateEnforcementPacketInput = z.infer<typeof createEnforcementPacketSchema>;
export type UpdateEnforcementPacketInput = z.infer<typeof updateEnforcementPacketSchema>;
export type ListEnforcementPacketsQuery = z.infer<typeof listEnforcementPacketsQuerySchema>;

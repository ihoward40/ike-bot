import { z } from 'zod';

export const documentTypeEnum = z.enum([
  'bill',
  'invoice',
  'notice',
  'summons',
  'complaint',
  'contract',
  'promissory_note',
  'unknown'
]);

export const processDocumentSchema = z.object({
  content: z.string().min(1, 'Document content is required'),
  document_type: documentTypeEnum.optional(),
  beneficiary_id: z.string().uuid('Invalid beneficiary ID format').optional()
});

export const listDocumentsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  document_type: documentTypeEnum.optional(),
  beneficiary_id: z.string().uuid('Invalid beneficiary ID format').optional(),
  afv_present: z.string().optional().transform(val => val === 'true'),
  discharge_eligible: z.string().optional().transform(val => val === 'true')
});

export const getDischargeEligibleQuerySchema = z.object({
  beneficiary_id: z.string().uuid('Invalid beneficiary ID format').optional()
});

export type ProcessDocumentInput = z.infer<typeof processDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
export type GetDischargeEligibleQuery = z.infer<typeof getDischargeEligibleQuerySchema>;

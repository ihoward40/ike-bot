import { Request, Response } from 'express';
import { DocumentService } from '../document-intelligence/DocumentService';
import { DocumentType } from '../document-intelligence/types';
import {
  processDocumentSchema,
  listDocumentsQuerySchema,
  getDischargeEligibleQuerySchema
} from '../models/document.schema';

const documentService = new DocumentService();

/**
 * Process a document using the Document Intelligence Module
 */
export const processDocument = async (req: Request, res: Response) => {
  const input = processDocumentSchema.parse(req.body);
  const result = await documentService.processAndStore(
    input.content,
    input.document_type as DocumentType | undefined,
    input.beneficiary_id
  );
  res.status(201).json(result);
};

/**
 * Get a document by ID
 */
export const getDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  const document = await documentService.getById(id);
  res.json(document);
};

/**
 * List documents with optional filtering
 */
export const listDocuments = async (req: Request, res: Response) => {
  const query = listDocumentsQuerySchema.parse(req.query);
  const result = await documentService.list({
    page: query.page,
    limit: query.limit,
    documentType: query.document_type as DocumentType | undefined,
    beneficiaryId: query.beneficiary_id,
    afvPresent: query.afv_present,
    dischargeEligible: query.discharge_eligible
  });
  res.json(result);
};

/**
 * Get documents eligible for discharge
 */
export const getDischargeEligibleDocuments = async (req: Request, res: Response) => {
  const query = getDischargeEligibleQuerySchema.parse(req.query);
  const documents = await documentService.findDischargeEligible(query.beneficiary_id);
  res.json(documents);
};

/**
 * Get processing log for a document
 */
export const getDocumentProcessingLog = async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = await documentService.getProcessingLog(id);
  res.json(log);
};

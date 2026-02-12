-- Document Intelligence Module Tables
-- Tables for storing processed documents and analysis results

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'bill', 'invoice', 'notice', 'summons', 'complaint', 
        'contract', 'promissory_note', 'unknown'
    )),
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE SET NULL,
    
    -- Document processing results
    processing_confidence DECIMAL(3, 2),
    entities JSONB,
    parties JSONB,
    dates JSONB,
    amounts JSONB,
    references JSONB,
    
    -- AFV status
    afv_present BOOLEAN DEFAULT FALSE,
    afv_notation TEXT,
    afv_location JSONB,
    afv_confidence DECIMAL(3, 2),
    afv_exempt_from_levy BOOLEAN DEFAULT FALSE,
    
    -- Discharge eligibility
    discharge_eligible BOOLEAN DEFAULT FALSE,
    discharge_days_remaining INTEGER,
    discharge_date DATE,
    discharge_reason TEXT,
    compliance_issues JSONB,
    
    -- Commercial instrument details
    instrument_type VARCHAR(50),
    issuance_date DATE,
    instrument_amount DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_processing_log table for tracking processing history
CREATE TABLE IF NOT EXISTS document_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    processing_stage VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_beneficiary_id ON documents(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_documents_afv_present ON documents(afv_present);
CREATE INDEX IF NOT EXISTS idx_documents_discharge_eligible ON documents(discharge_eligible);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_issuance_date ON documents(issuance_date);

CREATE INDEX IF NOT EXISTS idx_document_processing_log_document_id ON document_processing_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_log_status ON document_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_document_processing_log_created_at ON document_processing_log(created_at);

-- Add trigger for updated_at column on documents
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Stores legal documents and their processing results from the Document Intelligence Module';
COMMENT ON TABLE document_processing_log IS 'Tracks the processing history of documents through various stages';

COMMENT ON COLUMN documents.afv_present IS 'Whether Accepted for Value notation was detected';
COMMENT ON COLUMN documents.discharge_eligible IS 'Whether the document is eligible for discharge based on 30-day rule';
COMMENT ON COLUMN documents.processing_confidence IS 'Overall confidence score for document processing (0-1)';
COMMENT ON COLUMN documents.entities IS 'Extracted entities in JSON format (parties, dates, amounts, references)';
COMMENT ON COLUMN documents.compliance_issues IS 'Array of compliance issues that prevent discharge eligibility';

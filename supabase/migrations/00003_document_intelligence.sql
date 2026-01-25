-- Create documents table for Document Intelligence Module
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    afv_status JSONB,
    discharge_eligibility JSONB,
    entities JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_afv_status ON documents USING GIN (afv_status);

-- Add trigger for updated_at column
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE documents IS 'Stores processed legal documents with AFV notation detection and discharge eligibility assessment';
COMMENT ON COLUMN documents.content IS 'Full text content of the document';
COMMENT ON COLUMN documents.type IS 'Document type classification (promissory_note, invoice, bill, etc.)';
COMMENT ON COLUMN documents.afv_status IS 'AFV (Accepted for Value) status with notations and dates';
COMMENT ON COLUMN documents.discharge_eligibility IS 'Discharge eligibility assessment based on 30-day rule';
COMMENT ON COLUMN documents.entities IS 'Extracted entities (parties, dates, amounts, references)';
COMMENT ON COLUMN documents.metadata IS 'Processing metadata including confidence scores and timestamps';

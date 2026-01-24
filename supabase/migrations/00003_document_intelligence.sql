-- Create processed_documents table for Document Intelligence Module
CREATE TABLE IF NOT EXISTS processed_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'affidavit',
        'notice',
        'commercial_instrument',
        'promissory_note',
        'bill_of_exchange',
        'invoice',
        'contract',
        'correspondence',
        'court_filing',
        'other'
    )),
    title VARCHAR(500),
    text_content TEXT NOT NULL,
    
    -- AFV Detection Results
    afv_found BOOLEAN NOT NULL DEFAULT FALSE,
    afv_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    afv_notation_text TEXT,
    afv_notation_type VARCHAR(50),
    afv_date DATE,
    
    -- Exemption Information
    has_exemption BOOLEAN NOT NULL DEFAULT FALSE,
    exemption_text TEXT,
    
    -- Compliance
    is_compliant BOOLEAN NOT NULL DEFAULT FALSE,
    compliance_issues JSONB,
    
    -- Discharge Eligibility
    discharge_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    discharge_date DATE,
    days_remaining INTEGER,
    discharge_period_expired BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Classification
    classification_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    
    -- Entities
    entity_count INTEGER DEFAULT 0,
    entities JSONB, -- Array of extracted entities
    
    -- Metadata
    source VARCHAR(200),
    file_size INTEGER,
    mime_type VARCHAR(100),
    storage_location TEXT,
    received_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_processed_documents_document_type ON processed_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_processed_documents_afv_found ON processed_documents(afv_found);
CREATE INDEX IF NOT EXISTS idx_processed_documents_discharge_eligible ON processed_documents(discharge_eligible);
CREATE INDEX IF NOT EXISTS idx_processed_documents_discharge_date ON processed_documents(discharge_date);
CREATE INDEX IF NOT EXISTS idx_processed_documents_created_at ON processed_documents(created_at);

-- Create full-text search index for text content
CREATE INDEX IF NOT EXISTS idx_processed_documents_text_content_fts 
    ON processed_documents USING gin(to_tsvector('english', text_content));

-- Add trigger for updated_at column
CREATE TRIGGER update_processed_documents_updated_at BEFORE UPDATE ON processed_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table
COMMENT ON TABLE processed_documents IS 'Stores processed legal documents with AFV detection and discharge eligibility assessment';

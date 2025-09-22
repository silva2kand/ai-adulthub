-- 2257 Record Keeping Requirements for Adult Content
-- This table stores performer ID verification data per 18 U.S.C. § 2257

CREATE TABLE performer_records (
  id SERIAL PRIMARY KEY,
  performer_name VARCHAR(255) NOT NULL,
  id_type VARCHAR(50) NOT NULL, -- 'passport', 'drivers_license', 'state_id', etc.
  id_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  date_of_birth DATE NOT NULL,
  id_image_url TEXT NOT NULL, -- S3 URL for ID document scan
  signature_url TEXT NOT NULL, -- S3 URL for signature
  producer_name VARCHAR(255) NOT NULL DEFAULT 'Adult Video Aggregator LLC',
  producer_address TEXT NOT NULL DEFAULT '123 Main St, Los Angeles, CA 90210',
  content_ids JSONB NOT NULL, -- Array of video IDs this performer appears in
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'verified', 'pending', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure each ID number is unique per ID type
  UNIQUE(id_type, id_number)
);

-- Index for fast content ID lookups
CREATE INDEX idx_performer_content_ids ON performer_records USING GIN(content_ids);

-- Index for performer name searches
CREATE INDEX idx_performer_name ON performer_records(performer_name);

-- Index for verification status
CREATE INDEX idx_verification_status ON performer_records(verification_status);

-- Add audit trail for compliance
CREATE TABLE performer_record_audit (
  id SERIAL PRIMARY KEY,
  record_id INTEGER REFERENCES performer_records(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'verified'
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  old_data JSONB,
  new_data JSONB
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to performer_records table
CREATE TRIGGER update_performer_records_updated_at 
BEFORE UPDATE ON performer_records 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
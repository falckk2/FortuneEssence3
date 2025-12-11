-- Contact Form Submissions Table
-- Stores all customer contact form submissions
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  phone VARCHAR(50),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'spam')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to VARCHAR(255),
  responded_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contact_submissions_email ON contact_form_submissions(email);
CREATE INDEX idx_contact_submissions_status ON contact_form_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_form_submissions(created_at DESC);
CREATE INDEX idx_contact_submissions_customer_id ON contact_form_submissions(customer_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submission_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_submission_timestamp
BEFORE UPDATE ON contact_form_submissions
FOR EACH ROW
EXECUTE FUNCTION update_contact_submission_timestamp();

-- Add comment
COMMENT ON TABLE contact_form_submissions IS 'Customer contact form submissions with status tracking and CRM integration';

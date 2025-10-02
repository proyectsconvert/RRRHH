-- Create candidate_documents table for tracking hiring documents
CREATE TABLE IF NOT EXISTS candidate_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one document per type per candidate
  UNIQUE(candidate_id, document_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_candidate_documents_candidate_id ON candidate_documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_documents_type ON candidate_documents(document_type);

-- Enable RLS
ALTER TABLE candidate_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for candidate_documents
CREATE POLICY "Users can view candidate documents" ON candidate_documents
  FOR SELECT USING (true);

CREATE POLICY "Users can insert candidate documents" ON candidate_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update candidate documents" ON candidate_documents
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete candidate documents" ON candidate_documents
  FOR DELETE USING (true);

-- Create storage bucket for candidate documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-documents', 'candidate-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for candidate-documents bucket
CREATE POLICY "Users can upload candidate documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'candidate-documents');

CREATE POLICY "Users can view candidate documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'candidate-documents');

CREATE POLICY "Users can update candidate documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'candidate-documents');

CREATE POLICY "Users can delete candidate documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'candidate-documents');
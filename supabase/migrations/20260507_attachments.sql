-- Case Attachments
CREATE TABLE IF NOT EXISTS case_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Session Attachments
CREATE TABLE IF NOT EXISTS session_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: office members can view attachments in their office
CREATE POLICY "Office members can view case attachments"
  ON case_attachments FOR SELECT TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Office members can view session attachments"
  ON session_attachments FOR SELECT TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

-- Policy: office members can insert
CREATE POLICY "Office members can insert case attachments"
  ON case_attachments FOR INSERT TO authenticated
  WITH CHECK (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Office members can insert session attachments"
  ON session_attachments FOR INSERT TO authenticated
  WITH CHECK (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

-- Policy: only uploader OR admin/owner can delete
CREATE POLICY "Uploader or admin can delete case attachments"
  ON case_attachments FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Uploader or admin can delete session attachments"
  ON session_attachments FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR office_id IN (
      SELECT office_id FROM office_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Storage paths (uses existing 'uploads' bucket):
-- uploads/cases/{case_id}/{filename}
-- uploads/sessions/{session_id}/{filename}

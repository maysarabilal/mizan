-- 1. Fees agreement per case (one per case)
CREATE TABLE IF NOT EXISTS case_fees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(case_id)
);

-- 2. Payment records
CREATE TABLE IF NOT EXISTS case_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_fee_id uuid NOT NULL REFERENCES case_fees(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL CHECK (payment_method IN ('نقد', 'تحويل بنكي', 'شيك', 'بطاقة')),
  notes text,
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Expenses
CREATE TABLE IF NOT EXISTS case_expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Permission column for team members
ALTER TABLE office_members
  ADD COLUMN IF NOT EXISTS can_manage_fees boolean DEFAULT false;

-- RLS
ALTER TABLE case_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_expenses ENABLE ROW LEVEL SECURITY;

-- case_fees policies
CREATE POLICY "Office members can view case fees"
  ON case_fees FOR SELECT TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Can manage fees members can insert"
  ON case_fees FOR INSERT TO authenticated
  WITH CHECK (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid()
    AND (role IN ('owner', 'admin') OR can_manage_fees = true)
  ));

CREATE POLICY "Can manage fees members can update"
  ON case_fees FOR UPDATE TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid()
    AND (role IN ('owner', 'admin') OR can_manage_fees = true)
  ));

CREATE POLICY "Only owner or admin can delete case fees"
  ON case_fees FOR DELETE TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- case_payments policies
CREATE POLICY "Office members can view payments"
  ON case_payments FOR SELECT TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Can manage fees members can insert payments"
  ON case_payments FOR INSERT TO authenticated
  WITH CHECK (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid()
    AND (role IN ('owner', 'admin') OR can_manage_fees = true)
  ));

CREATE POLICY "Only owner or admin can delete payments"
  ON case_payments FOR DELETE TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- case_expenses policies
CREATE POLICY "Office members can view expenses"
  ON case_expenses FOR SELECT TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Can manage fees members can insert expenses"
  ON case_expenses FOR INSERT TO authenticated
  WITH CHECK (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid()
    AND (role IN ('owner', 'admin') OR can_manage_fees = true)
  ));

CREATE POLICY "Only owner or admin can delete expenses"
  ON case_expenses FOR DELETE TO authenticated
  USING (office_id IN (
    SELECT office_id FROM office_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

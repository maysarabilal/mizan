-- =========================================================================
-- MIZAN DATABASE SCHEMA
-- PostgreSQL 15 + Supabase
-- Target: Law Firm Management SaaS (Multi-Tenant)
-- =========================================================================

-- 1. Helper Functions
CREATE OR REPLACE FUNCTION current_office_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT office_id 
  FROM office_members 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION has_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM office_members 
  WHERE user_id = auth.uid() 
  AND is_active = true 
  LIMIT 1;
  
  RETURN user_role = ANY(required_roles);
END;
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public
STABLE
AS $$
  SELECT is_admin 
  FROM profiles 
  WHERE id = auth.uid();
$$;

-- Trigger Function: Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Tables & Schema

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  is_admin boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Subscription Plans (Global)
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- "فردي", "مكتب", "مؤسسي"
  price_ils numeric NOT NULL,
  max_users int NOT NULL,
  features jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Offices (Tenants)
CREATE TABLE offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  settings jsonb DEFAULT '{"session_reminders": true, "task_completed": true, "subscription_updates": true}'::jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Office Subscriptions
CREATE TABLE office_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(office_id)
);

-- Office Members
CREATE TABLE office_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'lawyer', 'assistant')),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(office_id, user_id)
);

-- Invitations
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('lawyer', 'assistant')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Subscription Requests
CREATE TABLE subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  requested_plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  admin_note text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  payment_method text DEFAULT 'bank_transfer' NOT NULL,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Cases
CREATE TABLE cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  title text NOT NULL,
  case_number text,
  case_type text NOT NULL, -- مدني، جنائي، تجاري، إداري، عمالي، أسري، عقاري، أخرى
  status text NOT NULL DEFAULT 'جارية', -- جارية، معلقة، مكتملة، في الاستئناف, closed
  priority text NOT NULL DEFAULT 'متوسطة', -- عالية، متوسطة، منخفضة
  litigation_degree text, -- ابتدائي، استئناف، نقض
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Sessions
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_time time,
  court text,
  hall text,
  session_type text,
  outcome text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tasks (Kanban)
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'معلقة' CHECK (status IN ('معلقة', 'قيد التنفيذ', 'مكتملة')), 
  priority text NOT NULL DEFAULT 'متوسطة' CHECK (priority IN ('عالية', 'متوسطة', 'منخفضة')),
  due_date date,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- specific user or owner
  type text NOT NULL CHECK (type IN ('session', 'task', 'payment', 'system')),
  title text NOT NULL,
  body text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  related_entity_id uuid, -- could be case_id, task_id, etc.
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Audit Logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES offices(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_subscription_plans BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_offices BEFORE UPDATE ON offices FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_office_subscriptions BEFORE UPDATE ON office_subscriptions FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_office_members BEFORE UPDATE ON office_members FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_subscription_requests BEFORE UPDATE ON subscription_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_clients BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_cases BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_sessions BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 4. Indexes
CREATE INDEX idx_office_members_user_id ON office_members(user_id);
CREATE INDEX idx_clients_office_id ON clients(office_id);
CREATE INDEX idx_cases_office_status ON cases(office_id, status);
CREATE INDEX idx_cases_client_id ON cases(client_id);
CREATE INDEX idx_sessions_office_date ON sessions(office_id, session_date);
CREATE INDEX idx_sessions_case_id ON sessions(case_id);
CREATE INDEX idx_tasks_office_status ON tasks(office_id, status);
CREATE INDEX idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_office_id ON audit_logs(office_id);

-- 5. Row Level Security (RLS) Enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Profiles
CREATE POLICY "Users can view all profiles in their office" ON profiles FOR SELECT USING (
  is_platform_admin() OR 
  id IN (SELECT user_id FROM office_members WHERE office_id = current_office_id())
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Subscription Plans (Global Read)
CREATE POLICY "Public read plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Only admins can modify plans" ON subscription_plans FOR ALL USING (is_platform_admin());

-- Offices
CREATE POLICY "Members can view own office" ON offices FOR SELECT USING (id = current_office_id() OR is_platform_admin());
CREATE POLICY "Owners can update office" ON offices FOR UPDATE USING ((id = current_office_id() AND has_role(ARRAY['owner'])) OR is_platform_admin());

-- Office Subscriptions
CREATE POLICY "Members can view own subscription" ON office_subscriptions FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
-- Only admins can modify subscriptions directly

-- Office Members
CREATE POLICY "Members can view own office members" ON office_members FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Owners can manage members" ON office_members FOR ALL USING ((office_id = current_office_id() AND has_role(ARRAY['owner'])) OR is_platform_admin());

-- Invitations
CREATE POLICY "Members can view own office invitations" ON invitations FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Owners can manage invitations" ON invitations FOR ALL USING ((office_id = current_office_id() AND has_role(ARRAY['owner'])) OR is_platform_admin());

-- Subscription Requests
CREATE POLICY "Members can view own requests" ON subscription_requests FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Owners can insert requests" ON subscription_requests FOR INSERT WITH CHECK (office_id = current_office_id() AND has_role(ARRAY['owner']));

-- Payments
CREATE POLICY "Members can view own payments" ON payments FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Owners can insert payments" ON payments FOR INSERT WITH CHECK (office_id = current_office_id() AND has_role(ARRAY['owner']));

-- Clients
CREATE POLICY "Members can view own clients" ON clients FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Members can insert clients" ON clients FOR INSERT WITH CHECK (office_id = current_office_id());
CREATE POLICY "Members can update clients" ON clients FOR UPDATE USING (office_id = current_office_id());
CREATE POLICY "Owners can delete clients" ON clients FOR DELETE USING (office_id = current_office_id() AND has_role(ARRAY['owner']));

-- Cases
CREATE POLICY "Members can view own cases" ON cases FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Members can insert cases" ON cases FOR INSERT WITH CHECK (office_id = current_office_id());
CREATE POLICY "Members can update cases" ON cases FOR UPDATE USING (office_id = current_office_id());
CREATE POLICY "Owners can delete cases" ON cases FOR DELETE USING (office_id = current_office_id() AND has_role(ARRAY['owner']));

-- Sessions
CREATE POLICY "Members can view own sessions" ON sessions FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Members can insert sessions" ON sessions FOR INSERT WITH CHECK (office_id = current_office_id());
CREATE POLICY "Members can update sessions" ON sessions FOR UPDATE USING (office_id = current_office_id());
CREATE POLICY "Owners/Lawyers can delete sessions" ON sessions FOR DELETE USING (office_id = current_office_id() AND has_role(ARRAY['owner', 'lawyer']));

-- Tasks
CREATE POLICY "Members can view own tasks" ON tasks FOR SELECT USING (office_id = current_office_id() OR is_platform_admin());
CREATE POLICY "Members can insert tasks" ON tasks FOR INSERT WITH CHECK (office_id = current_office_id());
CREATE POLICY "Members can update tasks" ON tasks FOR UPDATE USING (office_id = current_office_id());
CREATE POLICY "Owners can delete tasks" ON tasks FOR DELETE USING (office_id = current_office_id() AND has_role(ARRAY['owner']));

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid() OR is_platform_admin());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Audit Logs
CREATE POLICY "Owners can view audit logs" ON audit_logs FOR SELECT USING ((office_id = current_office_id() AND has_role(ARRAY['owner'])) OR is_platform_admin());
-- Insert is usually handled by postgres triggers or backend bypassing RLS (service role).

-- 7. Seed Data for Subscription Plans
INSERT INTO subscription_plans (name, price_ils, max_users, features) VALUES
('فردي', 59, 1, '{"team_management": false}'::jsonb),
('مكتب', 249, 5, '{"team_management": true, "max_members": 5}'::jsonb),
('مؤسسي', 799, 9999, '{"team_management": true, "max_members": 9999}'::jsonb)
ON CONFLICT DO NOTHING;

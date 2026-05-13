-- Create beta_feedback table
CREATE TABLE public.beta_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ui_rating INTEGER CHECK (ui_rating >= 1 AND ui_rating <= 5),
    features_rating INTEGER CHECK (features_rating >= 1 AND features_rating <= 5),
    pricing_rating INTEGER CHECK (pricing_rating >= 1 AND pricing_rating <= 5),
    general_notes TEXT,
    contact_info TEXT
);

-- Enable RLS
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Allow insert from anyone (anonymous or authenticated)
CREATE POLICY "Enable insert for anyone" ON public.beta_feedback
    FOR INSERT WITH CHECK (true);

-- Allow read for platform admins only
CREATE POLICY "Enable read for platform admins only" ON public.beta_feedback
    FOR SELECT USING (public.is_platform_admin());

-- Add disabled_by_admin column to office_members
ALTER TABLE public.office_members 
ADD COLUMN disabled_by_admin BOOLEAN NOT NULL DEFAULT false;

-- Add a comment for context
COMMENT ON COLUMN public.office_members.disabled_by_admin IS 'True if an admin deliberately deactivated this user. Only admins can toggle this false.';

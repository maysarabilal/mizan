-- Add email column to invitations table to support automated email dispatch
ALTER TABLE invitations ADD COLUMN email TEXT;

-- Create an index for performance
CREATE INDEX idx_invitations_email ON invitations(email);

-- Add a comment for documentation
COMMENT ON COLUMN invitations.email IS 'The email address of the invited user (optional, used for sending the invitation email).';

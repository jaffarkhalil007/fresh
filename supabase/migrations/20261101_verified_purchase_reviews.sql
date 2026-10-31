-- Add verified_purchase flag to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verified_purchase boolean DEFAULT false;

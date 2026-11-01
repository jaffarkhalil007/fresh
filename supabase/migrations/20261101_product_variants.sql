-- Product variants stored as a JSONB array
-- Each variant: { id: string, name: string, price: number, image_url?: string }
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants jsonb;

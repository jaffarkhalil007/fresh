-- Add specifications JSONB column to products
-- Stores key-value pairs e.g. {"Brand": "Samsung", "RAM": "8GB", "Color": "Black"}
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications jsonb;

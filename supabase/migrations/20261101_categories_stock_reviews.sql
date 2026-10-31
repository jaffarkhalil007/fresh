-- Add categories array to products for multi-category support
ALTER TABLE products ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Populate categories from existing category field for existing products
UPDATE products SET categories = ARRAY[category] WHERE categories = '{}' OR categories IS NULL;

-- Add delivery_fee column if not already present
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_fee integer DEFAULT NULL;

-- Safe stock decrement function (prevents negative stock)
CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - qty)
  WHERE id = p_id;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION decrement_stock(uuid, integer) TO anon, authenticated;

-- Auto-update product review_count and rating when reviews change
CREATE OR REPLACE FUNCTION sync_product_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE products
  SET
    review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = target_product_id),
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = target_product_id),
      4.5
    )
  WHERE id = target_product_id;

  RETURN NULL;
END;
$$;

-- Drop and recreate trigger to ensure it's up to date
DROP TRIGGER IF EXISTS sync_product_review_stats_trigger ON reviews;
CREATE TRIGGER sync_product_review_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_review_stats();

-- Site settings for free delivery minimum (insert default if not exists)
INSERT INTO site_settings (key, value)
VALUES ('delivery_settings', '{"free_delivery_minimum": 1000, "delivery_fee": 150}')
ON CONFLICT (key) DO NOTHING;

-- Storage bucket for review images (handled via dashboard, but policies here)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read review images
CREATE POLICY "Public read review images" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'review-images');

-- Allow authenticated users to upload review images
CREATE POLICY "Auth upload review images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-images');

-- Allow anon to upload review images (for guest reviewers)
CREATE POLICY "Anon upload review images" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'review-images');

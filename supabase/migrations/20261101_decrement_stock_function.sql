-- Safe stock decrement function (SECURITY DEFINER bypasses RLS)
-- Call this from client: supabase.rpc('decrement_stock', { p_id: '...', qty: 1 })
CREATE OR REPLACE FUNCTION public.decrement_stock(p_id uuid, qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock_quantity = GREATEST(0, stock_quantity - qty)
  WHERE id = p_id;
END;
$$;

-- Grant execute to all roles so client-side checkout can call it
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO anon, authenticated, service_role;

-- Also allow authenticated + anon users to update stock_quantity directly
-- (fallback path when RPC is not yet applied)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'Allow stock update on purchase'
  ) THEN
    CREATE POLICY "Allow stock update on purchase" ON products
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$;

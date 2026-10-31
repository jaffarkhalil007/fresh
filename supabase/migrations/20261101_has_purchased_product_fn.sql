-- Returns true if the given Clerk user has a delivered order containing the product.
-- Checks both user_id column AND the [clerk:xxx] tag stored in notes (for non-UUID Clerk IDs).
CREATE OR REPLACE FUNCTION public.has_purchased_product(p_product_id uuid, p_clerk_user_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered'
      AND oi.product_id = p_product_id
      AND (
        o.user_id = p_clerk_user_id
        OR o.notes LIKE '%[clerk:' || p_clerk_user_id || ']%'
      )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_purchased_product(uuid, text) TO anon, authenticated;

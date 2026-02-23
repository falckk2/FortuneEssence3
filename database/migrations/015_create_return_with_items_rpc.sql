-- Migration: Atomic return creation RPC
-- Wraps return + return_items inserts in a single transaction to prevent orphaned records

CREATE OR REPLACE FUNCTION create_return_with_items(
  p_order_id UUID,
  p_customer_id UUID,
  p_status VARCHAR,
  p_reason TEXT,
  p_refund_amount DECIMAL,
  p_refund_method VARCHAR,
  p_admin_notes TEXT,
  p_tracking_number VARCHAR,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_return_id UUID;
  v_item JSONB;
BEGIN
  -- Insert the return record
  INSERT INTO returns (
    order_id,
    customer_id,
    status,
    reason,
    refund_amount,
    refund_method,
    admin_notes,
    tracking_number
  )
  VALUES (
    p_order_id,
    p_customer_id,
    p_status,
    p_reason,
    p_refund_amount,
    p_refund_method,
    p_admin_notes,
    p_tracking_number
  )
  RETURNING id INTO v_return_id;

  -- Insert each return item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO return_items (
      return_id,
      order_item_id,
      product_id,
      quantity,
      reason,
      condition
    )
    VALUES (
      v_return_id,
      (v_item->>'productId')::UUID,
      (v_item->>'productId')::UUID,
      (v_item->>'quantity')::INTEGER,
      v_item->>'reason',
      v_item->>'condition'
    );
  END LOOP;

  RETURN v_return_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_return_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION create_return_with_items TO service_role;

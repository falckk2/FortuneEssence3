-- Migration 019: Fix ISSUE-040 RPC for timestamptz[] timestamps column
-- Migration 018 used jsonb; production rate_limit_buckets.timestamps is timestamptz[].

CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  p_bucket_id text,
  p_form_type text,
  p_ip text,
  p_max_requests integer,
  p_window_ms bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz := v_now - make_interval(secs => (p_window_ms::numeric / 1000.0));
  v_raw timestamptz[];
  v_recent timestamptz[] := ARRAY[]::timestamptz[];
  v_ts timestamptz;
  v_count integer := 0;
BEGIN
  SELECT timestamps
  INTO v_raw
  FROM public.rate_limit_buckets
  WHERE id = p_bucket_id
  FOR UPDATE;

  IF v_raw IS NOT NULL THEN
    FOREACH v_ts IN ARRAY v_raw
    LOOP
      IF v_ts > v_window_start THEN
        v_recent := array_append(v_recent, v_ts);
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  v_recent := array_append(v_recent, v_now);

  INSERT INTO public.rate_limit_buckets (id, form_type, ip, timestamps, updated_at)
  VALUES (p_bucket_id, p_form_type, p_ip, v_recent, v_now)
  ON CONFLICT (id) DO UPDATE
  SET form_type = EXCLUDED.form_type,
      ip = EXCLUDED.ip,
      timestamps = EXCLUDED.timestamps,
      updated_at = EXCLUDED.updated_at;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_and_record_rate_limit(text, text, text, integer, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, text, text, integer, bigint) TO service_role;
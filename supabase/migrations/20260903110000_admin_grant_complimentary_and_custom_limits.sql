-- Migration: Add custom_limits and admin_grant_complimentary RPC

DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'avancado';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'full';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_limits jsonb;

CREATE OR REPLACE FUNCTION public.admin_grant_complimentary(
  p_store_id uuid,
  p_plan_id text,
  p_expires_at timestamptz,
  p_notes text DEFAULT NULL,
  p_custom_limits jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  INSERT INTO public.subscriptions (
    store_id,
    plan_id,
    status,
    current_period_end,
    trial_ends_at,
    custom_limits,
    updated_at
  )
  VALUES (
    p_store_id,
    p_plan_id::public.plan_id,
    'active',
    p_expires_at,
    NULL,
    p_custom_limits,
    NOW()
  )
  ON CONFLICT (store_id) DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    current_period_end = EXCLUDED.current_period_end,
    trial_ends_at = NULL,
    custom_limits = EXCLUDED.custom_limits,
    updated_at = NOW();

  IF p_notes IS NOT NULL AND p_notes <> '' THEN
    INSERT INTO public.billing_events (
      stripe_event_id,
      type,
      store_id,
      payload
    )
    VALUES (
      'complimentary_' || gen_random_uuid()::text,
      'complimentary_granted',
      p_store_id,
      jsonb_build_object(
        'plan_id', p_plan_id,
        'expires_at', p_expires_at,
        'notes', p_notes,
        'custom_limits', p_custom_limits
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

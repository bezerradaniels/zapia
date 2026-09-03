-- Migration: Atualização do is_admin(), enum plan_id, coluna custom_limits e RPC admin_grant_complimentary

-- 1. Atualizar is_admin() para reconhecer os emails de admin atuais
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    lower(coalesce(auth.email(), '')) IN ('manager@zapia.app', 'daniel.ddsb@gmail.com', 'manager@zapable.com.br')
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 2. Expandir enum plan_id
DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'avancado';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'full';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE public.plan_id ADD VALUE IF NOT EXISTS 'custom';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Adicionar coluna custom_limits na tabela subscriptions
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_limits jsonb;

-- 4. Criar a RPC administrativa admin_grant_complimentary
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
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores da plataforma podem conceder gratuidade.';
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

REVOKE ALL ON FUNCTION public.admin_grant_complimentary(uuid, text, timestamptz, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_complimentary(uuid, text, timestamptz, text, jsonb) TO authenticated;

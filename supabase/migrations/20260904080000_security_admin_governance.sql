-- Migration: Governança de Acesso Administrativo e Remoção de E-mails Pessoais Hardcoded
-- Fase 1 da Auditoria Técnica: Contenção de Riscos de Acesso

-- 1. Garante que os usuários fundadores estejam cadastrados na tabela segura platform_admins
INSERT INTO public.platform_admins (user_id, note)
SELECT id, 'Proprietário da Plataforma (Migração de Governança)'
FROM auth.users
WHERE lower(email) IN ('daniel.ddsb@gmail.com', 'manager@zapia.app')
ON CONFLICT (user_id) DO UPDATE SET
  note = EXCLUDED.note;

-- 2. Atualiza a função is_admin() para verificar a tabela platform_admins e o e-mail corporativo institucional
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT
    lower(coalesce(auth.email(), '')) = 'manager@zapia.app'
    OR EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

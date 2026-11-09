-- ============================================================
-- Migração: Adiciona colunas de onboarding/tráfego na tabela profiles
-- Projeto: Vellessa Afiliados
-- Data: 2026-11-09
-- ============================================================
-- INSTRUÇÃO: Execute este script no Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS traffic_experience   TEXT,
  ADD COLUMN IF NOT EXISTS traffic_investment   TEXT,
  ADD COLUMN IF NOT EXISTS traffic_willingness  TEXT,
  ADD COLUMN IF NOT EXISTS traffic_budget       TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Atualiza registros existentes que já têm telefone válido como onboarding concluído
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE phone IS NOT NULL
  AND LENGTH(TRIM(phone)) >= 10
  AND onboarding_completed IS FALSE;

-- Confirma as colunas adicionadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
  AND column_name IN (
    'traffic_experience',
    'traffic_investment',
    'traffic_willingness',
    'traffic_budget',
    'onboarding_completed'
  )
ORDER BY column_name;

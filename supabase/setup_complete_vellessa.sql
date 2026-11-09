-- ==============================================================================
-- VELLESSA AFILIADOS - SQL COMPLETO DEFINITIVO (CORRIGIDO SEM DEPENDÊNCIAS)
-- ==============================================================================
-- Pode apagar TUDO o que estava no SQL Editor e colar este bloco inteiro!
-- ==============================================================================

-- 1. EXTENSÃO UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. GARANTIR FUNÇÃO is_admin() ANTES DE QUALQUER POLÍTICA
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. COLUNAS DE ONBOARDING E TRÁFEGO PAGO NA TABELA PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone                TEXT,
  ADD COLUMN IF NOT EXISTS traffic_experience   TEXT,
  ADD COLUMN IF NOT EXISTS traffic_investment   TEXT,
  ADD COLUMN IF NOT EXISTS traffic_willingness  TEXT,
  ADD COLUMN IF NOT EXISTS traffic_budget       TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_answers   JSONB,
  ADD COLUMN IF NOT EXISTS pix_key              TEXT;

-- Atualizar usuários existentes que já possuíam telefone para liberar acesso
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE phone IS NOT NULL
  AND LENGTH(TRIM(phone)) >= 10
  AND (onboarding_completed IS NULL OR onboarding_completed = FALSE);

-- 4. POLÍTICAS RLS NA TABELA PROFILES (Permissivas e Seguras)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 5. TABELA DE GRUPOS/PASTAS DE CRIATIVOS (Kiwify 16:9)
CREATE TABLE IF NOT EXISTS public.creative_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gold',
  cover_image TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.creative_folders ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.creative_folders ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'gold';
ALTER TABLE public.creative_folders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.creative_folders ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

ALTER TABLE public.creative_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view creative folders" ON public.creative_folders;
CREATE POLICY "Anyone authenticated can view creative folders"
  ON public.creative_folders FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins and authenticated can manage creative folders" ON public.creative_folders;
CREATE POLICY "Admins and authenticated can manage creative folders"
  ON public.creative_folders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. TABELA DE CRIATIVOS (Vídeos, Imagens, Reels, Copy)
CREATE TABLE IF NOT EXISTS public.creatives (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT '1080×1080',
  image TEXT,
  text TEXT,
  folder_id TEXT,
  file_url TEXT,
  external_download_url TEXT,
  file_type TEXT,
  file_size TEXT,
  storage_type TEXT DEFAULT 'supabase',
  storage_path TEXT,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS folder_id TEXT;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS external_download_url TEXT;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'supabase';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Chave estrangeira flexível com ON DELETE SET NULL (nunca quebra inserção nem exclusão)
ALTER TABLE public.creatives DROP CONSTRAINT IF EXISTS creatives_folder_id_fkey;
ALTER TABLE public.creatives
  ADD CONSTRAINT creatives_folder_id_fkey
  FOREIGN KEY (folder_id)
  REFERENCES public.creative_folders(id)
  ON DELETE SET NULL;

ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view creatives" ON public.creatives;
CREATE POLICY "Anyone authenticated can view creatives"
  ON public.creatives FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Admins and authenticated can manage creatives" ON public.creatives;
CREATE POLICY "Admins and authenticated can manage creatives"
  ON public.creatives FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. STORAGE BUCKETS PÚBLICOS PARA UPLOADS (criativos e materiais)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('criativos', 'criativos', true),
  ('materiais', 'materiais', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Leitura Pública do Storage
DROP POLICY IF EXISTS "Public Access criativos" ON storage.objects;
CREATE POLICY "Public Access criativos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'criativos');

DROP POLICY IF EXISTS "Public Access materiais" ON storage.objects;
CREATE POLICY "Public Access materiais"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'materiais');

-- Políticas de Escrita/Upload no Storage para Autenticados
DROP POLICY IF EXISTS "Authenticated upload criativos" ON storage.objects;
CREATE POLICY "Authenticated upload criativos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'criativos');

DROP POLICY IF EXISTS "Authenticated update criativos" ON storage.objects;
CREATE POLICY "Authenticated update criativos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'criativos');

DROP POLICY IF EXISTS "Authenticated delete criativos" ON storage.objects;
CREATE POLICY "Authenticated delete criativos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'criativos');

DROP POLICY IF EXISTS "Authenticated upload materiais" ON storage.objects;
CREATE POLICY "Authenticated upload materiais"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'materiais');

DROP POLICY IF EXISTS "Authenticated update materiais" ON storage.objects;
CREATE POLICY "Authenticated update materiais"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'materiais');

DROP POLICY IF EXISTS "Authenticated delete materiais" ON storage.objects;
CREATE POLICY "Authenticated delete materiais"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'materiais');

-- 8. DIAGNÓSTICO FINAL DE CONFIRMAÇÃO
SELECT 
  'Banco de dados, tabelas, storage e políticas RLS configurados com sucesso!' AS status,
  (SELECT count(*) FROM public.profiles) AS total_perfis,
  (SELECT count(*) FROM public.creative_folders) AS total_grupos,
  (SELECT count(*) FROM public.creatives) AS total_criativos;

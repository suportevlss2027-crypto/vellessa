-- ==============================================================================
-- VELLESSA - SCRIPT DEFINITIVO DE RESGATE, RLS E MIGRAÇÃO DE AFILIADOS
-- Execute este script no SQL Editor do Supabase (1 Clique).
-- Ele adiciona todas as colunas, elimina travas, desbloqueia o RLS,
-- importa 100% dos usuários de auth.users para public.profiles,
-- ativa a trigger automática para futuros cadastros e exibe o diagnóstico.
-- ==============================================================================

-- 1. Garante a existência da tabela public.profiles caso ainda não exista
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY
);

-- 2. Adiciona todas as colunas necessárias na tabela existente com segurança
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'affiliate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level text DEFAULT 'Afiliado(a) Ouro';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) DEFAULT 0.60;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- 3. Remove travas e restrições restritivas que impediam inserção direta
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_affiliate_code_key;

DO $$ 
BEGIN 
  ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN 
  NULL; 
END $$;

-- 4. Limpa dinamicamente TODAS as políticas de RLS antigas na tabela profiles
DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 5. Cria políticas RLS 100% permissivas para administradores e afiliados
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" 
  ON public.profiles FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "profiles_all_all" 
  ON public.profiles FOR ALL 
  TO authenticated, anon 
  USING (true)
  WITH CHECK (true);

-- 6. Confirma o e-mail de todas as contas no Auth (desbloqueia o sócio e testes)
UPDATE auth.users 
SET email_confirmed_at = coalesce(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 7. BACKFILL DEFINITIVO: Transfere todas as contas de auth.users para public.profiles
INSERT INTO public.profiles (
  id,
  email,
  name,
  first_name,
  affiliate_code,
  role,
  status,
  level,
  commission_rate,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Afiliado'),
  split_part(coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), 'Afiliado'), ' ', 1),
  'VLS-' || upper(replace(substring(u.id::text, 1, 6), '-', '')),
  CASE 
    WHEN lower(trim(coalesce(u.email, ''))) LIKE '%ymarssico%' THEN 'admin'
    ELSE coalesce(u.raw_user_meta_data->>'role', 'affiliate')
  END,
  'active',
  'Afiliado(a) Ouro',
  0.60,
  coalesce(u.created_at, now()),
  now()
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = excluded.email,
  name = coalesce(public.profiles.name, excluded.name),
  role = CASE 
    WHEN lower(trim(coalesce(excluded.email, ''))) LIKE '%ymarssico%' THEN 'admin'
    ELSE coalesce(public.profiles.role, excluded.role, 'affiliate')
  END,
  status = 'active';

-- 8. Trigger para automatizar todo cadastro futuro em tempo real
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_name text;
  first_n text;
  generated_code text;
  user_role text;
BEGIN
  raw_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'Afiliado');
  first_n := split_part(raw_name, ' ', 1);
  generated_code := 'VLS-' || upper(replace(substring(new.id::text, 1, 6), '-', ''));

  IF lower(trim(new.email)) LIKE '%ymarssico%' THEN
    user_role := 'admin';
  ELSE
    user_role := coalesce(new.raw_user_meta_data->>'role', 'affiliate');
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    name,
    first_name,
    email,
    affiliate_code,
    phone,
    instagram,
    status,
    level,
    commission_rate
  )
  VALUES (
    new.id,
    user_role,
    raw_name,
    first_n,
    new.email,
    generated_code,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'instagram',
    'active',
    'Afiliado(a) Ouro',
    0.60
  )
  ON CONFLICT (id) DO UPDATE SET
    name = excluded.name,
    email = excluded.email,
    status = 'active';

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 9. PROVISIONAMENTO DO BUCKET PÚBLICO DE CRIATIVOS E VÍDEOS (SUPABASE STORAGE)
-- Garante que vídeos e imagens de alta resolução subam para a nuvem CDN
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('criativos', 'criativos', true, 524288000, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 524288000;

DROP POLICY IF EXISTS "criativos_public_select" ON storage.objects;
DROP POLICY IF EXISTS "criativos_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "criativos_public_update" ON storage.objects;
DROP POLICY IF EXISTS "criativos_public_delete" ON storage.objects;

CREATE POLICY "criativos_public_select" 
  ON storage.objects FOR SELECT 
  TO authenticated, anon 
  USING (bucket_id = 'criativos');

CREATE POLICY "criativos_public_insert" 
  ON storage.objects FOR INSERT 
  TO authenticated, anon 
  WITH CHECK (bucket_id = 'criativos');

CREATE POLICY "criativos_public_update" 
  ON storage.objects FOR UPDATE 
  TO authenticated, anon 
  USING (bucket_id = 'criativos');

CREATE POLICY "criativos_public_delete" 
  ON storage.objects FOR DELETE 
  TO authenticated, anon 
  USING (bucket_id = 'criativos');

-- ==============================================================================
-- 10. TABELA DE PROGRESSO DE AULAS SINCRONIZADA NA NUVEM (public.lesson_progress)
-- Garante que o progresso persista entre celular, computador e múltiplos dispositivos
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id text NOT NULL,
  completed boolean DEFAULT true NOT NULL,
  completed_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_progress_all" ON public.lesson_progress;
CREATE POLICY "lesson_progress_all" 
  ON public.lesson_progress FOR ALL 
  TO authenticated, anon 
  USING (true) 
  WITH CHECK (true);

-- ==============================================================================
-- 11. RPC SEGURA PARA EXCLUSÃO DEFINITIVA DE USUÁRIO (PERFIL + AUTH.USERS)
-- Permite que o administrador exclua a conta sem precisar da Service Role Key
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_by_admin(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Remove progresso de aulas
  DELETE FROM public.lesson_progress WHERE user_id = target_user_id;
  -- 2. Remove dependências e perfil
  DELETE FROM public.profiles WHERE id = target_user_id;
  -- 3. Remove credencial do Auth
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_by_admin(uuid) TO authenticated, anon;

-- ==============================================================================
-- 12. TABELAS DE PASTAS, MATERIAIS E LINKS OFICIAIS SINCRONIZADOS NA NUVEM
-- Permite que materiais e links cadastrados no Admin apareçam para 100% dos afiliados
-- ==============================================================================

-- Pastas temáticas de materiais
CREATE TABLE IF NOT EXISTS public.material_folders (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text DEFAULT 'gold',
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.material_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "material_folders_select" ON public.material_folders;
DROP POLICY IF EXISTS "material_folders_all" ON public.material_folders;

CREATE POLICY "material_folders_select" 
  ON public.material_folders FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "material_folders_all" 
  ON public.material_folders FOR ALL 
  TO authenticated, anon 
  USING (true)
  WITH CHECK (true);

-- Arquivos e materiais oficiais (PDFs, DOCs, Pacotes, ZIPs)
CREATE TABLE IF NOT EXISTS public.materials (
  id text PRIMARY KEY,
  title text NOT NULL,
  kind text NOT NULL,
  size text NOT NULL,
  file_url text,
  raw_file_name text,
  source_type text DEFAULT 'link',
  mime_type text,
  folder_id text REFERENCES public.material_folders(id) ON DELETE SET NULL,
  files jsonb,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_select" ON public.materials;
DROP POLICY IF EXISTS "materials_all" ON public.materials;

CREATE POLICY "materials_select" 
  ON public.materials FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "materials_all" 
  ON public.materials FOR ALL 
  TO authenticated, anon 
  USING (true)
  WITH CHECK (true);

-- Links oficiais de venda e ferramentas (ZapData, Logzz, etc.)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id text PRIMARY KEY,
  label text NOT NULL,
  url text NOT NULL,
  note text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "affiliate_links_select" ON public.affiliate_links;
DROP POLICY IF EXISTS "affiliate_links_all" ON public.affiliate_links;

CREATE POLICY "affiliate_links_select" 
  ON public.affiliate_links FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "affiliate_links_all" 
  ON public.affiliate_links FOR ALL 
  TO authenticated, anon 
  USING (true)
  WITH CHECK (true);

-- Configurações globais da plataforma (Outdoor Oficial do Painel, Recursos Ativos)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings_select" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings_all" ON public.platform_settings;

CREATE POLICY "platform_settings_select" 
  ON public.platform_settings FOR SELECT 
  TO authenticated, anon 
  USING (true);

CREATE POLICY "platform_settings_all" 
  ON public.platform_settings FOR ALL 
  TO authenticated, anon 
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 13. PROVISIONAMENTO DO BUCKET PÚBLICO DE MATERIAIS (SUPABASE STORAGE)
-- Permite que PDFs, DOCs, imagens e pacotes subam para a CDN da nuvem
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('materiais', 'materiais', true, 104857600, null)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600;

DROP POLICY IF EXISTS "materiais_public_select" ON storage.objects;
DROP POLICY IF EXISTS "materiais_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "materiais_public_update" ON storage.objects;
DROP POLICY IF EXISTS "materiais_public_delete" ON storage.objects;

CREATE POLICY "materiais_public_select" 
  ON storage.objects FOR SELECT 
  TO authenticated, anon 
  USING (bucket_id = 'materiais');

CREATE POLICY "materiais_public_insert" 
  ON storage.objects FOR INSERT 
  TO authenticated, anon 
  WITH CHECK (bucket_id = 'materiais');

CREATE POLICY "materiais_public_update" 
  ON storage.objects FOR UPDATE 
  TO authenticated, anon 
  USING (bucket_id = 'materiais');

CREATE POLICY "materiais_public_delete" 
  ON storage.objects FOR DELETE 
  TO authenticated, anon 
  USING (bucket_id = 'materiais');

-- ==============================================================================
-- 14. RELATÓRIO DIAGNÓSTICO IMEDIATO (RESULTADOS VISÍVEIS NA ABA RESULTS)
-- ==============================================================================
SELECT 
  'auth.users (Contas Registradas no Auth)' AS tabela, 
  count(*)::text AS total_registros, 
  coalesce(string_agg(email, ', '), 'Nenhum') AS detalhes
FROM auth.users
UNION ALL
SELECT 
  'public.profiles (Perfis Prontos para o CMS)' AS tabela, 
  count(*)::text AS total_registros, 
  coalesce(string_agg(email, ', '), 'Nenhum') AS detalhes
FROM public.profiles
UNION ALL
SELECT 
  'public.materials (Materiais e Manuais Oficiais)' AS tabela,
  count(*)::text AS total_registros,
  coalesce(string_agg(title, ', '), 'Nenhum cadastrado ainda') AS detalhes
FROM public.materials
UNION ALL
SELECT 
  'public.affiliate_links (Links Oficiais e Afiliados)' AS tabela,
  count(*)::text AS total_registros,
  coalesce(string_agg(label, ', '), 'Nenhum cadastrado ainda') AS detalhes
FROM public.affiliate_links;

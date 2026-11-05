-- ==============================================================================
-- VELLESSA - DESBLOQUEIO DE RLS, CONFIRMAÇÃO DE CONTAS E BACKFILL GERAL
-- Execute este script no SQL Editor do seu Supabase Dashboard para:
-- 1. Confirmar automaticamente todos os e-mails pendentes no Auth
-- 2. Garantir a tabela public.profiles sem travas de chave estrangeira
-- 3. Remover políticas restritivas de RLS (que ocultavam afiliados)
-- 4. Transferir (Backfill) todos os usuários cadastrados para a tabela profiles
-- 5. Ativar o trigger permanente para todo futuro cadastro
-- ==============================================================================

-- 1. Libera confirmação de e-mail para todas as contas criadas (sócio e testes)
UPDATE auth.users 
SET email_confirmed_at = coalesce(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 2. Garante a tabela public.profiles sem dependências externas impeditivas
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text DEFAULT 'affiliate' NOT NULL CHECK (role IN ('admin', 'affiliate', 'manager')),
  name text NOT NULL,
  first_name text,
  email text UNIQUE NOT NULL,
  phone text,
  instagram text,
  affiliate_code text UNIQUE,
  level text DEFAULT 'Afiliado(a) Ouro' NOT NULL,
  commission_rate numeric(5,2) DEFAULT 0.60 NOT NULL,
  avatar_url text,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'pending')),
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remove qualquer constraint antiga com a tabela tenants que causava erro 42P01
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;

-- 3. REMOVE TODAS AS POLÍTICAS ANTIGAS E RESTRITIVAS DE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Cria política aberta: Qualquer usuário autenticado (incluindo o admin) pode ver todos os perfis
CREATE POLICY "Allow authenticated users to read all profiles" 
  ON public.profiles FOR SELECT 
  to authenticated 
  USING (true);

-- Permite gravação e atualização (upsert)
CREATE POLICY "Allow users and admins to manage profiles" 
  ON public.profiles FOR ALL 
  to authenticated 
  USING (true)
  WITH CHECK (true);

-- 4. BACKFILL GERAL: Transfere todas as contas do auth.users para public.profiles
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
  status = 'active';

-- 5. Trigger definitivo para novos cadastros
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

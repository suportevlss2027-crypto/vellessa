-- ==============================================================================
-- VELLESSA - SCRIPT DEFINITIVO DE ADIÇÃO DE COLUNAS, RLS E BACKFILL
-- Este script adiciona as colunas faltantes (role, affiliate_code, etc)
-- na tabela profiles que já existia no seu banco, desbloqueia o RLS
-- e importa todos os usuários cadastrados no Auth na mesma hora.
-- ==============================================================================

-- 1. Garante a existência da tabela public.profiles caso ainda não exista
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY
);

-- 2. Adiciona todas as colunas necessárias na tabela existente (resolve o erro 42703)
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

-- Remove qualquer trava antiga que causava erro de chave estrangeira
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;

-- 3. Confirma o e-mail de todas as contas no Auth (desbloqueia o sócio e testes)
UPDATE auth.users 
SET email_confirmed_at = coalesce(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 4. Desbloqueia o RLS para que administradores vejam todos os afiliados
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

CREATE POLICY "Allow authenticated users to read all profiles" 
  ON public.profiles FOR SELECT 
  to authenticated 
  USING (true);

CREATE POLICY "Allow users and admins to manage profiles" 
  ON public.profiles FOR ALL 
  to authenticated 
  USING (true)
  WITH CHECK (true);

-- 5. BACKFILL: Transfere todas as contas do auth.users para public.profiles
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

-- 6. Trigger para automatizar todo cadastro futuro
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

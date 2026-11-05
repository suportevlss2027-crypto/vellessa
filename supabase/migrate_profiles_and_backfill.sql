-- ==============================================================================
-- VELLESSA AFILIADOS - SCRIPT DE RESGATE E AUTO-PROVISIONAMENTO DE PERFIS
-- Execute este script no SQL Editor do seu Supabase Dashboard para:
-- 1. Criar a tabela public.profiles (se não existir)
-- 2. Configurar permissões de RLS para que administradores vejam todos os afiliados
-- 3. Resgatar automaticamente (Backfill) todos os usuários cadastrados no Auth
-- 4. Instalar o Trigger definitivo para cadastros futuros
-- ==============================================================================

-- 1. Garante a tabela public.profiles
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text default 'affiliate' not null check (role in ('admin', 'affiliate', 'manager')),
  name text not null,
  first_name text,
  email text unique not null,
  phone text,
  instagram text,
  affiliate_code text unique,
  level text default 'Afiliado(a) Ouro' not null,
  commission_rate numeric(5,2) default 0.60 not null,
  avatar_url text,
  status text default 'active' not null check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- 2. Habilita RLS e cria políticas permissivas para leitura e escrita
alter table public.profiles enable row level security;

drop policy if exists "Allow authenticated users to read all profiles" on public.profiles;
create policy "Allow authenticated users to read all profiles" 
  on public.profiles for select 
  to authenticated 
  using (true);

drop policy if exists "Allow users to upsert own profile" on public.profiles;
create policy "Allow users to upsert own profile" 
  on public.profiles for all 
  to authenticated 
  using (auth.uid() = id or lower(trim(auth.jwt()->>'email')) like '%ymarssico%')
  with check (auth.uid() = id or lower(trim(auth.jwt()->>'email')) like '%ymarssico%');

-- 3. RESGATE / BACKFILL: Migra todos os usuários que já existem em auth.users para public.profiles
insert into public.profiles (
  id,
  email,
  name,
  first_name,
  affiliate_code,
  role,
  status,
  level,
  created_at,
  updated_at
)
select 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  split_part(coalesce(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), ' ', 1),
  'VLS-' || upper(substring(u.id::text, 1, 5)),
  case 
    when lower(trim(u.email)) like '%ymarssico%' then 'admin'
    else coalesce(u.raw_user_meta_data->>'role', 'affiliate')
  end,
  'active',
  'Afiliado(a) Ouro',
  u.created_at,
  now()
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email;

-- 4. Função e Trigger para automatizar todos os futuros cadastros
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  first_n text;
  generated_code text;
  user_role text;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  first_n := split_part(raw_name, ' ', 1);
  generated_code := 'VLS-' || upper(substring(new.id::text, 1, 5));

  if lower(trim(new.email)) like '%ymarssico%' then
    user_role := 'admin';
  else
    user_role := coalesce(new.raw_user_meta_data->>'role', 'affiliate');
  end if;

  insert into public.profiles (
    id,
    role,
    name,
    first_name,
    email,
    affiliate_code,
    phone,
    instagram
  )
  values (
    new.id,
    user_role,
    raw_name,
    first_n,
    new.email,
    generated_code,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'instagram'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

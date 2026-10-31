-- ==============================================================================
-- VELESSA AFILIADOS - SUPABASE COMPLETE MULTI-TENANT & DYNAMIC CMS SCHEMA
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TENANTS TABLE (Multi-tenancy / Múltiplas marcas e operações)
create table if not exists public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  brand_color text default 'oklch(0.60 0.13 75)',
  default_commission numeric(5,2) default 0.60 not null,
  active boolean default true not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_tenants_slug on public.tenants(slug);

-- 3. PROFILES TABLE (Com tenant_id e role: admin, affiliate, manager)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  tenant_id uuid references public.tenants(id) on delete set null,
  role text default 'affiliate' not null check (role in ('admin', 'affiliate', 'manager')),
  name text not null,
  first_name text,
  email text unique not null,
  phone text,
  instagram text,
  affiliate_code text unique not null,
  level text default 'Afiliada Ouro' not null,
  commission_rate numeric(5,2) default 0.60 not null,
  avatar_url text,
  status text default 'active' not null check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_affiliate_code on public.profiles(affiliate_code);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_tenant on public.profiles(tenant_id);

-- 4. MODULES TABLE (Módulos de Cursos da Academia)
create table if not exists public.modules (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  subtitle text,
  cover_url text,
  order_index integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_modules_tenant_order on public.modules(tenant_id, order_index);

-- 5. LESSONS TABLE (Aulas em Vídeo)
create table if not exists public.lessons (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null,
  duration text default '10:00' not null,
  video_url text, -- Suporta YouTube, Vimeo, Panda Video ou link direto MP4
  description text,
  order_index integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_lessons_module_order on public.lessons(module_id, order_index);

-- 6. LESSON MATERIALS TABLE (PDFs anexos da aula)
create table if not exists public.lesson_materials (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  title text not null,
  file_url text not null,
  file_size text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. CREATIVES TABLE (Central de Criativos: Feed, Stories, Reels, Copy)
create table if not exists public.creatives (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  type text not null check (type in ('Feed', 'Stories', 'Reels', 'Copy')),
  format text not null default '1080×1080',
  media_url text,
  suggested_copy text,
  order_index integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_creatives_type on public.creatives(type);

-- 8. MATERIALS TABLE (Arquivos Oficiais: Manuais, PDFs, ZIPs)
create table if not exists public.materials (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  kind text default 'PDF' not null,
  file_url text,
  size text default '1,0 MB' not null,
  order_index integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. AFFILIATE LINKS TABLE (Links de Venda Rastreados)
create table if not exists public.affiliate_links (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  label text not null,
  url_template text not null, -- Ex: https://vellessa.com/?ref={CODE}
  note text,
  order_index integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. LESSON PROGRESS TABLE (Progresso de Aulas Concluídas)
create table if not exists public.lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id text not null, -- Suporta ID textual ou UUID
  completed boolean default true not null,
  completed_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);

-- 11. COMMUNITY POSTS & LIKES (Mural Social)
create table if not exists public.community_posts (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  author_initials text not null,
  body text not null,
  likes_count integer default 0 not null,
  replies_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- 12. ANNOUNCEMENTS & READ RECEIPTS
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  title text not null,
  body text not null,
  author text default 'Equipe Vellessa' not null,
  pinned boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists public.read_announcements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  announcement_id uuid references public.announcements(id) on delete cascade not null,
  read_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, announcement_id)
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_name text;
  first_n text;
  generated_code text;
  user_role text;
  default_tenant_id uuid;
begin
  raw_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  first_n := split_part(raw_name, ' ', 1);
  generated_code := 'VLS-' || floor(10000 + random() * 90000)::text;
  user_role := coalesce(new.raw_user_meta_data->>'role', 'affiliate');

  -- Obter tenant padrão ou criar caso não exista
  select id into default_tenant_id from public.tenants where slug = 'vellessa' limit 1;

  insert into public.profiles (
    id,
    tenant_id,
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
    default_tenant_id,
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
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- HELPER FUNCTION: CHECK IF CURRENT USER IS ADMIN
-- ==============================================================================

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_materials enable row level security;
alter table public.creatives enable row level security;
alter table public.materials enable row level security;
alter table public.affiliate_links enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.announcements enable row level security;
alter table public.read_announcements enable row level security;

-- TENANTS: Todos podem ler, somente admins podem editar
drop policy if exists "Anyone authenticated can view tenants" on public.tenants;
create policy "Anyone authenticated can view tenants" on public.tenants for select to authenticated using (true);

drop policy if exists "Admins can manage tenants" on public.tenants;
create policy "Admins can manage tenants" on public.tenants for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- PROFILES
drop policy if exists "Allow authenticated users to read all profiles" on public.profiles;
create policy "Allow authenticated users to read all profiles" on public.profiles for select to authenticated using (true);

drop policy if exists "Allow users to update own profile" on public.profiles;
create policy "Allow users to update own profile" on public.profiles for update to authenticated using (auth.uid() = id or public.is_admin());

-- MODULES: Afiliados leem, admins gerenciam
drop policy if exists "Anyone authenticated can view modules" on public.modules;
create policy "Anyone authenticated can view modules" on public.modules for select to authenticated using (true);

drop policy if exists "Admins can manage modules" on public.modules;
create policy "Admins can manage modules" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- LESSONS: Afiliados leem, admins gerenciam
drop policy if exists "Anyone authenticated can view lessons" on public.lessons;
create policy "Anyone authenticated can view lessons" on public.lessons for select to authenticated using (true);

drop policy if exists "Admins can manage lessons" on public.lessons;
create policy "Admins can manage lessons" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- LESSON MATERIALS
drop policy if exists "Anyone authenticated can view lesson materials" on public.lesson_materials;
create policy "Anyone authenticated can view lesson materials" on public.lesson_materials for select to authenticated using (true);

drop policy if exists "Admins can manage lesson materials" on public.lesson_materials;
create policy "Admins can manage lesson materials" on public.lesson_materials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- CREATIVES: Afiliados leem, admins gerenciam
drop policy if exists "Anyone authenticated can view creatives" on public.creatives;
create policy "Anyone authenticated can view creatives" on public.creatives for select to authenticated using (true);

drop policy if exists "Admins can manage creatives" on public.creatives;
create policy "Admins can manage creatives" on public.creatives for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- MATERIALS: Afiliados leem, admins gerenciam
drop policy if exists "Anyone authenticated can view materials" on public.materials;
create policy "Anyone authenticated can view materials" on public.materials for select to authenticated using (true);

drop policy if exists "Admins can manage materials" on public.materials;
create policy "Admins can manage materials" on public.materials for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- AFFILIATE LINKS: Afiliados leem, admins gerenciam
drop policy if exists "Anyone authenticated can view affiliate links" on public.affiliate_links;
create policy "Anyone authenticated can view affiliate links" on public.affiliate_links for select to authenticated using (true);

drop policy if exists "Admins can manage affiliate links" on public.affiliate_links;
create policy "Admins can manage affiliate links" on public.affiliate_links for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- LESSON PROGRESS: Afiliados gerenciam seu próprio progresso
drop policy if exists "Users can view own lesson progress" on public.lesson_progress;
create policy "Users can view own lesson progress" on public.lesson_progress for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users can insert own lesson progress" on public.lesson_progress;
create policy "Users can insert own lesson progress" on public.lesson_progress for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lesson progress" on public.lesson_progress;
create policy "Users can delete own lesson progress" on public.lesson_progress for delete to authenticated using (auth.uid() = user_id);

-- COMMUNITY POSTS & LIKES
drop policy if exists "Anyone authenticated can view community posts" on public.community_posts;
create policy "Anyone authenticated can view community posts" on public.community_posts for select to authenticated using (true);

drop policy if exists "Authenticated users can create posts" on public.community_posts;
create policy "Authenticated users can create posts" on public.community_posts for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.community_posts;
create policy "Users can delete their own posts" on public.community_posts for delete to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Anyone authenticated can view likes" on public.post_likes;
create policy "Anyone authenticated can view likes" on public.post_likes for select to authenticated using (true);

drop policy if exists "Users can add like" on public.post_likes;
create policy "Users can add like" on public.post_likes for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove like" on public.post_likes;
create policy "Users can remove like" on public.post_likes for delete to authenticated using (auth.uid() = user_id);

-- ANNOUNCEMENTS
drop policy if exists "Anyone authenticated can view announcements" on public.announcements;
create policy "Anyone authenticated can view announcements" on public.announcements for select to authenticated using (true);

drop policy if exists "Admins can manage announcements" on public.announcements;
create policy "Admins can manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users can view and set their read announcements" on public.read_announcements;
create policy "Users can view and set their read announcements" on public.read_announcements for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ==============================================================================
-- INITIAL DEFAULT TENANT & SEED DATA
-- ==============================================================================

-- 1. Inserir Tenant padrão 'Vellessa'
insert into public.tenants (name, slug, brand_color, default_commission)
values ('Vellessa Cosméticos', 'vellessa', 'oklch(0.60 0.13 75)', 0.60)
on conflict (slug) do nothing;

-- 2. Inserir Links Oficiais Padrão
do $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id from public.tenants where slug = 'vellessa' limit 1;

  if v_tenant_id is not null then
    insert into public.affiliate_links (tenant_id, label, url_template, note, order_index)
    values
      (v_tenant_id, 'Página Principal (Home)', 'https://vellessa.com/?ref={CODE}', 'Página oficial com seu código rastreador', 1),
      (v_tenant_id, 'Oferta Kit 3 Frascos', 'https://vellessa.com/kit3?ref={CODE}', 'Maior ticket médio e maior comissão', 2),
      (v_tenant_id, 'Página de Vídeo (VSL)', 'https://vellessa.com/vsl?ref={CODE}', 'Ideal para tráfego frio e alta conversão', 3)
    on conflict do nothing;
  end if;
end $$;

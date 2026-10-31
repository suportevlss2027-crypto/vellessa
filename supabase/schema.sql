-- ==============================================================================
-- VELESSA AFILIADOS - SUPABASE DATABASE SCHEMA & RLS POLICIES (IDEMPOTENTE)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  first_name text,
  email text unique not null,
  phone text,
  instagram text,
  affiliate_code text unique not null,
  level text default 'Afiliada Ouro' not null,
  commission_rate numeric(5,2) default 0.60 not null,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Index for fast lookup by affiliate code and email
create index if not exists idx_profiles_affiliate_code on public.profiles(affiliate_code);
create index if not exists idx_profiles_email on public.profiles(email);

-- 3. LESSON PROGRESS TABLE
create table if not exists public.lesson_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lesson_id text not null,
  completed boolean default true not null,
  completed_at timestamptz default timezone('utc'::text, now()) not null,
  unique(user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id);

-- 4. COMMUNITY POSTS TABLE
create table if not exists public.community_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  author_initials text not null,
  body text not null,
  likes_count integer default 0 not null,
  replies_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists idx_community_posts_created on public.community_posts(created_at desc);

-- 5. POST LIKES TABLE
create table if not exists public.post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.community_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- 6. ANNOUNCEMENTS TABLE
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text not null,
  author text default 'Equipe Vellessa' not null,
  pinned boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. READ ANNOUNCEMENTS TABLE
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
begin
  raw_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  first_n := split_part(raw_name, ' ', 1);
  generated_code := 'VLS-' || floor(10000 + random() * 90000)::text;

  insert into public.profiles (
    id,
    name,
    first_name,
    email,
    affiliate_code,
    phone,
    instagram
  )
  values (
    new.id,
    raw_name,
    first_n,
    new.email,
    generated_code,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'instagram'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (COM DROP IF EXISTS PARA SER 100% IDEMPOTENTE)
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.community_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.announcements enable row level security;
alter table public.read_announcements enable row level security;

-- PROFILES POLICIES
drop policy if exists "Allow authenticated users to read all profiles" on public.profiles;
create policy "Allow authenticated users to read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Allow users to update own profile" on public.profiles;
create policy "Allow users to update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- LESSON PROGRESS POLICIES
drop policy if exists "Users can view own lesson progress" on public.lesson_progress;
create policy "Users can view own lesson progress"
  on public.lesson_progress for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own lesson progress" on public.lesson_progress;
create policy "Users can insert own lesson progress"
  on public.lesson_progress for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own lesson progress" on public.lesson_progress;
create policy "Users can delete own lesson progress"
  on public.lesson_progress for delete
  to authenticated
  using (auth.uid() = user_id);

-- COMMUNITY POSTS POLICIES
drop policy if exists "Anyone authenticated can view community posts" on public.community_posts;
create policy "Anyone authenticated can view community posts"
  on public.community_posts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create posts" on public.community_posts;
create policy "Authenticated users can create posts"
  on public.community_posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own posts" on public.community_posts;
create policy "Users can delete their own posts"
  on public.community_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- POST LIKES POLICIES
drop policy if exists "Anyone authenticated can view likes" on public.post_likes;
create policy "Anyone authenticated can view likes"
  on public.post_likes for select
  to authenticated
  using (true);

drop policy if exists "Users can add like" on public.post_likes;
create policy "Users can add like"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove like" on public.post_likes;
create policy "Users can remove like"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ANNOUNCEMENTS POLICIES
drop policy if exists "Anyone authenticated can view announcements" on public.announcements;
create policy "Anyone authenticated can view announcements"
  on public.announcements for select
  to authenticated
  using (true);

-- READ ANNOUNCEMENTS POLICIES
drop policy if exists "Users can view and set their read announcements" on public.read_announcements;
create policy "Users can view and set their read announcements"
  on public.read_announcements for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ==============================================================================
-- INITIAL SEED DATA (Avisos Oficiais da Equipe Vellessa)
-- ==============================================================================

insert into public.announcements (title, body, author, pinned)
values
  (
    'Nova comissão de 60% no Kit 3 frascos',
    'A partir desta semana, todas as vendas do Kit 3 frascos pagam 60% de comissão. Os novos links já estão disponíveis na aba Materiais.',
    'Equipe Vellessa',
    true
  ),
  (
    'Criativos de Alta Conversão liberados',
    'Preparamos peças exclusivas para campanhas no Meta Ads e TikTok. Acesse a aba Criativos e filtre por Stories ou Reels.',
    'Equipe Vellessa',
    true
  ),
  (
    'Live de Estratégia de Escala — Quinta, 20h',
    'Vamos analisar campanhas reais de afiliadas que faturaram mais de R$ 50 mil no mês com o Sérum Vellessa.',
    'Equipe Vellessa',
    false
  )
on conflict do nothing;

import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || "";
// Normalize URL to remove any trailing slash or rest endpoints
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export { supabaseUrl };

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-id.supabase.co"
);

// Resilient initialization: If env vars aren't populated yet, provide a mock-safe instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);

// Cliente isolado (sem persistência de sessão em localStorage) para operações de admin
// como criar contas de usuários sem deslogar o administrador atual
export function createIsolatedSupabaseClient() {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export interface DatabaseTenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color: string;
  default_commission: number;
  active: boolean;
  created_at: string;
}

export interface DatabaseProfile {
  id: string;
  tenant_id?: string;
  role: "admin" | "affiliate" | "manager";
  name: string;
  first_name: string;
  email: string;
  phone?: string;
  instagram?: string;
  affiliate_code: string;
  level: string;
  commission_rate: number;
  avatar_url?: string;
  status: "active" | "suspended" | "pending";
  created_at: string;
  updated_at: string;
}

export interface DatabaseModule {
  id: string;
  tenant_id?: string;
  title: string;
  subtitle?: string;
  cover_url?: string;
  order_index: number;
  created_at: string;
  lessons?: DatabaseLesson[];
}

export interface DatabaseLesson {
  id: string;
  tenant_id?: string;
  module_id: string;
  title: string;
  duration: string;
  video_url?: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface DatabaseCreativeFolder {
  id: string;
  tenant_id?: string;
  name: string;
  description?: string;
  color?: string;
  cover_image?: string;
  order_index?: number;
  created_at?: string;
}

export interface DatabaseCreative {
  id: string;
  tenant_id?: string;
  title: string;
  type: "Feed" | "Stories" | "Reels" | "Copy";
  format: string;
  image?: string;
  media_url?: string;
  suggested_copy?: string;
  text?: string;
  folder_id?: string;
  file_url?: string;
  external_download_url?: string;
  file_type?: string;
  file_size?: string;
  storage_type?: string;
  storage_path?: string;
  order_index: number;
  created_at: string;
}

export interface DatabaseMaterial {
  id: string;
  tenant_id?: string;
  title: string;
  kind: string;
  file_url?: string;
  size: string;
  order_index: number;
  created_at: string;
}

export interface DatabaseAffiliateLink {
  id: string;
  tenant_id?: string;
  label: string;
  url_template: string;
  note?: string;
  order_index: number;
  created_at: string;
}

export interface DatabaseLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string;
}

export interface DatabaseCommunityPost {
  id: string;
  tenant_id?: string;
  user_id: string;
  author_name: string;
  author_initials: string;
  body: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
}

export interface DatabaseAnnouncement {
  id: string;
  tenant_id?: string;
  title: string;
  body: string;
  author: string;
  pinned: boolean;
  created_at: string;
}

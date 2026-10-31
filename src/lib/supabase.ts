import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-id.supabase.co"
);

// Resilient initialization: If env vars aren't populated yet, provide a mock-safe instance
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as ReturnType<typeof createClient>);

export interface DatabaseProfile {
  id: string;
  name: string;
  first_name: string;
  email: string;
  phone?: string;
  instagram?: string;
  affiliate_code: string;
  level: string;
  commission_rate: number;
  created_at: string;
  updated_at: string;
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
  title: string;
  body: string;
  author: string;
  pinned: boolean;
  created_at: string;
}

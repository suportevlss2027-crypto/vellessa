import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

// ─── RBAC: Super Admin Authority ──────────────────────────────────────────────
// Somente e-mails que contêm "ymarssico" são reconhecidos como Titular (Super Admin).
// Esta lógica é imutável e não pode ser sobrescrita por localStorage ou qualquer
// outro mecanismo de sessão.
const SUPER_ADMIN_IDENTIFIER = "ymarssico";

export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim().includes(SUPER_ADMIN_IDENTIFIER);
}
// ──────────────────────────────────────────────────────────────────────────────
import {
  type Lesson,
  type Module,
  type Creative,
} from "@/data/content";
import { supabase, isSupabaseConfigured, type DatabaseProfile } from "./supabase";

export interface AffiliateProfile {
  name: string;
  first: string;
  level: string;
  email: string;
  id: string;
  phone: string;
  instagram: string;
  role: "admin" | "affiliate";
}

export interface CommunityPost {
  id: string;
  author: string;
  initials: string;
  time: string;
  body: string;
  likes: number;
  replies: number;
  userLiked?: boolean;
}

export interface PlatformFeatureSettings {
  trafficManagerEnabled: boolean;
  communityEnabled: boolean;
}

export interface AnnouncementItem {
  id: string;
  pinned?: boolean;
  author: string;
  time: string;
  title: string;
  body: string;
  read?: boolean;
}

export interface DynamicModule extends Module {
  order_index?: number;
}

export interface DynamicLink {
  id?: string;
  label: string;
  url: string;
  note: string;
}

export interface DynamicMaterial {
  id?: string;
  title: string;
  kind: string;
  size: string;
  file_url?: string;
}

export interface AffiliateMonitoringData {
  affiliateId: string;
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  level: string;
  role: "admin" | "affiliate";
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  completedLessonIds: string[];
  lastLessonWatchedTitle?: string;
  lastLessonWatchedAt?: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: "meta" | "google" | "tiktok" | "outro";
  status: "testing" | "active" | "scaling" | "paused";
  kitName: string;
  commissionPerSale: number;
  targetAudience?: string;
  creativeSource: "official" | "custom";
  officialCreativeId?: string;
  officialCreativeTitle?: string;
  officialCreativeImage?: string;
  customCreative?: {
    title: string;
    format: "Feed" | "Stories" | "Reels" | "Copy";
    imageOrVideoUrl?: string;
  };
  dailyBudget: number;
  totalAdSpend: number;
  salesCount: number;
  totalCommission: number;
  extraCosts?: number;
  startDate: string;
  notes?: string;
  utmLink?: string;
  destinationUrl?: string;
}

interface AffiliateStoreContextType {
  profile: AffiliateProfile;
  isAdmin: boolean;
  isTitular: boolean;
  updateProfile: (updated: Partial<AffiliateProfile>) => Promise<void>;

  // Dynamic Course & Lessons State
  modulesList: DynamicModule[];
  allLessonsList: (Lesson & { module: DynamicModule })[];
  completedLessonIds: string[];
  isLessonDone: (id: string) => boolean;
  toggleLessonDone: (id: string) => void;
  markLessonDone: (id: string, lessonTitle?: string) => void;
  completedCount: number;
  totalLessonsCount: number;
  progressPercentage: number;
  nextLesson: (Lesson & { module: DynamicModule }) | null;

  // Telemetria & Monitoramento de Afiliados
  affiliatesMonitoring: Record<string, AffiliateMonitoringData>;
  recordAffiliateActivity: (data: { affiliateId: string; name?: string; email?: string; completedLessonId?: string; lessonTitle?: string }) => void;

  // Dynamic Creatives, Materials, Links
  creativesList: Creative[];
  materialsList: DynamicMaterial[];
  linksList: DynamicLink[];

  // Admin CMS Actions
  createModule: (data: { title: string; subtitle: string; cover?: string }) => Promise<void>;
  updateModule: (id: string, data: { title?: string; subtitle?: string; cover?: string }) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  createLesson: (data: { moduleId: string; title: string; duration: string; videoUrl?: string; description?: string }) => Promise<void>;
  updateLesson: (moduleId: string, lessonId: string, data: { title?: string; duration?: string; videoUrl?: string; description?: string }) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  createCreative: (data: { title: string; type: "Feed" | "Stories" | "Reels" | "Copy"; format: string; image?: string; text?: string }) => Promise<void>;
  updateCreative: (id: string, data: { title?: string; type?: "Feed" | "Stories" | "Reels" | "Copy"; format?: string; image?: string; text?: string }) => Promise<void>;
  deleteCreative: (id: string) => Promise<void>;
  createMaterial: (data: { title: string; kind: string; size: string; file_url?: string }) => Promise<void>;
  updateMaterial: (id: string, data: { title?: string; kind?: string; size?: string; file_url?: string }) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  createAffiliateLink: (data: { label: string; url: string; note: string }) => Promise<void>;
  updateAffiliateLink: (id: string, data: { label?: string; url?: string; note?: string }) => Promise<void>;
  deleteAffiliateLink: (id: string) => Promise<void>;
  seedInitialDataToDatabase: () => Promise<void>;

  // Feature Settings / Module Control
  featureSettings: PlatformFeatureSettings;
  toggleFeature: (key: keyof PlatformFeatureSettings) => void;
  updateFeatureSettings: (settings: Partial<PlatformFeatureSettings>) => void;

  // Community state
  posts: CommunityPost[];
  addPost: (body: string) => void;
  toggleLikePost: (postId: string) => void;

  // Notifications state
  announcements: AnnouncementItem[];
  unreadAnnouncementsCount: number;
  markAllNotificationsRead: () => void;
  createAnnouncement: (title: string, body: string, pinned?: boolean) => Promise<void>;

  // Auth state
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  adminLogin: (email: string, password?: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  adminSignUp: (data: { name: string; email: string; password: string; masterKey?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  // Gestão de Tráfego & Campanhas (Meta Ads)
  campaignsList: Campaign[];
  createCampaign: (data: Omit<Campaign, "id">) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  recordCampaignMetric: (id: string, metric: { adSpend: number; salesCount: number; extraCosts?: number }) => void;

  // Utilities
  copyText: (text: string, successLabel?: string) => Promise<boolean>;
  downloadAsset: (url: string, filename: string) => void;
}

const STORAGE_KEYS = {
  PROFILE: "vellessa_affiliate_profile",
  COMPLETED_LESSONS: "vellessa_completed_lessons",
  POSTS: "vellessa_community_posts",
  READ_ANNOUNCEMENTS: "vellessa_read_announcements",
  ANNOUNCEMENTS: "vellessa_dynamic_announcements",
  AUTH: "vellessa_auth_state",
  MODULES: "vellessa_dynamic_modules",
  CREATIVES: "vellessa_dynamic_creatives",
  MATERIALS: "vellessa_dynamic_materials",
  LINKS: "vellessa_dynamic_links",
  AFFILIATES_MONITORING: "vellessa_affiliates_monitoring",
  CAMPAIGNS: "vellessa_affiliate_campaigns",
  FEATURE_SETTINGS: "vellessa_feature_settings",
};

export const DEFAULT_FEATURE_SETTINGS: PlatformFeatureSettings = {
  trafficManagerEnabled: false,
  communityEnabled: false,
};

const DEFAULT_EMPTY_PROFILE: AffiliateProfile = {
  id: "",
  name: "",
  first: "Afiliada",
  level: "Afiliada Oficial",
  email: "",
  phone: "",
  instagram: "",
  role: "affiliate",
};

// Limpeza de contingência QA: remove resquícios de dados fictícios locais (Mariana Costa, posts de teste, etc.)
if (typeof window !== "undefined") {
  try {
    const CLEAN_KEY = "vellessa_qa_clean_v2";
    if (localStorage.getItem(CLEAN_KEY) !== "true") {
      const savedProf = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProf && (savedProf.includes("Mariana Costa") || savedProf.includes("mariana@email.com"))) {
        localStorage.removeItem(STORAGE_KEYS.PROFILE);
      }
      const savedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (savedPosts && (savedPosts.includes("Juliana R.") || savedPosts.includes("Ritual dourado"))) {
        localStorage.removeItem(STORAGE_KEYS.POSTS);
      }
      const savedModules = localStorage.getItem(STORAGE_KEYS.MODULES);
      if (savedModules && savedModules.includes("boas-vindas")) {
        localStorage.removeItem(STORAGE_KEYS.MODULES);
      }
      const savedCreatives = localStorage.getItem(STORAGE_KEYS.CREATIVES);
      if (savedCreatives && savedCreatives.includes("Ritual dourado")) {
        localStorage.removeItem(STORAGE_KEYS.CREATIVES);
      }
      const savedMaterials = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (savedMaterials && savedMaterials.includes("Guia completo do afiliado")) {
        localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      }
      const savedAnnouncements = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (savedAnnouncements && savedAnnouncements.includes("Nova comissão de 60%")) {
        localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
      }
      localStorage.setItem(CLEAN_KEY, "true");
    }
  } catch (e) {
    // Ignore storage errors
  }
}

const AffiliateStoreContext = createContext<AffiliateStoreContextType | null>(null);

export function AffiliateStoreProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Profile State (100% limpo, sem nomes fictícios)
  const [profile, setProfile] = useState<AffiliateProfile>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_EMPTY_PROFILE;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name === "Mariana Costa" || parsed?.email === "mariana@email.com") {
          return DEFAULT_EMPTY_PROFILE;
        }
        if (parsed?.role === "admin" && !isSuperAdmin(parsed?.email) && !isSupabaseConfigured) {
          parsed.role = "affiliate";
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_EMPTY_PROFILE;
  });

  const isAdmin = profile.role === "admin";
  const isTitular = isSuperAdmin(profile.email);

  // 2. Dynamic Content Lists (Iniciam vazias — alimentadas apenas via Admin CMS / Supabase)
  const [modulesList, setModulesList] = useState<DynamicModule[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MODULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [creativesList, setCreativesList] = useState<Creative[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREATIVES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [materialsList, setMaterialsList] = useState<DynamicMaterial[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [linksList, setLinksList] = useState<DynamicLink[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LINKS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Calculate dynamic lessons
  const allLessonsList = useMemo(() => {
    return modulesList.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
  }, [modulesList]);

  // 3. Completed Lessons
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return allLessonsList.filter((l) => l.done).map((l) => l.id);
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return allLessonsList.filter((l) => l.done).map((l) => l.id);
  });

  // Telemetria & Monitoramento de Afiliados
  const [affiliatesMonitoring, setAffiliatesMonitoring] = useState<Record<string, AffiliateMonitoringData>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AFFILIATES_MONITORING);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const recordAffiliateActivity = useCallback(
    (data: {
      affiliateId: string;
      name?: string;
      email?: string;
      completedLessonId?: string;
      lessonTitle?: string;
    }) => {
      const key = data.affiliateId;
      if (!key) return;
      const now = new Date().toISOString();

      setAffiliatesMonitoring((prev) => {
        const existing = prev[key] || {
          affiliateId: key,
          name: data.name || "Afiliada",
          email: data.email || "",
          level: "Afiliada Oficial",
          role: "affiliate",
          createdAt: now,
          lastLoginAt: now,
          loginCount: 1,
          completedLessonIds: [],
        };

        const newCompleted = data.completedLessonId
          ? Array.from(new Set([...existing.completedLessonIds, data.completedLessonId]))
          : existing.completedLessonIds;

        const updated: AffiliateMonitoringData = {
          ...existing,
          name: data.name || existing.name,
          email: data.email || existing.email,
          completedLessonIds: newCompleted,
          lastLessonWatchedTitle: data.lessonTitle || existing.lastLessonWatchedTitle,
          lastLessonWatchedAt: data.completedLessonId ? now : existing.lastLessonWatchedAt,
        };

        const next = { ...prev, [key]: updated };
        try {
          localStorage.setItem(STORAGE_KEYS.AFFILIATES_MONITORING, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const recordAffiliateAccess = useCallback(
    (prof: AffiliateProfile) => {
      const key = prof.id || prof.email;
      if (!key) return;
      const now = new Date().toISOString();

      setAffiliatesMonitoring((prev) => {
        const existing = prev[key] || {
          affiliateId: key,
          name: prof.name || "Afiliada",
          email: prof.email || "",
          phone: prof.phone || "",
          instagram: prof.instagram || "",
          level: prof.level || "Afiliada Oficial",
          role: prof.role || "affiliate",
          createdAt: now,
          lastLoginAt: now,
          loginCount: 0,
          completedLessonIds: [],
        };

        const updated: AffiliateMonitoringData = {
          ...existing,
          name: prof.name || existing.name,
          email: prof.email || existing.email,
          phone: prof.phone || existing.phone,
          instagram: prof.instagram || existing.instagram,
          level: prof.level || existing.level,
          role: prof.role || existing.role,
          lastLoginAt: now,
          loginCount: (existing.loginCount || 0) + 1,
        };

        const next = { ...prev, [key]: updated };
        try {
          localStorage.setItem(STORAGE_KEYS.AFFILIATES_MONITORING, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  const isLessonDone = (id: string) => completedLessonIds.includes(id);

  const toggleLessonDone = (id: string) => {
    setCompletedLessonIds((prev) => {
      const isRemoving = prev.includes(id);
      const next = isRemoving ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (profile.id || profile.email) {
      recordAffiliateActivity({
        affiliateId: profile.id || profile.email,
        name: profile.name,
        email: profile.email,
        completedLessonId: id,
      });
    }
  };

  const markLessonDone = (id: string, lessonTitle?: string) => {
    setCompletedLessonIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (profile.id || profile.email) {
      recordAffiliateActivity({
        affiliateId: profile.id || profile.email,
        name: profile.name,
        email: profile.email,
        completedLessonId: id,
        lessonTitle,
      });
    }
  };

  const totalLessonsCount = allLessonsList.length;
  const completedCount = completedLessonIds.length;
  const progressPercentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  const nextLesson = useMemo(() => {
    const pending = allLessonsList.find((l) => !completedLessonIds.includes(l.id));
    return pending ?? allLessonsList[0] ?? null;
  }, [allLessonsList, completedLessonIds]);

  // 4. Update Profile
  const updateProfile = async (updated: Partial<AffiliateProfile>) => {
    setProfile((prev) => {
      // RBAC: Prevenir estritamente escalada de privilégio de role via updateProfile
      const { role, ...safeUpdated } = updated as any;
      const next = { ...prev, ...safeUpdated };
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            name: updated.name,
            phone: updated.phone,
            instagram: updated.instagram,
          }).eq("id", user.id);
        }
      } catch (e) {
        console.error("Supabase profile sync error:", e);
      }
    }

    toast.success("Perfil atualizado com sucesso!");
  };

  // 5. Auth Implementation with Supabase
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return saved === "true";
    } catch {
      return false;
    }
  });

  const checkSupabaseSession = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        // Fetch real profile
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (dbProfile) {
          const loadedProf: AffiliateProfile = {
            id: dbProfile.affiliate_code || session.user.id.slice(0, 8),
            name: dbProfile.name || session.user.email?.split("@")[0] || "Afiliada",
            first: dbProfile.first_name || dbProfile.name?.split(" ")[0] || "Afiliada",
            email: session.user.email || "",
            level: dbProfile.level || "Afiliada Ouro",
            phone: dbProfile.phone || "",
            instagram: dbProfile.instagram || "",
            role: dbProfile.role === "admin" ? "admin" : "affiliate",
          };
          setProfile(loadedProf);
          recordAffiliateAccess(loadedProf);
        }
      }
    } catch (e) {
      console.error("Session check error", e);
    }
  }, []);

  useEffect(() => {
    checkSupabaseSession();
  }, [checkSupabaseSession]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          toast.error(`Falha no login: ${error.message}`);
          setAuthLoading(false);
          return false;
        }

        if (data.user) {
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.AUTH, "true");
          await checkSupabaseSession();
          toast.success("Autenticado com sucesso!");
          setAuthLoading(false);
          return true;
        }
      }

      // Offline / Demo fallback
      // RBAC: a role é determinada EXCLUSIVAMENTE pelo e-mail —
      // nunca herdada de sessão anterior (prev.role). Isso elimina
      // o vetor de escalada de privilégio por contaminação de localStorage.
      setIsAuthenticated(true);
      const fallbackProf: AffiliateProfile = {
        ...profile,
        email: email || profile.email,
        first: email.split("@")[0] || profile.first,
        name: email.split("@")[0] || profile.name,
        role: isSuperAdmin(email) ? "admin" : "affiliate",
      };
      setProfile(fallbackProf);
      recordAffiliateAccess(fallbackProf);
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      toast.success("Acesso autenticado com sucesso!");
      setAuthLoading(false);
      return true;
    } catch (err) {
      console.error("Login error", err);
      toast.error("Ocorreu um erro ao entrar.");
      setAuthLoading(false);
      return false;
    }
  };

  const adminLogin = async (email: string, password?: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          toast.error(`Falha no login administrativo: ${error.message}`);
          setAuthLoading(false);
          return false;
        }

        if (data.user) {
          // Check if user has admin role in profiles table
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (dbProfile?.role !== "admin") {
            // Not an admin! Log them out immediately
            await supabase.auth.signOut().catch(() => {});
            toast.error("Acesso negado: esta conta não possui permissões administrativas.");
            setAuthLoading(false);
            return false;
          }

          setIsAuthenticated(true);
          const adminProf: AffiliateProfile = {
            id: dbProfile.affiliate_code || data.user.id.slice(0, 8),
            name: dbProfile.name || data.user.email?.split("@")[0] || "Administrador",
            first: dbProfile.first_name || dbProfile.name?.split(" ")[0] || "Admin",
            email: data.user.email || "",
            level: "Administrador Geral",
            phone: dbProfile.phone || "",
            instagram: dbProfile.instagram || "",
            role: "admin",
          };
          setProfile(adminProf);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(adminProf));
          localStorage.setItem(STORAGE_KEYS.AUTH, "true");
          toast.success("Autenticado como Administrador!");
          setAuthLoading(false);
          return true;
        }
      }

      // Offline / Demo fallback para Admin
      // RBAC: apenas o titular (ymarssico) pode acessar o painel admin
      // em modo offline. Qualquer outra tentativa é bloqueada.
      if (!isSuperAdmin(email)) {
        toast.error("Acesso negado: esta conta não possui permissões administrativas.");
        setAuthLoading(false);
        return false;
      }
      setIsAuthenticated(true);
      const demoAdmin: AffiliateProfile = {
        id: "VLS-TITULAR",
        name: "Titular Vellessa",
        first: "Titular",
        email: email || "ymarssico@gmail.com",
        level: "Titular — Super Admin",
        phone: "",
        instagram: "@vellessa",
        role: "admin",
      };
      setProfile(demoAdmin);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(demoAdmin));
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      toast.success("Acesso do Titular liberado!");
      setAuthLoading(false);
      return true;
    } catch (err) {
      console.error("Admin login error", err);
      toast.error("Ocorreu um erro ao acessar o painel administrativo.");
      setAuthLoading(false);
      return false;
    }
  };

  const adminSignUp = async (data: {
    name: string;
    email: string;
    password: string;
    masterKey?: string;
  }): Promise<boolean> => {
    setAuthLoading(true);
    const trimmedEmail = data.email.trim();
    const trimmedPass = data.password.trim();
    const trimmedName = data.name.trim();

    // RBAC: Cadastro público administrativo permanentemente revogado.
    // Somente o Titular (ymarssico) pode existir ou nomear novos administradores.
    if (!isSuperAdmin(trimmedEmail)) {
      toast.error("Acesso negado: novos administradores só podem ser nomeados pelo Titular (ymarssico).");
      setAuthLoading(false);
      return false;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data: authData, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPass,
          options: {
            data: {
              name: trimmedName,
              role: "admin",
              master_key: key || "VELLESSA-MASTER-2026",
            },
          },
        });

        if (error) {
          toast.error(`Falha ao registrar administrador: ${error.message}`);
          setAuthLoading(false);
          return false;
        }

        if (authData.user) {
          // Tentar autenticar diretamente
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: trimmedPass,
          });

          if (!signInErr) {
            setIsAuthenticated(true);
            const adminProf: AffiliateProfile = {
              id: authData.user.id.slice(0, 8),
              name: trimmedName,
              first: trimmedName.split(" ")[0] || "Admin",
              email: trimmedEmail,
              level: "Administrador Geral",
              phone: "",
              instagram: "",
              role: "admin",
            };
            setProfile(adminProf);
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(adminProf));
            localStorage.setItem(STORAGE_KEYS.AUTH, "true");
            toast.success("Conta de Administrador criada com sucesso!");
            setAuthLoading(false);
            return true;
          } else {
            toast.success("Conta de Administrador criada! Efetue login para acessar.");
            setAuthLoading(false);
            return true;
          }
        }
      }

      // Offline / Local demo fallback
      setIsAuthenticated(true);
      const demoAdmin: AffiliateProfile = {
        id: "VLS-TITULAR",
        name: trimmedName || "Titular Vellessa",
        first: trimmedName.split(" ")[0] || "Titular",
        email: trimmedEmail,
        level: "Titular — Super Admin",
        phone: "",
        instagram: "@vellessa",
        role: "admin",
      };
      setProfile(demoAdmin);
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(demoAdmin));
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      toast.success("Conta de Administrador criada com sucesso!");
      setAuthLoading(false);
      return true;
    } catch (e: any) {
      console.error("Admin signup error", e);
      toast.error(`Erro ao criar conta administrativa: ${e?.message || "Tente novamente."}`);
      setAuthLoading(false);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              name: name.trim(),
              role: "affiliate",
            },
          },
        });

        if (error) {
          toast.error(`Falha no cadastro: ${error.message}`);
          setAuthLoading(false);
          return false;
        }

        if (data.user) {
          toast.success("Conta criada! Você já pode acessar a plataforma.");
          setAuthLoading(false);
          return true;
        }
      }

      toast.success("Cadastro realizado com sucesso!");
      setAuthLoading(false);
      return true;
    } catch (e) {
      console.error("Signup error", e);
      toast.error("Erro ao cadastrar.");
      setAuthLoading(false);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (!email.trim()) {
      toast.error("Insira o seu e-mail para recuperar a senha.");
      return false;
    }
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        toast.error(`Erro: ${error.message}`);
        return false;
      }
    }
    toast.success("Instruções de redefinição de senha enviadas para o seu e-mail!");
    return true;
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, "false");
    toast.info("Você saiu da plataforma.");
  };

  // 6. Admin CMS Methods
  const createModule = async (data: { title: string; subtitle: string; cover?: string }) => {
    const newMod: DynamicModule = {
      id: `mod-${Date.now()}`,
      title: data.title,
      subtitle: data.subtitle,
      cover: data.cover || "",
      lessons: [],
    };
    const updated = [...modulesList, newMod];
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Novo módulo criado na Academia!");
  };

  const updateModule = async (id: string, data: { title?: string; subtitle?: string; cover?: string }) => {
    const updated = modulesList.map((m) => {
      if (m.id !== id) return m;
      return {
        ...m,
        title: data.title !== undefined ? data.title : m.title,
        subtitle: data.subtitle !== undefined ? data.subtitle : m.subtitle,
        cover: data.cover !== undefined ? data.cover : m.cover,
      };
    });
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Módulo atualizado com sucesso!");
  };

  const deleteModule = async (id: string) => {
    const updated = modulesList.filter((m) => m.id !== id);
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Módulo removido.");
  };

  const createLesson = async (data: {
    moduleId: string;
    title: string;
    duration: string;
    videoUrl?: string;
    description?: string;
  }) => {
    const newLesson: Lesson = {
      id: `l-${Date.now()}`,
      title: data.title,
      duration: data.duration || "10:00",
      video_url: data.videoUrl,
      description: data.description,
      done: false,
    };
    const updated = modulesList.map((m) => {
      if (m.id !== data.moduleId) return m;
      return {
        ...m,
        lessons: [...m.lessons, newLesson],
      };
    });
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Nova aula cadastrada com sucesso!");
  };

  const updateLesson = async (
    moduleId: string,
    lessonId: string,
    data: { title?: string; duration?: string; videoUrl?: string; description?: string }
  ) => {
    const updated = modulesList.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        lessons: m.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return {
            ...l,
            title: data.title !== undefined ? data.title : l.title,
            duration: data.duration !== undefined ? data.duration : l.duration,
            video_url: data.videoUrl !== undefined ? data.videoUrl : l.video_url,
            description: data.description !== undefined ? data.description : l.description,
          };
        }),
      };
    });
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Aula atualizada com sucesso!");
  };

  const deleteLesson = async (lessonId: string) => {
    const updated = modulesList.map((m) => ({
      ...m,
      lessons: m.lessons.filter((l) => l.id !== lessonId),
    }));
    setModulesList(updated);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(updated));
    toast.success("Aula removida.");
  };

  const createCreative = async (data: {
    title: string;
    type: "Feed" | "Stories" | "Reels" | "Copy";
    format: string;
    image?: string;
    text?: string;
  }) => {
    const newC: Creative = {
      id: `c-${Date.now()}`,
      title: data.title,
      type: data.type,
      format: data.format,
      image: data.image || "",
      text: data.text,
    };
    const updated = [newC, ...creativesList];
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));
    toast.success("Criativo adicionado à biblioteca de afiliados!");
  };

  const updateCreative = async (
    id: string,
    data: { title?: string; type?: "Feed" | "Stories" | "Reels" | "Copy"; format?: string; image?: string; text?: string }
  ) => {
    const updated = creativesList.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        ...data,
      };
    });
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));
    toast.success("Criativo atualizado com sucesso!");
  };

  const deleteCreative = async (id: string) => {
    const updated = creativesList.filter((c) => c.id !== id);
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));
    toast.success("Criativo removido.");
  };

  const createMaterial = async (data: { title: string; kind: string; size: string; file_url?: string }) => {
    const newM: DynamicMaterial = {
      id: `mat-${Date.now()}`,
      title: data.title,
      kind: data.kind.toUpperCase(),
      size: data.size,
      file_url: data.file_url,
    };
    const updated = [...materialsList, newM];
    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material oficial publicado!");
  };

  const updateMaterial = async (
    id: string,
    data: { title?: string; kind?: string; size?: string; file_url?: string }
  ) => {
    const updated = materialsList.map((m) => {
      if ((m.id || m.title) !== id) return m;
      return {
        ...m,
        ...data,
      };
    });
    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material atualizado com sucesso!");
  };

  const deleteMaterial = async (id: string) => {
    const updated = materialsList.filter((m) => (m.id || m.title) !== id);
    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material removido.");
  };

  const createAffiliateLink = async (data: { label: string; url: string; note: string }) => {
    const newL: DynamicLink = {
      id: `link-${Date.now()}`,
      label: data.label,
      url: data.url,
      note: data.note,
    };
    const updated = [...linksList, newL];
    setLinksList(updated);
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(updated));
    toast.success("Novo link rastreado configurado!");
  };

  const updateAffiliateLink = async (
    id: string,
    data: { label?: string; url?: string; note?: string }
  ) => {
    const updated = linksList.map((l) => {
      if ((l.id || l.url) !== id) return l;
      return {
        ...l,
        ...data,
      };
    });
    setLinksList(updated);
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(updated));
    toast.success("Link atualizado com sucesso!");
  };

  const deleteAffiliateLink = async (id: string) => {
    const updated = linksList.filter((l) => (l.id || l.url) !== id);
    setLinksList(updated);
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(updated));
    toast.success("Link removido.");
  };

  const seedInitialDataToDatabase = async () => {
    setModulesList([]);
    setCreativesList([]);
    setMaterialsList([]);
    setLinksList([]);
    localStorage.removeItem(STORAGE_KEYS.MODULES);
    localStorage.removeItem(STORAGE_KEYS.CREATIVES);
    localStorage.removeItem(STORAGE_KEYS.MATERIALS);
    localStorage.removeItem(STORAGE_KEYS.LINKS);
    toast.success("Base de dados limpa com sucesso!");
  };
  // Gestão de Tráfego & Campanhas (Meta Ads)
  const [campaignsList, setCampaignsList] = useState<Campaign[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const createCampaign = (data: Omit<Campaign, "id">) => {
    const newCamp: Campaign = {
      ...data,
      id: "camp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
      totalCommission: (data.salesCount || 0) * (data.commissionPerSale || 0),
    };
    const updated = [newCamp, ...campaignsList];
    setCampaignsList(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
    } catch {}
    toast.success("Campanha cadastrada com sucesso!");
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    const updated = campaignsList.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...data };
      merged.totalCommission = (merged.salesCount || 0) * (merged.commissionPerSale || 0);
      return merged;
    });
    setCampaignsList(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
    } catch {}
    toast.success("Campanha atualizada!");
  };

  const deleteCampaign = (id: string) => {
    const updated = campaignsList.filter((c) => c.id !== id);
    setCampaignsList(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
    } catch {}
    toast.success("Campanha removida.");
  };

  const recordCampaignMetric = (
    id: string,
    metric: { adSpend: number; salesCount: number; extraCosts?: number }
  ) => {
    const updated = campaignsList.map((c) => {
      if (c.id !== id) return c;
      const newSpend = (c.totalAdSpend || 0) + (metric.adSpend || 0);
      const newSales = (c.salesCount || 0) + (metric.salesCount || 0);
      const newExtras = (c.extraCosts || 0) + (metric.extraCosts || 0);
      const newComm = newSales * (c.commissionPerSale || 0);
      return {
        ...c,
        totalAdSpend: newSpend,
        salesCount: newSales,
        extraCosts: newExtras,
        totalCommission: newComm,
      };
    });
    setCampaignsList(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(updated));
    } catch {}
    toast.success("Métricas de anúncios registradas!");
  };

  // 6.5. Feature Settings / Controle de Módulos (Admin Toggles)
  const [featureSettings, setFeatureSettings] = useState<PlatformFeatureSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_FEATURE_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEATURE_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          trafficManagerEnabled: Boolean(parsed.trafficManagerEnabled),
          communityEnabled: Boolean(parsed.communityEnabled),
        };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_FEATURE_SETTINGS;
  });

  const toggleFeature = useCallback((key: keyof PlatformFeatureSettings) => {
    setFeatureSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEYS.FEATURE_SETTINGS, JSON.stringify(next));
      } catch {}
      const label = key === "trafficManagerEnabled" ? "Gestor de Tráfego" : "Comunidade";
      toast.success(
        next[key]
          ? `Módulo "${label}" ativado para afiliados!`
          : `Módulo "${label}" desativado para afiliados!`
      );
      return next;
    });
  }, []);

  const updateFeatureSettings = useCallback((settings: Partial<PlatformFeatureSettings>) => {
    setFeatureSettings((prev) => {
      const next = { ...prev, ...settings };
      try {
        localStorage.setItem(STORAGE_KEYS.FEATURE_SETTINGS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // 7. Community Posts
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const addPost = (body: string) => {
    if (!body.trim()) {
      toast.error("Digite uma mensagem antes de publicar.");
      return;
    }
    const initials = profile.name
      ? profile.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("")
      : (profile.first ? profile.first[0].toUpperCase() : "AF");

    const newPost: CommunityPost = {
      id: `p-${Date.now()}`,
      author: profile.name || "Afiliada",
      initials,
      time: "agora",
      body: body.trim(),
      likes: 0,
      replies: 0,
      userLiked: false,
    };
    const next = [newPost, ...posts];
    setPosts(next);
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
    toast.success("Publicação compartilhada no mural!");
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== postId) return p;
        const userLiked = !p.userLiked;
        return {
          ...p,
          userLiked,
          likes: userLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      });
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
      return next;
    });
  };

  // 8. Announcements
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (saved) {
        const parsed = JSON.parse(saved) as AnnouncementItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
    return [];
  });
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_ANNOUNCEMENTS);
      if (saved) return JSON.parse(saved);
    } catch {
      return [];
    }
    return [];
  });

  const unreadAnnouncementsCount = announcements.filter((a) => !readAnnouncementIds.includes(a.id)).length;

  const markAllNotificationsRead = () => {
    const allIds = announcements.map((a) => a.id);
    setReadAnnouncementIds(allIds);
    localStorage.setItem(STORAGE_KEYS.READ_ANNOUNCEMENTS, JSON.stringify(allIds));
    toast.success("Todas as notificações marcadas como lidas.");
  };

  const createAnnouncement = async (title: string, body: string, pinned = false) => {
    const newA: AnnouncementItem = {
      id: `a-${Date.now()}`,
      title,
      body,
      author: "Equipe Vellessa (Admin)",
      time: "Agora",
      pinned,
    };
    setAnnouncements((prev) => {
      const next = [newA, ...prev];
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(next));
      return next;
    });
    toast.success("Aviso oficial publicado para todas as afiliadas!");
  };

  // 9. Safe Clipboard & Download
  const copyText = async (text: string, successLabel = "Copiado!"): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(successLabel);
        return true;
      }
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (success) {
        toast.success(successLabel);
        return true;
      }
      throw new Error();
    } catch {
      toast.error("Copie o texto manualmente.");
      return false;
    }
  };

  const downloadAsset = (url: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Download de "${filename}" iniciado!`);
    } catch {
      toast.error("Erro ao iniciar download.");
    }
  };

  return (
    <AffiliateStoreContext.Provider
      value={{
        profile,
        isAdmin,
        isTitular,
        updateProfile,
        modulesList,
        allLessonsList,
        completedLessonIds,
        isLessonDone,
        toggleLessonDone,
        markLessonDone,
        completedCount,
        totalLessonsCount,
        progressPercentage,
        nextLesson,
        affiliatesMonitoring,
        recordAffiliateActivity,
        campaignsList,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        recordCampaignMetric,
        creativesList,
        materialsList,
        linksList,
        createModule,
        updateModule,
        deleteModule,
        createLesson,
        updateLesson,
        deleteLesson,
        createCreative,
        updateCreative,
        deleteCreative,
        createMaterial,
        updateMaterial,
        deleteMaterial,
        createAffiliateLink,
        updateAffiliateLink,
        deleteAffiliateLink,
        seedInitialDataToDatabase,
        posts,
        addPost,
        toggleLikePost,
        announcements,
        unreadAnnouncementsCount,
        markAllNotificationsRead,
        createAnnouncement,
        isAuthenticated,
        authLoading,
        login,
        adminLogin,
        signUp,
        adminSignUp,
        logout,
        resetPassword,
        copyText,
        downloadAsset,
        featureSettings,
        toggleFeature,
        updateFeatureSettings,
      }}
    >
      {children}
    </AffiliateStoreContext.Provider>
  );
}

export function useAffiliateStore() {
  const ctx = useContext(AffiliateStoreContext);
  if (!ctx) {
    throw new Error("useAffiliateStore must be used within AffiliateStoreProvider");
  }
  return ctx;
}

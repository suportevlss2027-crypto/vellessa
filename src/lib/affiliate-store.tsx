import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import { storeRawFile, getRawFile, deleteRawFile, deleteRawFiles, uploadMaterialToSupabase } from "./file-storage";
import { deleteCreativeAssets, deleteBatchCreativeAssets, uploadCreativeToSupabase, uploadIndexedDbCreativeToCloud } from "./creative-storage";

export interface AffiliateProfile {
  name: string;
  first: string;
  level: string;
  email: string;
  id: string;
  phone: string;
  instagram: string;
  role: "admin" | "affiliate";
  status?: "active" | "suspended" | "inactive" | string;
  pix_key?: string;
  onboardingCompleted?: boolean;
  trafficExperience?: "yes" | "no";
  trafficInvestment?: string;
  trafficWillingness?: "yes" | "no";
  trafficBudget?: string;
  onboardingAnswers?: Record<string, any>;
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

export type BillboardTheme = "emerald" | "gold" | "sapphire" | "ruby" | "purple";

export interface BillboardItem {
  id: string;
  badgeText: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  theme: BillboardTheme;
  showPulse: boolean;
  enabled: boolean;
}

export interface BillboardSettings {
  enabled: boolean;
  intervalSeconds: number;
  items: BillboardItem[];
  // Campos legados mantidos para 100% de retrocompatibilidade
  badgeText?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  theme?: BillboardTheme;
  showPulse?: boolean;
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

export interface MaterialFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt?: string;
}

export interface CreativeFolder {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  coverImage?: string; // Capa 16:9 estilo Kiwify (1920x1080)
  driveUrl?: string; // Link da pasta no Google Drive (opcional)
  createdAt?: string;
}

export interface MaterialFileItem {
  id: string;
  name: string;
  kind: string;
  size: string;
  bytes: number;
  sourceType: "upload" | "link";
  file_url?: string;
  mimeType?: string;
  rawFile?: Blob | File;
  thumbnailUrl?: string;
}

export interface DynamicMaterial {
  id?: string;
  title: string;
  kind: string;
  size: string;
  file_url?: string;
  sourceType?: "upload" | "link";
  rawFileName?: string;
  mimeType?: string;
  files?: MaterialFileItem[];
  folderId?: string;
}

export interface AffiliateMonitoringData {
  affiliateId: string;
  name: string;
  email: string;
  phone?: string;
  instagram?: string;
  level: string;
  role: "admin" | "affiliate";
  status?: "active" | "suspended" | "inactive" | string;
  pixKey?: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  completedLessonIds: string[];
  lastLessonWatchedTitle?: string;
  lastLessonWatchedAt?: string;
  onboardingCompleted?: boolean;
  trafficExperience?: "yes" | "no";
  trafficInvestment?: string;
  trafficWillingness?: "yes" | "no";
  trafficBudget?: string;
  onboardingAnswers?: Record<string, any>;
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

  // Sincronização forçada com Supabase (Admin → Force Push de todos os dados locais)
  forceSyncAllData: () => Promise<void>;

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
  recordAffiliateAccess: (prof: AffiliateProfile) => void;
  updateAffiliateMonitoring: (emailOrId: string, data: Partial<AffiliateMonitoringData>) => void;
  deleteAffiliateMonitoring: (emailOrId: string) => void;

  // Dynamic Creatives, Materials, Links, Folders
  creativesList: Creative[];
  materialsList: DynamicMaterial[];
  linksList: DynamicLink[];
  foldersList: MaterialFolder[];
  creativeFoldersList: CreativeFolder[];

  // Folders Actions
  createFolder: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<void>;
  updateFolder: (id: string, data: { name?: string; description?: string; color?: string; icon?: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // Creative Folders Actions (Grupos / Coleções Estilo Kiwify)
  createCreativeFolder: (data: { name: string; description?: string; color?: string; icon?: string; coverImage?: string; driveUrl?: string }) => Promise<string>;
  updateCreativeFolder: (id: string, data: { name?: string; description?: string; color?: string; icon?: string; coverImage?: string; driveUrl?: string }) => Promise<void>;
  deleteCreativeFolder: (id: string) => Promise<void>;
  moveCreativesToFolder: (creativeIds: string[], targetFolderId?: string) => Promise<void>;
  deleteCreativesBatch: (creativeIds: string[]) => Promise<void>;

  // Admin CMS Actions
  createModule: (data: { title: string; subtitle: string; cover?: string }) => Promise<void>;
  updateModule: (id: string, data: { title?: string; subtitle?: string; cover?: string }) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  createLesson: (data: { moduleId: string; title: string; duration: string; videoUrl?: string; description?: string }) => Promise<void>;
  updateLesson: (moduleId: string, lessonId: string, data: { title?: string; duration?: string; videoUrl?: string; description?: string }) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  createCreative: (data: {
    id?: string;
    title: string;
    type: "Feed" | "Stories" | "Reels" | "Copy";
    format: string;
    image?: string;
    text?: string;
    folderId?: string;
    fileUrl?: string;
    externalDownloadUrl?: string;
    fileType?: string;
    fileSize?: string;
    storageType?: "supabase" | "indexeddb" | "external";
    storagePath?: string;
  }) => Promise<void>;
  createCreativesBatch: (items: {
    id?: string;
    title: string;
    type: "Feed" | "Stories" | "Reels" | "Copy";
    format: string;
    image?: string;
    text?: string;
    folderId?: string;
    fileUrl?: string;
    externalDownloadUrl?: string;
    fileType?: string;
    fileSize?: string;
    storageType?: "supabase" | "indexeddb" | "external";
    storagePath?: string;
  }[]) => Promise<void>;
  updateCreative: (
    id: string,
    data: {
      title?: string;
      type?: "Feed" | "Stories" | "Reels" | "Copy";
      format?: string;
      image?: string;
      text?: string;
      folderId?: string;
      fileUrl?: string;
      externalDownloadUrl?: string;
      fileType?: string;
      fileSize?: string;
      storageType?: "supabase" | "indexeddb" | "external";
      storagePath?: string;
    }
  ) => Promise<void>;
  deleteCreative: (id: string) => Promise<void>;
  createMaterial: (data: {
    title: string;
    kind: string;
    size: string;
    file_url?: string;
    sourceType?: "upload" | "link";
    rawFileName?: string;
    mimeType?: string;
    rawFile?: Blob | File;
    files?: MaterialFileItem[];
    folderId?: string;
  }) => Promise<void>;
  updateMaterial: (
    id: string,
    data: {
      title?: string;
      kind?: string;
      size?: string;
      file_url?: string;
      sourceType?: "upload" | "link";
      rawFileName?: string;
      mimeType?: string;
      rawFile?: Blob | File;
      files?: MaterialFileItem[];
      folderId?: string;
    }
  ) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  createAffiliateLink: (data: { label: string; url: string; note: string }) => Promise<void>;
  updateAffiliateLink: (id: string, data: { label?: string; url?: string; note?: string }) => Promise<void>;
  deleteAffiliateLink: (id: string) => Promise<void>;
  seedInitialDataToDatabase: () => Promise<void>;

  // Feature Settings / Module Control
  featureSettings: PlatformFeatureSettings;
  toggleFeature: (key: keyof PlatformFeatureSettings) => void;
  updateFeatureSettings: (settings: Partial<PlatformFeatureSettings>) => void;

  // Outdoor / Billboard do Painel
  billboardSettings: BillboardSettings;
  updateBillboardSettings: (settings: Partial<BillboardSettings>) => void;
  resetBillboardSettings: () => void;

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
  completeOnboarding: (data: {
    phone: string;
    trafficExperience: "yes" | "no";
    trafficInvestment?: string;
    trafficWillingness?: "yes" | "no";
    trafficBudget?: string;
  }) => Promise<boolean>;
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
  FOLDERS: "vellessa_dynamic_folders",
  CREATIVE_FOLDERS: "vellessa_creative_folders",
  AFFILIATES_MONITORING: "vellessa_affiliates_monitoring",
  CAMPAIGNS: "vellessa_affiliate_campaigns",
  FEATURE_SETTINGS: "vellessa_feature_settings",
  BILLBOARD_SETTINGS: "vellessa_billboard_settings",
};

export const DEFAULT_FEATURE_SETTINGS: PlatformFeatureSettings = {
  trafficManagerEnabled: false,
  communityEnabled: false,
};

export const DEFAULT_BILLBOARD_ITEMS: BillboardItem[] = [
  {
    id: "item-logzz",
    badgeText: "LQZZ",
    title: "Parceria Oficial Logzz COD",
    subtitle: "Até 60% de comissão via Pix no checkout oficial",
    buttonText: "Acessar Logzz",
    buttonUrl: "https://app.logzz.com.br",
    theme: "emerald",
    showPulse: true,
    enabled: true,
  },
  {
    id: "item-escala",
    badgeText: "ESCALA",
    title: "Campanha Especial de Frete Grátis Ativa",
    subtitle: "Aproveite a alta conversão nos kits de 3 e 5 frascos",
    buttonText: "Ver Ofertas",
    buttonUrl: "/materiais",
    theme: "gold",
    showPulse: true,
    enabled: true,
  },
  {
    id: "item-criativos",
    badgeText: "NOVO",
    title: "Novos Criativos em Alta Resolução Disponíveis",
    subtitle: "Vídeos e imagens validados para anúncios de alta conversão",
    buttonText: "Baixar Peças",
    buttonUrl: "/criativos",
    theme: "sapphire",
    showPulse: true,
    enabled: true,
  },
];

export const DEFAULT_BILLBOARD_SETTINGS: BillboardSettings = {
  enabled: true,
  intervalSeconds: 5,
  items: DEFAULT_BILLBOARD_ITEMS,
  badgeText: "LQZZ",
  title: "Parceria Oficial Logzz COD",
  subtitle: "Até 60% de comissão via Pix no checkout oficial",
  buttonText: "Acessar Logzz",
  buttonUrl: "https://app.logzz.com.br",
  theme: "emerald",
  showPulse: true,
};

export function normalizeBillboardSettings(raw: any): BillboardSettings {
  if (!raw || typeof raw !== "object") return DEFAULT_BILLBOARD_SETTINGS;

  const intervalSeconds =
    typeof raw.intervalSeconds === "number" && raw.intervalSeconds >= 2
      ? raw.intervalSeconds
      : 5;

  let items: BillboardItem[] = [];

  if (Array.isArray(raw.items) && raw.items.length > 0) {
    items = raw.items.map((it: any, idx: number) => ({
      id: it.id || `item-${Date.now()}-${idx}`,
      badgeText: (it.badgeText || "AVISO").slice(0, 12),
      title: it.title || "Título do Outdoor",
      subtitle: it.subtitle || "",
      buttonText: it.buttonText || "Acessar",
      buttonUrl: it.buttonUrl || "",
      theme: (it.theme as BillboardTheme) || "emerald",
      showPulse: it.showPulse !== false,
      enabled: it.enabled !== false,
    }));
  } else if (raw.title) {
    items = [
      {
        id: "item-legacy",
        badgeText: (raw.badgeText || "LQZZ").slice(0, 12),
        title: raw.title,
        subtitle: raw.subtitle || "",
        buttonText: raw.buttonText || "Acessar",
        buttonUrl: raw.buttonUrl || "",
        theme: (raw.theme as BillboardTheme) || "emerald",
        showPulse: raw.showPulse !== false,
        enabled: raw.enabled !== false,
      },
    ];
  } else {
    items = DEFAULT_BILLBOARD_ITEMS;
  }

  const firstItem = items[0] || DEFAULT_BILLBOARD_ITEMS[0];

  return {
    enabled: raw.enabled !== false,
    intervalSeconds,
    items,
    badgeText: firstItem.badgeText,
    title: firstItem.title,
    subtitle: firstItem.subtitle,
    buttonText: firstItem.buttonText,
    buttonUrl: firstItem.buttonUrl,
    theme: firstItem.theme,
    showPulse: firstItem.showPulse,
  };
}

export interface BillboardPreset {
  id: string;
  label: string;
  tag: string;
  description: string;
  item: Omit<BillboardItem, "id" | "enabled">;
  settings: BillboardSettings;
}

export const BILLBOARD_PRESETS: BillboardPreset[] = [
  {
    id: "logzz",
    label: "Parceria Logzz COD",
    tag: "LQZZ",
    description: "Checkout COD oficial e comissões Pix de até 60%",
    item: {
      badgeText: "LQZZ",
      title: "Parceria Oficial Logzz COD",
      subtitle: "Até 60% de comissão via Pix no checkout oficial",
      buttonText: "Acessar Logzz",
      buttonUrl: "https://app.logzz.com.br",
      theme: "emerald",
      showPulse: true,
    },
    settings: {
      enabled: true,
      intervalSeconds: 5,
      items: [
        {
          id: "logzz-item",
          badgeText: "LQZZ",
          title: "Parceria Oficial Logzz COD",
          subtitle: "Até 60% de comissão via Pix no checkout oficial",
          buttonText: "Acessar Logzz",
          buttonUrl: "https://app.logzz.com.br",
          theme: "emerald",
          showPulse: true,
          enabled: true,
        },
      ],
      badgeText: "LQZZ",
      title: "Parceria Oficial Logzz COD",
      subtitle: "Até 60% de comissão via Pix no checkout oficial",
      buttonText: "Acessar Logzz",
      buttonUrl: "https://app.logzz.com.br",
      theme: "emerald",
      showPulse: true,
    },
  },
  {
    id: "campaign",
    label: "Campanha de Escala",
    tag: "ESCALA",
    description: "Frete grátis e kits com maior margem de lucro",
    item: {
      badgeText: "ESCALA",
      title: "Campanha Especial de Frete Grátis Ativa",
      subtitle: "Aproveite a alta conversão nos kits de 3 e 5 frascos",
      buttonText: "Ver Ofertas",
      buttonUrl: "/materiais",
      theme: "gold",
      showPulse: true,
    },
    settings: {
      enabled: true,
      intervalSeconds: 5,
      items: [
        {
          id: "campaign-item",
          badgeText: "ESCALA",
          title: "Campanha Especial de Frete Grátis Ativa",
          subtitle: "Aproveite a alta conversão nos kits de 3 e 5 frascos",
          buttonText: "Ver Ofertas",
          buttonUrl: "/materiais",
          theme: "gold",
          showPulse: true,
          enabled: true,
        },
      ],
      badgeText: "ESCALA",
      title: "Campanha Especial de Frete Grátis Ativa",
      subtitle: "Aproveite a alta conversão nos kits de 3 e 5 frascos",
      buttonText: "Ver Ofertas",
      buttonUrl: "/materiais",
      theme: "gold",
      showPulse: true,
    },
  },
  {
    id: "creatives",
    label: "Novos Criativos",
    tag: "NOVO",
    description: "Vídeos e imagens validados para tráfego pago",
    item: {
      badgeText: "NOVO",
      title: "Novos Criativos em Alta Resolução Disponíveis",
      subtitle: "Vídeos e imagens validados para anúncios de alta conversão",
      buttonText: "Baixar Peças",
      buttonUrl: "/criativos",
      theme: "sapphire",
      showPulse: true,
    },
    settings: {
      enabled: true,
      intervalSeconds: 5,
      items: [
        {
          id: "creatives-item",
          badgeText: "NOVO",
          title: "Novos Criativos em Alta Resolução Disponíveis",
          subtitle: "Vídeos e imagens validados para anúncios de alta conversão",
          buttonText: "Baixar Peças",
          buttonUrl: "/criativos",
          theme: "sapphire",
          showPulse: true,
          enabled: true,
        },
      ],
      badgeText: "NOVO",
      title: "Novos Criativos em Alta Resolução Disponíveis",
      subtitle: "Vídeos e imagens validados para anúncios de alta conversão",
      buttonText: "Baixar Peças",
      buttonUrl: "/criativos",
      theme: "sapphire",
      showPulse: true,
    },
  },
  {
    id: "urgent",
    label: "Aviso Urgente",
    tag: "AVISO",
    description: "Comunicados cruciais da gerência para todos os afiliados",
    item: {
      badgeText: "AVISO",
      title: "Comunicado Oficial da Operação Vellessa",
      subtitle: "Informações importantes sobre estoque e processamento",
      buttonText: "Ler Comunicado",
      buttonUrl: "/comunidade",
      theme: "ruby",
      showPulse: true,
    },
    settings: {
      enabled: true,
      intervalSeconds: 5,
      items: [
        {
          id: "urgent-item",
          badgeText: "AVISO",
          title: "Comunicado Oficial da Operação Vellessa",
          subtitle: "Informações importantes sobre estoque e processamento",
          buttonText: "Ler Comunicado",
          buttonUrl: "/comunidade",
          theme: "ruby",
          showPulse: true,
          enabled: true,
        },
      ],
      badgeText: "AVISO",
      title: "Comunicado Oficial da Operação Vellessa",
      subtitle: "Informações importantes sobre estoque e processamento",
      buttonText: "Ler Comunicado",
      buttonUrl: "/comunidade",
      theme: "ruby",
      showPulse: true,
    },
  },
];

export const BILLBOARD_THEMES: Record<
  BillboardTheme,
  {
    name: string;
    border: string;
    bg: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    buttonBg: string;
    buttonBorder: string;
    buttonText: string;
    pulseColor: string;
    glow: string;
  }
> = {
  emerald: {
    name: "Esmeralda Logzz",
    border: "border-emerald-500/35 hover:border-emerald-400/60",
    bg: "bg-zinc-950/85 hover:bg-zinc-950/95",
    text: "text-emerald-400",
    badgeBg: "bg-white",
    badgeText: "text-emerald-950",
    buttonBg: "bg-emerald-500/15 hover:bg-emerald-500/25",
    buttonBorder: "border-emerald-500/35",
    buttonText: "text-emerald-300 hover:text-emerald-200",
    pulseColor: "bg-emerald-400",
    glow: "rgba(16, 185, 129, 0.15)",
  },
  gold: {
    name: "Ouro Vellessa",
    border: "border-gold/40 hover:border-gold",
    bg: "bg-zinc-950/85 hover:bg-zinc-950/95",
    text: "text-gold",
    badgeBg: "bg-gold",
    badgeText: "text-primary-foreground",
    buttonBg: "bg-gold/15 hover:bg-gold/25",
    buttonBorder: "border-gold/40",
    buttonText: "text-gold hover:text-gold-light",
    pulseColor: "bg-gold",
    glow: "rgba(212, 175, 55, 0.20)",
  },
  sapphire: {
    name: "Safira Tecnológico",
    border: "border-cyan-500/35 hover:border-cyan-400/70",
    bg: "bg-zinc-950/85 hover:bg-zinc-950/95",
    text: "text-cyan-400",
    badgeBg: "bg-cyan-400",
    badgeText: "text-cyan-950",
    buttonBg: "bg-cyan-500/15 hover:bg-cyan-500/25",
    buttonBorder: "border-cyan-500/35",
    buttonText: "text-cyan-300 hover:text-cyan-200",
    pulseColor: "bg-cyan-400",
    glow: "rgba(6, 182, 212, 0.15)",
  },
  ruby: {
    name: "Rubi Urgente",
    border: "border-rose-500/35 hover:border-rose-400/70",
    bg: "bg-zinc-950/85 hover:bg-zinc-950/95",
    text: "text-rose-400",
    badgeBg: "bg-rose-500",
    badgeText: "text-white",
    buttonBg: "bg-rose-500/15 hover:bg-rose-500/25",
    buttonBorder: "border-rose-500/35",
    buttonText: "text-rose-300 hover:text-rose-200",
    pulseColor: "bg-rose-400",
    glow: "rgba(244, 63, 94, 0.18)",
  },
  purple: {
    name: "Ametista VIP",
    border: "border-purple-500/35 hover:border-purple-400/70",
    bg: "bg-zinc-950/85 hover:bg-zinc-950/95",
    text: "text-purple-400",
    badgeBg: "bg-purple-400",
    badgeText: "text-purple-950",
    buttonBg: "bg-purple-500/15 hover:bg-purple-500/25",
    buttonBorder: "border-purple-500/35",
    buttonText: "text-purple-300 hover:text-purple-200",
    pulseColor: "bg-purple-400",
    glow: "rgba(168, 85, 247, 0.18)",
  },
};

const DEFAULT_EMPTY_PROFILE: AffiliateProfile = {
  id: "",
  name: "",
  first: "Afiliado",
  level: "Afiliado Oficial",
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

  const [foldersList, setFoldersList] = useState<MaterialFolder[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [creativeFoldersList, setCreativeFoldersList] = useState<CreativeFolder[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CREATIVE_FOLDERS);
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
          name: data.name || "Afiliado",
          email: data.email || "",
          level: "Afiliado Oficial",
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
          name: prof.name || "Afiliado",
          email: prof.email || "",
          phone: prof.phone || "",
          instagram: prof.instagram || "",
          level: prof.level || "Afiliado Oficial",
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
          onboardingCompleted: prof.onboardingCompleted !== undefined ? prof.onboardingCompleted : existing.onboardingCompleted,
          trafficExperience: prof.trafficExperience || existing.trafficExperience,
          trafficInvestment: prof.trafficInvestment || existing.trafficInvestment,
          trafficWillingness: prof.trafficWillingness || existing.trafficWillingness,
          trafficBudget: prof.trafficBudget || existing.trafficBudget,
          onboardingAnswers: prof.onboardingAnswers || existing.onboardingAnswers,
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

  const updateAffiliateMonitoring = useCallback((key: string, data: Partial<AffiliateMonitoringData>) => {
    if (!key) return;
    setAffiliatesMonitoring((prev) => {
      const lowerKey = key.toLowerCase();
      const targetKey = prev[key]
        ? key
        : Object.keys(prev).find((k) => prev[k]?.email?.toLowerCase() === lowerKey || prev[k]?.affiliateId?.toLowerCase() === lowerKey) || key;

      const existing = prev[targetKey];
      if (!existing) {
        return prev;
      }

      const next = {
        ...prev,
        [targetKey]: {
          ...existing,
          ...data,
        },
      };

      try {
        localStorage.setItem(STORAGE_KEYS.AFFILIATES_MONITORING, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const deleteAffiliateMonitoring = useCallback((key: string) => {
    if (!key) return;
    setAffiliatesMonitoring((prev) => {
      const lowerKey = key.toLowerCase();
      const next = { ...prev };
      delete next[key];
      Object.keys(next).forEach((k) => {
        if (next[k]?.email?.toLowerCase() === lowerKey || next[k]?.affiliateId?.toLowerCase() === lowerKey) {
          delete next[k];
        }
      });
      try {
        localStorage.setItem(STORAGE_KEYS.AFFILIATES_MONITORING, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const isLessonDone = (id: string) => completedLessonIds.includes(id);

  const toggleLessonDone = (id: string) => {
    let isRemoving = false;
    setCompletedLessonIds((prev) => {
      isRemoving = prev.includes(id);
      const next = isRemoving ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    // Sincronização em tempo real com o banco de dados Supabase (Cross-device)
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          if (isRemoving) {
            supabase
              .from("lesson_progress")
              .delete()
              .eq("user_id", session.user.id)
              .eq("lesson_id", id)
              .then(() => {});
          } else {
            supabase
              .from("lesson_progress")
              .upsert(
                {
                  user_id: session.user.id,
                  lesson_id: id,
                  completed: true,
                  completed_at: new Date().toISOString(),
                },
                { onConflict: "user_id,lesson_id" }
              )
              .then(() => {});
          }
        }
      }).catch(() => {});
    }

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

    // Sincronização em tempo real com o banco de dados Supabase (Cross-device)
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          supabase
            .from("lesson_progress")
            .upsert(
              {
                user_id: session.user.id,
                lesson_id: id,
                completed: true,
                completed_at: new Date().toISOString(),
              },
              { onConflict: "user_id,lesson_id" }
            )
            .then(() => {});
        }
      }).catch(() => {});
    }

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
          // Bloqueio de governança para afiliados suspensos (não afeta titular nem admin)
          if (dbProfile.status === "suspended" && !isSuperAdmin(session.user.email) && dbProfile.role !== "admin") {
            toast.error("Sua conta de afiliado está temporariamente suspensa pelo administrador.");
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            localStorage.removeItem(STORAGE_KEYS.AUTH);
            return;
          }

          // Leitura do cache local para resiliência contra sobrescrita indevida
          const localSavedRaw = (() => {
            try {
              const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })();

          const isLocallyMarkedDone = (() => {
            try {
              return (
                localStorage.getItem(`vellessa_onboarding_done_${session.user.id}`) === "true" ||
                localStorage.getItem(`vellessa_onboarding_done_${session.user.email}`) === "true" ||
                Boolean(localSavedRaw?.onboardingCompleted && (localSavedRaw?.phone?.trim().length >= 10))
              );
            } catch {
              return false;
            }
          })();

          const effectivePhone = dbProfile.phone?.trim() || localSavedRaw?.phone?.trim() || "";
          const hasValidPhone = Boolean(effectivePhone && effectivePhone.length >= 10);
          const isAdminUser = dbProfile.role === "admin" || isSuperAdmin(session.user.email);
          const isDone = isAdminUser || dbProfile.onboarding_completed === true || isLocallyMarkedDone || (hasValidPhone && dbProfile.onboarding_completed !== false);

          // Auto-cura: se o telefone foi preenchido localmente mas ainda não gravou no Supabase, envia agora
          if (!dbProfile.phone && effectivePhone && hasValidPhone) {
            supabase
              .from("profiles")
              .update({
                phone: effectivePhone,
                onboarding_completed: true,
              })
              .eq("id", session.user.id)
              .then(() => {})
              .catch(() => {});
          }

          const loadedProf: AffiliateProfile = {
            id: dbProfile.affiliate_code || session.user.id.slice(0, 8),
            name: dbProfile.name || session.user.email?.split("@")[0] || "Afiliado",
            first: dbProfile.first_name || dbProfile.name?.split(" ")[0] || "Afiliado",
            email: session.user.email || "",
            level: dbProfile.level || "Afiliado Ouro",
            phone: effectivePhone,
            instagram: dbProfile.instagram || "",
            role: isAdminUser ? "admin" : (dbProfile.role === "admin" ? "admin" : "affiliate"),
            status: dbProfile.status || "active",
            pix_key: dbProfile.pix_key || "",
            onboardingCompleted: isDone,
            trafficExperience: dbProfile.traffic_experience || localSavedRaw?.trafficExperience,
            trafficInvestment: dbProfile.traffic_investment || localSavedRaw?.trafficInvestment,
            trafficWillingness: dbProfile.traffic_willingness || localSavedRaw?.trafficWillingness,
            trafficBudget: dbProfile.traffic_budget || localSavedRaw?.trafficBudget,
            onboardingAnswers: dbProfile.onboarding_answers || dbProfile.onboarding_data || localSavedRaw?.onboardingAnswers,
          };
          setProfile(loadedProf);
          try {
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(loadedProf));
          } catch {}
          recordAffiliateAccess(loadedProf);
        } else {
          // Auto-cura: Usuário autenticado órfão (sem linha em public.profiles)
          const selfAffiliateCode = `VLS-${session.user.id.slice(0, 5).toUpperCase()}`;
          const rawName = (session.user.user_metadata?.name as string) || session.user.email?.split("@")[0] || "Afiliado";
          const userRole = isSuperAdmin(session.user.email) ? "admin" : "affiliate";
          const isOrphanDone = userRole === "admin" || isLocallyMarkedDone;
          const fallbackProf: AffiliateProfile = {
            id: selfAffiliateCode,
            name: rawName,
            first: rawName.split(" ")[0] || rawName,
            email: session.user.email || "",
            level: "Afiliado(a) Ouro",
            phone: localSavedRaw?.phone || "",
            instagram: "",
            role: userRole,
            onboardingCompleted: isOrphanDone,
          };
          setProfile(fallbackProf);
          recordAffiliateAccess(fallbackProf);

          // Persiste na public.profiles imediatamente
          try {
            await supabase.from("profiles").upsert({
              id: session.user.id,
              email: session.user.email,
              name: rawName,
              first_name: fallbackProf.first,
              role: userRole,
              affiliate_code: selfAffiliateCode,
              status: "active",
              level: "Afiliado(a) Ouro",
            }, { onConflict: "id" });
          } catch { /* silencia falhas de upsert no auto-heal */ }
        }

        // Sincronização de Progresso de Aulas da Nuvem (Cross-device sync)
        try {
          const { data: progressRows } = await supabase
            .from("lesson_progress")
            .select("lesson_id")
            .eq("user_id", session.user.id);

          if (progressRows && progressRows.length > 0) {
            const dbDoneIds = progressRows.map((r: any) => r.lesson_id);
            setCompletedLessonIds((prev) => {
              const merged = Array.from(new Set([...prev, ...dbDoneIds]));
              try {
                localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch (progErr) {
          console.warn("[AffiliateStore] Aviso ao carregar lesson_progress:", progErr);
        }
      }
    } catch (e) {
      console.error("Session check error", e);
    }
  }, []);

  const hasSyncedCreativesRef = useRef(false);
  const hasSyncedMaterialsRef = useRef(false);
  const hasSyncedLinksRef = useRef(false);
  const hasSyncedSettingsRef = useRef(false);

  // ── Sincronização Inteligente de Criativos com Supabase (Zero-Data-Loss & Single-Flight) ──
  const syncCreativesWithSupabase = useCallback(async (force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (hasSyncedCreativesRef.current && !force) return;
    hasSyncedCreativesRef.current = true;

    try {
      // 1. Sincronização de Pastas / Grupos Kiwify
      const { data: dbFolders, error: foldersErr } = await supabase
        .from("creative_folders")
        .select("*")
        .order("created_at", { ascending: true });

      if (!foldersErr && dbFolders) {
        const dbFolderMap = new Map(dbFolders.map((f: any) => [f.id, f]));
        // Identifica pastas locais que ainda não estão no banco para migrar (Zero Loss)
        const currentLocalFolders = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.CREATIVE_FOLDERS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const localFoldersToSync = Array.isArray(currentLocalFolders)
          ? currentLocalFolders.filter((f: any) => !dbFolderMap.has(f.id))
          : [];

        if (localFoldersToSync.length > 0) {
          const rowsToInsert = localFoldersToSync.map((f: any) => ({
            id: f.id,
            name: f.name,
            description: f.description || null,
            color: f.color || "gold",
            cover_image: f.coverImage || null,
          }));
          await supabase.from("creative_folders").upsert(rowsToInsert);
        }

        const formattedFolders: CreativeFolder[] = dbFolders.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description || "",
          color: f.color || "gold",
          coverImage: f.cover_image || undefined,
        }));

        localFoldersToSync.forEach((lf: any) => {
          if (!formattedFolders.some((f) => f.id === lf.id)) {
            formattedFolders.push(lf);
          }
        });

        setCreativeFoldersList(formattedFolders);
        try {
          localStorage.setItem(STORAGE_KEYS.CREATIVE_FOLDERS, JSON.stringify(formattedFolders));
        } catch {}
      }

      // 2. Sincronização de Criativos (Zero-Data-Loss & Cross-Device Merge)
      const { data: dbCreatives, error: creativesErr } = await supabase
        .from("creatives")
        .select("*")
        .order("created_at", { ascending: false });

      if (!creativesErr && dbCreatives) {
        // Lê os criativos locais ANTES de qualquer alteração de estado para evitar perda de dados
        const currentLocalCreatives = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.CREATIVES);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();
        const localList: Creative[] = Array.isArray(currentLocalCreatives) ? currentLocalCreatives : [];

        const formattedRemote: Creative[] = dbCreatives.map((c: any) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          format: c.format,
          image: c.image || c.media_url || undefined,
          text: c.text || c.suggested_copy || undefined,
          folderId: c.folder_id || undefined,
          fileUrl: c.file_url || undefined,
          externalDownloadUrl: c.external_download_url || undefined,
          fileType: c.file_type || undefined,
          fileSize: c.file_size || undefined,
          storageType: c.storage_type || undefined,
          storagePath: c.storage_path || undefined,
        }));

        const dbCreativeMap = new Map(formattedRemote.map((c) => [c.id, c]));

        // Identifica criativos locais que ainda não estão no banco (Zero Data Loss)
        const localOnly = localList.filter((lc) => !dbCreativeMap.has(lc.id));

        // Mesclagem segura: preserva locais pendentes no topo + registros do banco sem perda de pasta ou link
        const mergedList: Creative[] = [
          ...localOnly,
          ...formattedRemote.map((rc) => {
            const localMatch = localList.find((lc) => lc.id === rc.id);
            if (localMatch) {
              return {
                ...rc,
                // Preserva integridade de arquivo, pasta e nuvem caso o banco retorne vazio
                fileUrl: rc.fileUrl || localMatch.fileUrl,
                folderId: rc.folderId || localMatch.folderId,
                externalDownloadUrl: rc.externalDownloadUrl || localMatch.externalDownloadUrl,
                storageType: rc.storageType || localMatch.storageType,
                fileType: rc.fileType || localMatch.fileType,
                fileSize: rc.fileSize || localMatch.fileSize,
              };
            }
            return rc;
          }),
        ];

        // Atualiza IMEDIATAMENTE a UI e o cache com a lista mesclada (nenhum criativo é apagado)
        setCreativesList(mergedList);
        try {
          localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(mergedList));
        } catch {}

        // Migração em segundo plano: envia para o Supabase Storage qualquer arquivo que esteja apenas local
        const itemsToMigrate = mergedList.filter((c) => {
          const inDb = dbCreativeMap.get(c.id);
          const notInDb = !inDb;
          const hasIndexedDbUrl = Boolean(c.fileUrl?.startsWith("indexeddb://") || inDb?.fileUrl?.startsWith("indexeddb://"));
          return notInDb || hasIndexedDbUrl;
        });

        if (itemsToMigrate.length > 0) {
          (async () => {
            let hasNewCloudUrls = false;
            const updatedMerged = [...mergedList];

            for (const c of itemsToMigrate) {
              let activeFileUrl = c.fileUrl;
              let activeStorageType = c.storageType || "supabase";

              // Se o arquivo está no IndexedDB, faz upload agora para o Supabase Storage
              if (c.id && (!activeFileUrl || activeFileUrl.startsWith("indexeddb://"))) {
                try {
                  const cloudUrl = await uploadIndexedDbCreativeToCloud(c.id, c.title);
                  if (cloudUrl) {
                    activeFileUrl = cloudUrl;
                    activeStorageType = "supabase";
                    hasNewCloudUrls = true;

                    const idx = updatedMerged.findIndex((m) => m.id === c.id);
                    if (idx !== -1) {
                      updatedMerged[idx] = {
                        ...updatedMerged[idx],
                        fileUrl: cloudUrl,
                        storageType: "supabase",
                      };
                    }
                  }
                } catch (upErr) {
                  console.warn(`[AffiliateStore] Falha ao migrar arquivo do criativo ${c.id}:`, upErr);
                }
              }

              // Salva o registro completo no Supabase
              try {
                await supabase.from("creatives").upsert({
                  id: c.id,
                  title: c.title,
                  type: c.type,
                  format: c.format,
                  image: c.image || null,
                  text: c.text || null,
                  folder_id: c.folderId || null,
                  file_url: activeFileUrl || null,
                  external_download_url: c.externalDownloadUrl || null,
                  file_type: c.fileType || null,
                  file_size: c.fileSize || null,
                  storage_type: activeStorageType,
                  storage_path: c.storagePath || null,
                });
              } catch (dbErr) {
                console.warn(`[AffiliateStore] Falha ao persistir criativo ${c.id} no Supabase:`, dbErr);
              }
            }

            if (hasNewCloudUrls) {
              setCreativesList(updatedMerged);
              try {
                localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updatedMerged));
              } catch {}
            }
          })().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[AffiliateStore] Aviso na sincronização com Supabase:", err);
    }
  }, []);

  // ── Sincronização Inteligente de Materiais e Pastas com Supabase (Zero-Data-Loss) ──
  const syncMaterialsWithSupabase = useCallback(async (force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (hasSyncedMaterialsRef.current && !force) return;
    hasSyncedMaterialsRef.current = true;

    try {
      // 1. Sincronização de Pastas Temáticas de Materiais
      const { data: dbFolders, error: foldersErr } = await supabase
        .from("material_folders")
        .select("*")
        .order("order_index", { ascending: true });

      if (!foldersErr && dbFolders) {
        const dbFolderMap = new Map(dbFolders.map((f: any) => [f.id, f]));
        const currentLocalFolders = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const localFoldersToSync = Array.isArray(currentLocalFolders)
          ? currentLocalFolders.filter((f: any) => !dbFolderMap.has(f.id))
          : [];

        if (localFoldersToSync.length > 0) {
          const rowsToInsert = localFoldersToSync.map((f: any, idx: number) => ({
            id: f.id,
            name: f.name,
            description: f.description || null,
            color: f.color || "gold",
            order_index: idx,
          }));
          await supabase.from("material_folders").upsert(rowsToInsert);
          console.log(`[SYNC] ✅ ${localFoldersToSync.length} pasta(s) de materiais migrada(s) para o Supabase.`);
        }

        const formattedFolders: MaterialFolder[] = dbFolders.map((f: any) => ({
          id: f.id,
          name: f.name,
          description: f.description || "",
          color: f.color || "gold",
          createdAt: f.created_at,
        }));

        localFoldersToSync.forEach((lf: any) => {
          if (!formattedFolders.some((f) => f.id === lf.id)) {
            formattedFolders.push(lf);
          }
        });

        setFoldersList(formattedFolders);
        try {
          localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(formattedFolders));
        } catch {}
      }

      // 2. Sincronização de Materiais e Arquivos Oficiais (Zero-Data-Loss Merge)
      const { data: dbMaterials, error: matErr } = await supabase
        .from("materials")
        .select("*")
        .order("order_index", { ascending: true });

      if (!matErr && dbMaterials) {
        // Lê os materiais locais ANTES de atualizar para não apagar arquivos locais
        const currentLocalMaterials = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();
        const localList: DynamicMaterial[] = Array.isArray(currentLocalMaterials) ? currentLocalMaterials : [];

        const formattedMaterials: DynamicMaterial[] = dbMaterials.map((m: any) => ({
          id: m.id,
          title: m.title,
          kind: m.kind,
          size: m.size,
          file_url: m.file_url || undefined,
          rawFileName: m.raw_file_name || undefined,
          sourceType: m.source_type || undefined,
          mimeType: m.mime_type || undefined,
          folderId: m.folder_id || undefined,
          files: m.files || undefined,
        }));

        const dbMaterialMap = new Map(formattedMaterials.map((m) => [m.id, m]));
        const localOnlyMaterials = localList.filter((lm) => !dbMaterialMap.has(lm.id));

        const mergedMaterials: DynamicMaterial[] = [
          ...localOnlyMaterials,
          ...formattedMaterials.map((rm) => {
            const localMatch = localList.find((lm) => lm.id === rm.id);
            if (localMatch && !rm.file_url && localMatch.file_url) {
              return { ...rm, file_url: localMatch.file_url };
            }
            return rm;
          }),
        ];

        setMaterialsList(mergedMaterials);
        try {
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(mergedMaterials));
        } catch {}

        // Migração de materiais locais pendentes
        const pendingMaterials = mergedMaterials.filter((m) => {
          const inDb = dbMaterialMap.get(m.id);
          return !inDb || (!inDb.file_url && m.file_url);
        });

        if (pendingMaterials.length > 0) {
          (async () => {
            const rowsToInsert = [];
            for (const m of pendingMaterials) {
              const matId = m.id || `mat-${Date.now()}`;
              let fileUrl = m.file_url || null;
              if (!fileUrl && (m.sourceType === "upload" || m.rawFileName)) {
                try {
                  const blob = await getRawFile(matId);
                  if (blob) {
                    const uploadedUrl = await uploadMaterialToSupabase(matId, blob, m.rawFileName);
                    if (uploadedUrl) fileUrl = uploadedUrl;
                  }
                } catch {}
              }
              rowsToInsert.push({
                id: matId,
                title: m.title,
                kind: m.kind,
                size: m.size,
                file_url: fileUrl,
                raw_file_name: m.rawFileName || null,
                source_type: m.sourceType || "link",
                mime_type: m.mimeType || null,
                folder_id: m.folderId || null,
                files: m.files || null,
                order_index: 0,
              });
            }
            if (rowsToInsert.length > 0) {
              await supabase.from("materials").upsert(rowsToInsert);
            }
          })().catch(() => {});
        }
      }
    } catch (err) {
      console.warn("[AffiliateStore] Aviso na sincronização de materiais com Supabase:", err);
    }
  }, []);

  // ── Sincronização Inteligente de Links Oficiais Logzz com Supabase ──
  const syncLinksWithSupabase = useCallback(async (force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (hasSyncedLinksRef.current && !force) return;
    hasSyncedLinksRef.current = true;

    try {
      const { data: dbLinks, error: linksErr } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("order_index", { ascending: true });

      if (!linksErr && dbLinks) {
        const dbLinkMap = new Map(dbLinks.map((l: any) => [l.id, l]));
        const currentLocalLinks = (() => {
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.LINKS);
            return raw ? JSON.parse(raw) : [];
          } catch {
            return [];
          }
        })();

        const localLinksToSync = Array.isArray(currentLocalLinks)
          ? currentLocalLinks.filter((l: any) => !dbLinkMap.has(l.id || l.url))
          : [];

        if (localLinksToSync.length > 0) {
          const rowsToInsert = localLinksToSync.map((l: any, idx: number) => ({
            id: l.id || `link-${Date.now()}-${idx}`,
            label: l.label,
            url: l.url,
            note: l.note || null,
            order_index: idx,
          }));
          await supabase.from("affiliate_links").upsert(rowsToInsert);
          console.log(`[SYNC] ✅ ${localLinksToSync.length} link(s) migrado(s) para o Supabase.`);
        }

        const formattedLinks: DynamicLink[] = dbLinks.map((l: any) => ({
          id: l.id,
          label: l.label,
          url: l.url,
          note: l.note || "",
        }));

        localLinksToSync.forEach((ll: any) => {
          if (!formattedLinks.some((l) => (l.id || l.url) === (ll.id || ll.url))) {
            formattedLinks.push(ll);
          }
        });

        setLinksList(formattedLinks);
        try {
          localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(formattedLinks));
        } catch {}
        console.log(`[SYNC] ✅ Links carregados do Supabase: ${formattedLinks.length} link(s).`);
      }
    } catch (err) {
      console.warn("[AffiliateStore] Aviso na sincronização de links com Supabase:", err);
    }
  }, []);

  // ── Sincronização de Configurações Globais (Outdoor do Painel) ──
  const syncPlatformSettingsWithSupabase = useCallback(async (force = false) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (hasSyncedSettingsRef.current && !force) return;
    hasSyncedSettingsRef.current = true;

    try {
      const { data: rows, error } = await supabase
        .from("platform_settings")
        .select("*");

      if (!error && rows) {
        const billboardRow = rows.find((r: any) => r.key === "billboard_settings");
        if (billboardRow && billboardRow.value) {
          const normalized = normalizeBillboardSettings(billboardRow.value);
          setBillboardSettings(normalized);
          try {
            localStorage.setItem(STORAGE_KEYS.BILLBOARD_SETTINGS, JSON.stringify(normalized));
          } catch {}
        } else {
          const localBb = (() => {
            try {
              const raw = localStorage.getItem(STORAGE_KEYS.BILLBOARD_SETTINGS);
              return raw ? normalizeBillboardSettings(JSON.parse(raw)) : null;
            } catch {
              return null;
            }
          })();
          if (localBb) {
            await supabase.from("platform_settings").upsert({
              key: "billboard_settings",
              value: localBb,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn("[AffiliateStore] Aviso na sincronização de platform_settings:", err);
    }
  }, []);

  useEffect(() => {
    checkSupabaseSession();
    syncCreativesWithSupabase();
    syncMaterialsWithSupabase();
    syncLinksWithSupabase();
    syncPlatformSettingsWithSupabase();
  }, [
    checkSupabaseSession,
    syncCreativesWithSupabase,
    syncMaterialsWithSupabase,
    syncLinksWithSupabase,
    syncPlatformSettingsWithSupabase,
  ]);

  // ── Sincronização Forçada Total (Admin → Force Push local → Supabase) ────────
  const forceSyncAllData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Supabase não configurado. Configure as variáveis de ambiente primeiro.");
      return;
    }
    hasSyncedCreativesRef.current = false;
    hasSyncedMaterialsRef.current = false;
    hasSyncedLinksRef.current = false;
    hasSyncedSettingsRef.current = false;

    toast.info("Sincronizando dados com a nuvem...", { duration: 2000 });
    try {
      await Promise.all([
        syncCreativesWithSupabase(true),
        syncMaterialsWithSupabase(true),
        syncLinksWithSupabase(true),
        syncPlatformSettingsWithSupabase(true),
      ]);
      toast.success("✅ Todos os dados sincronizados! Afiliados já podem visualizar.", { duration: 5000 });
      console.log("[SYNC] ✅ Force sync completo executado pelo Admin.");
    } catch (err) {
      toast.error("Erro ao sincronizar. Verifique o console para detalhes.");
      console.error("[SYNC] Erro no force sync:", err);
    }
  }, [syncCreativesWithSupabase, syncMaterialsWithSupabase, syncLinksWithSupabase, syncPlatformSettingsWithSupabase]);

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
          // Checa se o usuário está suspenso antes de autorizar
          try {
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("status, role")
              .eq("id", data.user.id)
              .single();

            if (dbProfile && dbProfile.status === "suspended" && !isSuperAdmin(data.user.email) && dbProfile.role !== "admin") {
              toast.error("Sua conta de afiliado está temporariamente suspensa pelo administrador.");
              await supabase.auth.signOut();
              setAuthLoading(false);
              return false;
            }
          } catch {}

          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.AUTH, "true");
          await checkSupabaseSession();
          syncCreativesWithSupabase(true).catch(() => {});
          syncMaterialsWithSupabase(true).catch(() => {});
          syncLinksWithSupabase(true).catch(() => {});
          syncPlatformSettingsWithSupabase(true).catch(() => {});
          toast.success("Autenticado com sucesso!");
          setAuthLoading(false);
          return true;
        }
      }

      // Offline / Demo fallback
      // RBAC: a role é determinada EXCLUSIVAMENTE pelo e-mail —
      // nunca herdada de sessão anterior (prev.role). Isso elimina
      // o vetor de escalada de privilégio por contaminação de localStorage.
      const cleanEmail = (email || profile.email).toLowerCase();
      const existingMon = Object.values(affiliatesMonitoring).find(
        (m) => m.email?.toLowerCase() === cleanEmail
      );
      if (existingMon && existingMon.status === "suspended" && !isSuperAdmin(cleanEmail) && existingMon.role !== "admin") {
        toast.error("Sua conta de afiliado está temporariamente suspensa pelo administrador.");
        setAuthLoading(false);
        return false;
      }
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
          // Se o titular ainda não existe no Supabase Auth (banco recém-conectado),
          // permite fallback offline seguro. Para qualquer outro usuário, bloqueia.
          if (!isSuperAdmin(email.trim())) {
            toast.error(`Falha no login: ${error.message}`);
            setAuthLoading(false);
            return false;
          }
          // Titular → continua para o fallback offline abaixo
          console.warn("[AdminLogin] Conta titular ausente no Supabase Auth — usando fallback seguro.");
        } else if (data.user) {
          // Supabase autenticou com sucesso — verifica se tem role admin no banco
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          // Se perfil não existe ou role não é admin, verifica se é o titular pelo e-mail
          if (dbProfile?.role !== "admin" && !isSuperAdmin(data.user.email)) {
            await supabase.auth.signOut().catch(() => {});
            toast.error("Acesso negado: esta conta não possui permissões administrativas.");
            setAuthLoading(false);
            return false;
          }

          setIsAuthenticated(true);
          const adminProf: AffiliateProfile = {
            id: dbProfile?.affiliate_code || data.user.id.slice(0, 8),
            name: dbProfile?.name || data.user.email?.split("@")[0] || "Administrador",
            first: dbProfile?.first_name || dbProfile?.name?.split(" ")[0] || "Admin",
            email: data.user.email || "",
            level: "Administrador Geral",
            phone: dbProfile?.phone || "",
            instagram: dbProfile?.instagram || "",
            role: "admin",
          };
          setProfile(adminProf);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(adminProf));
          localStorage.setItem(STORAGE_KEYS.AUTH, "true");
          syncCreativesWithSupabase(true).catch(() => {});
          syncMaterialsWithSupabase(true).catch(() => {});
          syncLinksWithSupabase(true).catch(() => {});
          syncPlatformSettingsWithSupabase(true).catch(() => {});
          toast.success("Autenticado como Administrador!");
          setAuthLoading(false);
          return true;
        }
      }

      // Fallback offline seguro — exclusivo para o Titular (ymarssico)
      // Ativa quando: Supabase não configurado OU conta titular ainda não existe no Auth
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
          // Auto-provisionamento imediato do perfil no banco
          try {
            await supabase.from("profiles").upsert({
              id: authData.user.id,
              email: trimmedEmail,
              name: trimmedName,
              first_name: trimmedName.split(" ")[0] || "Admin",
              role: "admin",
              affiliate_code: `VLS-${authData.user.id.slice(0, 5).toUpperCase()}`,
              status: "active",
              level: "Administrador Geral",
            }, { onConflict: "id" });
          } catch { /* silencia falhas de upsert */ }

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
          const selfAffiliateCode = `VLS-${data.user.id.slice(0, 5).toUpperCase()}`;
          const rawName = name.trim();
          const first = rawName.split(" ")[0] || rawName;
          const userRole = isSuperAdmin(email) ? "admin" : "affiliate";

          // Auto-provisionamento imediato do perfil no banco
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: email.trim(),
              name: rawName,
              first_name: first,
              role: userRole,
              affiliate_code: selfAffiliateCode,
              status: "active",
              level: "Afiliado(a) Ouro",
            }, { onConflict: "id" });
          } catch (err) {
            console.warn("Aviso ao auto-provisionar perfil:", err);
          }

          // Registra na telemetria local
          const newProf: AffiliateProfile = {
            id: selfAffiliateCode,
            name: rawName,
            first,
            email: email.trim(),
            phone: "",
            instagram: "",
            level: "Afiliado(a) Ouro",
            role: userRole,
            status: "active",
          };
          recordAffiliateAccess(newProf);
          syncCreativesWithSupabase(true).catch(() => {});
          syncMaterialsWithSupabase(true).catch(() => {});
          syncLinksWithSupabase(true).catch(() => {});
          syncPlatformSettingsWithSupabase(true).catch(() => {});

          toast.success("Conta criada! Você já pode acessar a plataforma.");
          setAuthLoading(false);
          return true;
        }
      }

      // Offline / Demo fallback
      const cleanEmail = email.trim();
      const rawName = name.trim();
      const first = rawName.split(" ")[0] || rawName;
      const selfAffiliateCode = `VLS-${cleanEmail.slice(0, 5).toUpperCase()}`;
      const fallbackProf: AffiliateProfile = {
        id: selfAffiliateCode,
        name: rawName,
        first,
        email: cleanEmail,
        phone: "",
        instagram: "",
        level: "Afiliado(a) Ouro",
        role: isSuperAdmin(cleanEmail) ? "admin" : "affiliate",
        status: "active",
      };
      recordAffiliateAccess(fallbackProf);

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

  const completeOnboarding = async (data: {
    phone: string;
    trafficExperience: "yes" | "no";
    trafficInvestment?: string;
    trafficWillingness?: "yes" | "no";
    trafficBudget?: string;
  }): Promise<boolean> => {
    try {
      const cleanPhone = data.phone.trim();
      const updatedProf: AffiliateProfile = {
        ...profile,
        phone: cleanPhone,
        onboardingCompleted: true,
        trafficExperience: data.trafficExperience,
        trafficInvestment: data.trafficInvestment,
        trafficWillingness: data.trafficWillingness,
        trafficBudget: data.trafficBudget,
        onboardingAnswers: data,
      };

      setProfile(updatedProf);
      // Chave permanente no cache local do navegador para nunca reabrir o modal
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProf));
        localStorage.setItem(`vellessa_onboarding_done_${profile.email || "current"}`, "true");
      } catch {}
      recordAffiliateAccess(updatedProf);

      // Persiste no Supabase se disponível
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            try {
              localStorage.setItem(`vellessa_onboarding_done_${session.user.id}`, "true");
              localStorage.setItem(`vellessa_onboarding_done_${session.user.email || profile.email}`, "true");
            } catch {}

            // Tentativa 1: update completo com colunas de perfil de tráfego
            const { error: fullErr } = await supabase.from("profiles").update({
              phone: cleanPhone,
              traffic_experience: data.trafficExperience,
              traffic_investment: data.trafficInvestment || null,
              traffic_willingness: data.trafficWillingness || null,
              traffic_budget: data.trafficBudget || null,
              onboarding_completed: true,
              updated_at: new Date().toISOString(),
            }).eq("id", session.user.id);

            if (fullErr) {
              console.warn("[Onboarding] Aviso na sincronização completa:", fullErr.message);
              // Fallback de contingência: atualiza somente o telefone para garantir liberação do painel
              await supabase.from("profiles").update({
                phone: cleanPhone,
                updated_at: new Date().toISOString(),
              }).eq("id", session.user.id);
            }
          }
        } catch (dbErr) {
          console.warn("[Onboarding] Aviso ao sincronizar com Supabase profiles:", dbErr);
        }
      }

      toast.success("Perfil ativado com sucesso! Seja bem-vindo(a) à Vellessa.", { icon: "✨" });
      return true;
    } catch (err) {
      console.error("[Onboarding] Erro ao concluir onboarding:", err);
      toast.error("Ocorreu um erro ao salvar suas informações.");
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
    id?: string;
    title: string;
    type: "Feed" | "Stories" | "Reels" | "Copy";
    format: string;
    image?: string;
    text?: string;
    folderId?: string;
    fileUrl?: string;
    externalDownloadUrl?: string;
    fileType?: string;
    fileSize?: string;
    storageType?: "supabase" | "indexeddb" | "external";
    storagePath?: string;
  }) => {
    const newC: Creative = {
      id: data.id || `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: data.title,
      type: data.type,
      format: data.format,
      image: data.image || "",
      text: data.text,
      folderId: data.folderId,
      fileUrl: data.fileUrl,
      externalDownloadUrl: data.externalDownloadUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      storageType: data.storageType,
      storagePath: data.storagePath,
    };
    const updated = [newC, ...creativesList];
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("creatives").upsert({
          id: newC.id,
          title: newC.title,
          type: newC.type,
          format: newC.format,
          image: newC.image || null,
          text: newC.text || null,
          folder_id: newC.folderId || null,
          file_url: newC.fileUrl || null,
          external_download_url: newC.externalDownloadUrl || null,
          file_type: newC.fileType || null,
          file_size: newC.fileSize || null,
          storage_type: newC.storageType || "supabase",
          storage_path: newC.storagePath || null,
        });
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao sincronizar criação com Supabase:", err);
      }
    }

    toast.success("Criativo adicionado à biblioteca de afiliados!");
  };

  const createCreativesBatch = async (
    items: {
      id?: string;
      title: string;
      type: "Feed" | "Stories" | "Reels" | "Copy";
      format: string;
      image?: string;
      text?: string;
      folderId?: string;
      fileUrl?: string;
      externalDownloadUrl?: string;
      fileType?: string;
      fileSize?: string;
      storageType?: "supabase" | "indexeddb" | "external";
      storagePath?: string;
    }[]
  ) => {
    if (!items || items.length === 0) return;

    const newCreatives: Creative[] = items.map((item, idx) => ({
      id: item.id || `c-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      type: item.type,
      format: item.format,
      image: item.image || "",
      text: item.text,
      folderId: item.folderId,
      fileUrl: item.fileUrl,
      externalDownloadUrl: item.externalDownloadUrl,
      fileType: item.fileType,
      fileSize: item.fileSize,
      storageType: item.storageType,
      storagePath: item.storagePath,
    }));

    // 1. Atualização Funcional do Estado React (com Deduplicação Atômica por ID e URL de Nuvem)
    let finalAddedCreatives: Creative[] = [];
    setCreativesList((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const existingFolderUrls = new Set(
        prev
          .filter((p) => p.folderId && p.externalDownloadUrl)
          .map((p) => `${p.folderId}:::${p.externalDownloadUrl}`)
      );

      // Filtra itens já existentes para evitar duplicações/triplicações de upload
      finalAddedCreatives = newCreatives.filter((c) => {
        if (existingIds.has(c.id)) return false;
        if (c.folderId && c.externalDownloadUrl) {
          const key = `${c.folderId}:::${c.externalDownloadUrl}`;
          if (existingFolderUrls.has(key)) return false;
          existingFolderUrls.add(key);
        }
        return true;
      });

      const updated = [...finalAddedCreatives, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));
      } catch (err) {
        console.error("Erro ao salvar lote de criativos no localStorage:", err);
      }
      return updated;
    });

    // 2. Persistência em Lote no Supabase (chunks de 50 para evitar limites de payload)
    if (isSupabaseConfigured && supabase && finalAddedCreatives.length > 0) {
      try {
        // Assegura que todas as pastas de destino existam no Supabase antes de inserir as peças (evita FK violation)
        const referencedFolderIds = Array.from(new Set(finalAddedCreatives.map((c) => c.folderId).filter(Boolean))) as string[];
        if (referencedFolderIds.length > 0) {
          const allKnownFolders = (() => {
            try {
              const raw = localStorage.getItem(STORAGE_KEYS.CREATIVE_FOLDERS);
              return raw ? JSON.parse(raw) : creativeFoldersList;
            } catch {
              return creativeFoldersList;
            }
          })();
          const foldersToEnsure = allKnownFolders.filter((f: any) => referencedFolderIds.includes(f.id));
          for (const f of foldersToEnsure) {
            await supabase.from("creative_folders").upsert({
              id: f.id,
              name: f.name,
              description: f.description || null,
              color: f.color || "gold",
              cover_image: f.coverImage || null,
            }).catch(() => {});
          }
        }

        const rowsToInsert = finalAddedCreatives.map((c) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          format: c.format,
          image: c.image || null,
          text: c.text || null,
          folder_id: c.folderId || null,
          file_url: c.fileUrl || null,
          external_download_url: c.externalDownloadUrl || null,
          file_type: c.fileType || null,
          file_size: c.fileSize || null,
          storage_type: c.storageType || "supabase",
          storage_path: c.storagePath || null,
        }));

        const chunkSize = 50;
        for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
          const chunk = rowsToInsert.slice(i, i + chunkSize);
          await supabase.from("creatives").upsert(chunk);
        }
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao sincronizar lote com Supabase:", err);
      }
    }

    toast.success(`${newCreatives.length} criativos publicados com sucesso!`, { icon: "🎉" });
  };

  const updateCreative = async (
    id: string,
    data: {
      title?: string;
      type?: "Feed" | "Stories" | "Reels" | "Copy";
      format?: string;
      image?: string;
      text?: string;
      folderId?: string;
      fileUrl?: string;
      externalDownloadUrl?: string;
      fileType?: string;
      fileSize?: string;
      storageType?: "supabase" | "indexeddb" | "external";
      storagePath?: string;
    }
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

    if (isSupabaseConfigured && supabase) {
      try {
        const patch: any = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.type !== undefined) patch.type = data.type;
        if (data.format !== undefined) patch.format = data.format;
        if (data.image !== undefined) patch.image = data.image || null;
        if (data.text !== undefined) patch.text = data.text || null;
        if (data.folderId !== undefined) patch.folder_id = data.folderId || null;
        if (data.fileUrl !== undefined) patch.file_url = data.fileUrl || null;
        if (data.externalDownloadUrl !== undefined) patch.external_download_url = data.externalDownloadUrl || null;
        if (data.fileType !== undefined) patch.file_type = data.fileType || null;
        if (data.fileSize !== undefined) patch.file_size = data.fileSize || null;
        if (data.storageType !== undefined) patch.storage_type = data.storageType || null;
        if (data.storagePath !== undefined) patch.storage_path = data.storagePath || null;
        await supabase.from("creatives").update(patch).eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao sincronizar update com Supabase:", err);
      }
    }

    toast.success("Criativo atualizado com sucesso!");
  };

  const deleteCreative = async (id: string) => {
    const item = creativesList.find((c) => c.id === id);
    if (item) {
      deleteCreativeAssets(item).catch(() => {});
    }
    const updated = creativesList.filter((c) => c.id !== id);
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("creatives").delete().eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao deletar criativo no Supabase:", err);
      }
    }

    toast.success("Criativo removido.");
  };

  const moveCreativesToFolder = async (creativeIds: string[], targetFolderId?: string) => {
    const targetSet = new Set(creativeIds);
    const updated = creativesList.map((c) =>
      targetSet.has(c.id) ? { ...c, folderId: targetFolderId || undefined } : c
    );
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("creatives")
          .update({ folder_id: targetFolderId || null })
          .in("id", creativeIds);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao sincronizar mover criativos com Supabase:", err);
      }
    }

    toast.success(`${creativeIds.length} criativo(s) movido(s) com sucesso!`);
  };

  const deleteCreativesBatch = async (creativeIds: string[]) => {
    const targetSet = new Set(creativeIds);
    const toDelete = creativesList.filter((c) => targetSet.has(c.id));
    if (toDelete.length > 0) {
      deleteBatchCreativeAssets(toDelete).catch(() => {});
    }
    const updated = creativesList.filter((c) => !targetSet.has(c.id));
    setCreativesList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("creatives").delete().in("id", creativeIds);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao deletar criativos em lote no Supabase:", err);
      }
    }

    toast.success(`${creativeIds.length} criativo(s) excluído(s).`);
  };

  const createMaterial = async (data: {
    title: string;
    kind: string;
    size: string;
    file_url?: string;
    sourceType?: "upload" | "link";
    rawFileName?: string;
    mimeType?: string;
    rawFile?: Blob | File;
    files?: MaterialFileItem[];
    folderId?: string;
  }) => {
    const id = `mat-${Date.now()}`;
    let cloudFileUrl = data.file_url;
    
    // Salva arquivo único no IndexedDB (cache local) e envia para o Supabase Storage (CDN global)
    if (data.rawFile) {
      try {
        await storeRawFile(id, data.rawFile);
        const uploadedUrl = await uploadMaterialToSupabase(id, data.rawFile, data.rawFileName);
        if (uploadedUrl) {
          cloudFileUrl = uploadedUrl;
        }
      } catch (err) {
        console.error("Erro ao salvar arquivo bruto:", err);
      }
    }

    // Salva múltiplos arquivos do pacote no IndexedDB e Supabase Storage
    let sanitizedFiles: MaterialFileItem[] | undefined = undefined;
    if (data.files && data.files.length > 0) {
      sanitizedFiles = [];
      for (const f of data.files) {
        let fUrl = f.file_url;
        if (f.rawFile) {
          try {
            await storeRawFile(f.id, f.rawFile);
            const uploadedUrl = await uploadMaterialToSupabase(f.id, f.rawFile, f.name);
            if (uploadedUrl) {
              fUrl = uploadedUrl;
            }
          } catch (err) {
            console.error("Erro ao salvar arquivo do pacote:", err);
          }
        }
        const { rawFile, ...fileMeta } = f;
        sanitizedFiles.push({
          ...fileMeta,
          file_url: fUrl,
        });
      }
    }

    const newM: DynamicMaterial = {
      id,
      title: data.title,
      kind: data.kind.toUpperCase(),
      size: data.size,
      file_url: cloudFileUrl,
      sourceType: data.sourceType || (data.rawFile || (sanitizedFiles && sanitizedFiles.length > 0) ? "upload" : "link"),
      rawFileName: data.rawFileName,
      mimeType: data.mimeType,
      files: sanitizedFiles,
      folderId: data.folderId,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("materials").upsert({
          id: newM.id,
          title: newM.title,
          kind: newM.kind,
          size: newM.size,
          file_url: newM.file_url || null,
          raw_file_name: newM.rawFileName || null,
          source_type: newM.sourceType || "link",
          mime_type: newM.mimeType || null,
          folder_id: newM.folderId || null,
          files: newM.files || null,
          order_index: materialsList.length,
        });
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao persistir material no Supabase:", err);
      }
    }

    const updated = [...materialsList, newM];
    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material oficial publicado!");
  };

  const updateMaterial = async (
    id: string,
    data: {
      title?: string;
      kind?: string;
      size?: string;
      file_url?: string;
      sourceType?: "upload" | "link";
      rawFileName?: string;
      mimeType?: string;
      rawFile?: Blob | File;
      files?: MaterialFileItem[];
      folderId?: string;
    }
  ) => {
    let cloudFileUrl = data.file_url;
    if (data.rawFile) {
      try {
        await storeRawFile(id, data.rawFile);
        const uploadedUrl = await uploadMaterialToSupabase(id, data.rawFile, data.rawFileName);
        if (uploadedUrl) {
          cloudFileUrl = uploadedUrl;
        }
      } catch (err) {
        console.error("Erro ao atualizar arquivo bruto:", err);
      }
    }

    // Salva ou atualiza múltiplos arquivos no IndexedDB e Supabase Storage
    let sanitizedFiles: MaterialFileItem[] | undefined = undefined;
    if (data.files && data.files.length > 0) {
      sanitizedFiles = [];
      for (const f of data.files) {
        let fUrl = f.file_url;
        if (f.rawFile) {
          try {
            await storeRawFile(f.id, f.rawFile);
            const uploadedUrl = await uploadMaterialToSupabase(f.id, f.rawFile, f.name);
            if (uploadedUrl) {
              fUrl = uploadedUrl;
            }
          } catch (err) {
            console.error("Erro ao salvar arquivo do pacote:", err);
          }
        }
        const { rawFile, ...fileMeta } = f;
        sanitizedFiles.push({
          ...fileMeta,
          file_url: fUrl,
        });
      }
    }

    const updated = materialsList.map((m) => {
      if ((m.id || m.title) !== id) return m;
      const { rawFile, ...rest } = data;
      return {
        ...m,
        ...rest,
        file_url: cloudFileUrl !== undefined ? cloudFileUrl : m.file_url,
        kind: rest.kind ? rest.kind.toUpperCase() : m.kind,
        files: sanitizedFiles !== undefined ? sanitizedFiles : m.files,
        folderId: "folderId" in rest ? rest.folderId : m.folderId,
      };
    });

    const targetMaterial = updated.find((m) => (m.id || m.title) === id);
    if (targetMaterial && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("materials").upsert({
          id: targetMaterial.id || id,
          title: targetMaterial.title,
          kind: targetMaterial.kind,
          size: targetMaterial.size,
          file_url: targetMaterial.file_url || null,
          raw_file_name: targetMaterial.rawFileName || null,
          source_type: targetMaterial.sourceType || "link",
          mime_type: targetMaterial.mimeType || null,
          folder_id: targetMaterial.folderId || null,
          files: targetMaterial.files || null,
        });
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao atualizar material no Supabase:", err);
      }
    }

    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material atualizado com sucesso!");
  };

  const deleteMaterial = async (id: string) => {
    const matToDelete = materialsList.find((m) => (m.id || m.title) === id);
    try {
      const idsToDelete = [id];
      if (matToDelete?.files) {
        matToDelete.files.forEach((f) => idsToDelete.push(f.id));
      }
      await deleteRawFiles(idsToDelete);
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("materials").delete().eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao remover material no Supabase:", err);
      }
    }

    const updated = materialsList.filter((m) => (m.id || m.title) !== id);
    setMaterialsList(updated);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updated));
    toast.success("Material removido.");
  };

  // ── FOLDERS CRUD ───────────────────────────────────────────────────────────
  const createFolder = async (data: { name: string; description?: string; color?: string; icon?: string }) => {
    const newFolder: MaterialFolder = {
      id: `folder-${Date.now()}`,
      name: data.name.trim(),
      description: data.description?.trim(),
      color: data.color || "gold",
      icon: data.icon || "Folder",
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("material_folders").upsert({
          id: newFolder.id,
          name: newFolder.name,
          description: newFolder.description || null,
          color: newFolder.color || "gold",
          order_index: foldersList.length,
        });
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao criar pasta no Supabase:", err);
      }
    }

    const updated = [...foldersList, newFolder];
    setFoldersList(updated);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updated));
    toast.success(`Pasta "${newFolder.name}" criada!`);
  };

  const updateFolder = async (id: string, data: { name?: string; description?: string; color?: string; icon?: string }) => {
    const updated = foldersList.map((f) => {
      if (f.id !== id) return f;
      return {
        ...f,
        name: data.name?.trim() ?? f.name,
        description: data.description?.trim() ?? f.description,
        color: data.color ?? f.color,
        icon: data.icon ?? f.icon,
      };
    });

    const targetFolder = updated.find((f) => f.id === id);
    if (targetFolder && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("material_folders").update({
          name: targetFolder.name,
          description: targetFolder.description || null,
          color: targetFolder.color || "gold",
        }).eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao atualizar pasta no Supabase:", err);
      }
    }

    setFoldersList(updated);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updated));
    toast.success("Pasta atualizada!");
  };

  const deleteFolder = async (id: string) => {
    // Disassociate materials from this folder
    const updatedMaterials = materialsList.map((m) =>
      m.folderId === id ? { ...m, folderId: undefined } : m
    );
    setMaterialsList(updatedMaterials);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(updatedMaterials));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("materials").update({ folder_id: null }).eq("folder_id", id);
        await supabase.from("material_folders").delete().eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao excluir pasta no Supabase:", err);
      }
    }

    const updated = foldersList.filter((f) => f.id !== id);
    setFoldersList(updated);
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updated));
    toast.success("Pasta removida. Os materiais foram movidos para Geral.");
  };

  const createCreativeFolder = async (data: { name: string; description?: string; color?: string; icon?: string; coverImage?: string; driveUrl?: string }): Promise<string> => {
    const newFolder: CreativeFolder = {
      id: `cfolder-${Date.now()}`,
      name: data.name.trim(),
      description: data.description?.trim(),
      color: data.color || "gold",
      icon: data.icon || "Folder",
      coverImage: data.coverImage?.trim(),
      driveUrl: data.driveUrl?.trim(),
      createdAt: new Date().toISOString(),
    };

    let updatedFolders: CreativeFolder[] = [];
    setCreativeFoldersList((prev) => {
      if (prev.some((f) => f.id === newFolder.id)) return prev;
      updatedFolders = [...prev, newFolder];
      try {
        localStorage.setItem(STORAGE_KEYS.CREATIVE_FOLDERS, JSON.stringify(updatedFolders));
      } catch (storageErr) {
        console.warn("[AffiliateStore] Cota de localStorage excedida no grupo, salvando versão segura:", storageErr);
        try {
          const safeFolders = updatedFolders.map((f) => ({
            ...f,
            coverImage: f.coverImage?.startsWith("data:") ? undefined : f.coverImage,
          }));
          localStorage.setItem(STORAGE_KEYS.CREATIVE_FOLDERS, JSON.stringify(safeFolders));
        } catch {}
      }
      return updatedFolders;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("creative_folders").upsert({
          id: newFolder.id,
          name: newFolder.name,
          description: newFolder.description || null,
          color: newFolder.color || "gold",
          cover_image: newFolder.coverImage || null,
        });
        if (error) {
          console.warn("[AffiliateStore] Erro ao sincronizar grupo com Supabase:", error.message);
        }
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao sincronizar grupo com Supabase:", err);
      }
    }

    toast.success(`Grupo "${newFolder.name}" criado com sucesso!`);
    return newFolder.id;
  };

  const updateCreativeFolder = async (id: string, data: { name?: string; description?: string; color?: string; icon?: string; coverImage?: string; driveUrl?: string }) => {
    setCreativeFoldersList((prev) => {
      const updated = prev.map((f) => {
        if (f.id !== id) return f;
        return {
          ...f,
          name: data.name?.trim() ?? f.name,
          description: data.description?.trim() ?? f.description,
          color: data.color ?? f.color,
          icon: data.icon ?? f.icon,
          coverImage: data.coverImage !== undefined ? data.coverImage?.trim() : f.coverImage,
          driveUrl: data.driveUrl !== undefined ? data.driveUrl?.trim() : f.driveUrl,
        };
      });
      try {
        localStorage.setItem(STORAGE_KEYS.CREATIVE_FOLDERS, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const patch: any = {};
        if (data.name !== undefined) patch.name = data.name.trim();
        if (data.description !== undefined) patch.description = data.description.trim() || null;
        if (data.color !== undefined) patch.color = data.color;
        if (data.coverImage !== undefined) patch.cover_image = data.coverImage.trim() || null;
        await supabase.from("creative_folders").update(patch).eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao atualizar grupo no Supabase:", err);
      }
    }

    toast.success("Grupo atualizado!");
  };

  const deleteCreativeFolder = async (id: string) => {
    // Desvincula criativos desta pasta (move para a raiz)
    const updatedCreatives = creativesList.map((c) =>
      c.folderId === id ? { ...c, folderId: undefined } : c
    );
    setCreativesList(updatedCreatives);
    localStorage.setItem(STORAGE_KEYS.CREATIVES, JSON.stringify(updatedCreatives));

    const updated = creativeFoldersList.filter((f) => f.id !== id);
    setCreativeFoldersList(updated);
    localStorage.setItem(STORAGE_KEYS.CREATIVE_FOLDERS, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("creatives").update({ folder_id: null }).eq("folder_id", id);
        await supabase.from("creative_folders").delete().eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao excluir grupo no Supabase:", err);
      }
    }

    toast.success("Pasta removida. Os criativos foram movidos para a raiz.");
  };

  const createAffiliateLink = async (data: { label: string; url: string; note: string }) => {
    const newL: DynamicLink = {
      id: `link-${Date.now()}`,
      label: data.label,
      url: data.url,
      note: data.note,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("affiliate_links").upsert({
          id: newL.id,
          label: newL.label,
          url: newL.url,
          note: newL.note,
          order_index: linksList.length,
        });
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao criar link no Supabase:", err);
      }
    }

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

    const targetLink = updated.find((l) => (l.id || l.url) === id);
    if (targetLink && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("affiliate_links").update({
          label: targetLink.label,
          url: targetLink.url,
          note: targetLink.note,
        }).eq("id", targetLink.id || id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao atualizar link no Supabase:", err);
      }
    }

    setLinksList(updated);
    localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(updated));
    toast.success("Link atualizado com sucesso!");
  };

  const deleteAffiliateLink = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("affiliate_links").delete().eq("id", id);
      } catch (err) {
        console.warn("[AffiliateStore] Falha ao excluir link no Supabase:", err);
      }
    }

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

  // 6.6. Billboard / Outdoor Promocional do Painel (Admin Control)
  const [billboardSettings, setBillboardSettings] = useState<BillboardSettings>(() => {
    if (typeof window === "undefined") return DEFAULT_BILLBOARD_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLBOARD_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return normalizeBillboardSettings(parsed);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BILLBOARD_SETTINGS;
  });

  const updateBillboardSettings = useCallback((settings: Partial<BillboardSettings>) => {
    setBillboardSettings((prev) => {
      const rawNext = { ...prev, ...settings };
      const next = normalizeBillboardSettings(rawNext);
      try {
        localStorage.setItem(STORAGE_KEYS.BILLBOARD_SETTINGS, JSON.stringify(next));
      } catch {}
      if (isSupabaseConfigured && supabase) {
        supabase.from("platform_settings").upsert({
          key: "billboard_settings",
          value: next,
          updated_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }
      toast.success("Outdoors do painel atualizados com sucesso!");
      return next;
    });
  }, []);

  const resetBillboardSettings = useCallback(() => {
    setBillboardSettings(DEFAULT_BILLBOARD_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEYS.BILLBOARD_SETTINGS, JSON.stringify(DEFAULT_BILLBOARD_SETTINGS));
    } catch {}
    if (isSupabaseConfigured && supabase) {
      supabase.from("platform_settings").upsert({
        key: "billboard_settings",
        value: DEFAULT_BILLBOARD_SETTINGS,
        updated_at: new Date().toISOString(),
      }).then(() => {}).catch(() => {});
    }
    toast.info("Outdoors restaurados para o padrão de luxo.");
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
      author: profile.name || "Afiliado",
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
    toast.success("Aviso oficial publicado para todos os afiliados!");
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

  const contextValue = useMemo<AffiliateStoreContextType>(
    () => ({
      profile,
      isAdmin,
      isTitular,
      updateProfile,
      forceSyncAllData,
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
      recordAffiliateAccess,
      updateAffiliateMonitoring,
      deleteAffiliateMonitoring,
      campaignsList,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      recordCampaignMetric,
      creativesList,
      materialsList,
      linksList,
      foldersList,
      creativeFoldersList,
      createFolder,
      updateFolder,
      deleteFolder,
      createCreativeFolder,
      updateCreativeFolder,
      deleteCreativeFolder,
      moveCreativesToFolder,
      deleteCreativesBatch,
      createModule,
      updateModule,
      deleteModule,
      createLesson,
      updateLesson,
      deleteLesson,
      createCreative,
      createCreativesBatch,
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
      completeOnboarding,
      logout,
      resetPassword,
      copyText,
      downloadAsset,
      featureSettings,
      toggleFeature,
      updateFeatureSettings,
      billboardSettings,
      updateBillboardSettings,
      resetBillboardSettings,
    }),
    [
      profile,
      isAdmin,
      isTitular,
      modulesList,
      allLessonsList,
      completedLessonIds,
      completedCount,
      totalLessonsCount,
      progressPercentage,
      nextLesson,
      affiliatesMonitoring,
      campaignsList,
      creativesList,
      materialsList,
      linksList,
      foldersList,
      creativeFoldersList,
      posts,
      announcements,
      unreadAnnouncementsCount,
      isAuthenticated,
      authLoading,
      featureSettings,
      billboardSettings,
    ]
  );

  return (
    <AffiliateStoreContext.Provider value={contextValue}>
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

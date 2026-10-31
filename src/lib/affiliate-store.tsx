import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { affiliate as initialAffiliate, allLessons, announcements as initialAnnouncements, posts as initialPosts, type Lesson, type Module } from "@/data/content";

export interface AffiliateProfile {
  name: string;
  first: string;
  level: string;
  email: string;
  id: string;
  phone: string;
  instagram: string;
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

export interface AnnouncementItem {
  id: string;
  pinned?: boolean;
  author: string;
  time: string;
  title: string;
  body: string;
  read?: boolean;
}

interface AffiliateStoreContextType {
  profile: AffiliateProfile;
  updateProfile: (updated: Partial<AffiliateProfile>) => void;
  
  // Lesson state
  completedLessonIds: string[];
  isLessonDone: (id: string) => boolean;
  toggleLessonDone: (id: string) => void;
  markLessonDone: (id: string) => void;
  completedCount: number;
  totalLessonsCount: number;
  progressPercentage: number;
  nextLesson: (Lesson & { module: Module }) | null;
  
  // Community state
  posts: CommunityPost[];
  addPost: (body: string) => void;
  toggleLikePost: (postId: string) => void;
  
  // Notifications state
  announcements: AnnouncementItem[];
  unreadAnnouncementsCount: number;
  markAllNotificationsRead: () => void;
  
  // Auth state
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  
  // Utilities
  copyText: (text: string, successLabel?: string) => Promise<boolean>;
  downloadAsset: (url: string, filename: string) => void;
}

const STORAGE_KEYS = {
  PROFILE: "vellessa_affiliate_profile",
  COMPLETED_LESSONS: "vellessa_completed_lessons",
  POSTS: "vellessa_community_posts",
  READ_ANNOUNCEMENTS: "vellessa_read_announcements",
  AUTH: "vellessa_auth_state",
};

const AffiliateStoreContext = createContext<AffiliateStoreContextType | null>(null);

export function AffiliateStoreProvider({ children }: { children: React.ReactNode }) {
  // 1. Profile State
  const [profile, setProfile] = useState<AffiliateProfile>(() => {
    if (typeof window === "undefined") {
      return {
        ...initialAffiliate,
        phone: "(11) 98765-4321",
        instagram: "@mari.beauty",
      };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading profile from localStorage", e);
    }
    return {
      ...initialAffiliate,
      phone: "(11) 98765-4321",
      instagram: "@mari.beauty",
    };
  });

  const updateProfile = (updated: Partial<AffiliateProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving profile", e);
      }
      return next;
    });
    toast.success("Perfil atualizado com sucesso!");
  };

  // 2. Completed Lessons State
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return allLessons.filter((l) => l.done).map((l) => l.id);
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading completed lessons", e);
    }
    return allLessons.filter((l) => l.done).map((l) => l.id);
  });

  const isLessonDone = (id: string) => completedLessonIds.includes(id);

  const toggleLessonDone = (id: string) => {
    setCompletedLessonIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving completed lessons", e);
      }
      return next;
    });
  };

  const markLessonDone = (id: string) => {
    setCompletedLessonIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving completed lessons", e);
      }
      return next;
    });
  };

  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercentage = Math.round((completedCount / totalLessonsCount) * 100);

  // Next pending lesson with safe fallback
  const nextLesson = useMemo(() => {
    const pending = allLessons.find((l) => !completedLessonIds.includes(l.id));
    return pending ?? allLessons[0] ?? null;
  }, [completedLessonIds]);

  // 3. Community Posts
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    if (typeof window === "undefined") return initialPosts;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading posts", e);
    }
    return initialPosts;
  });

  const addPost = (body: string) => {
    if (!body.trim()) {
      toast.error("Por favor, digite uma mensagem antes de publicar.");
      return;
    }
    const newPost: CommunityPost = {
      id: `p-${Date.now()}`,
      author: profile.name,
      initials: profile.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "MC",
      time: "agora",
      body: body.trim(),
      likes: 0,
      replies: 0,
      userLiked: false,
    };
    setPosts((prev) => {
      const next = [newPost, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
      } catch (e) {
        console.error("Error saving posts", e);
      }
      return next;
    });
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
      try {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(next));
      } catch (e) {
        console.error("Error updating likes", e);
      }
      return next;
    });
  };

  // 4. Announcements & Notifications
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_ANNOUNCEMENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading notifications", e);
    }
    return [];
  });

  const announcements = useMemo(() => {
    return initialAnnouncements.map((a) => ({
      ...a,
      read: readAnnouncementIds.includes(a.id),
    }));
  }, [readAnnouncementIds]);

  const unreadAnnouncementsCount = announcements.filter((a) => !a.read).length;

  const markAllNotificationsRead = () => {
    const allIds = initialAnnouncements.map((a) => a.id);
    setReadAnnouncementIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEYS.READ_ANNOUNCEMENTS, JSON.stringify(allIds));
    } catch (e) {
      console.error("Error saving notifications", e);
    }
    toast.success("Todas as notificações foram marcadas como lidas.");
  };

  // 5. Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const login = (email: string) => {
    setIsAuthenticated(true);
    setProfile((prev) => ({ ...prev, email: email || prev.email }));
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
    } catch (e) {
      console.error("Error persisting auth", e);
    }
    toast.success("Acesso autenticado com sucesso!");
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, "false");
    } catch (e) {
      console.error("Error persisting auth", e);
    }
    toast.info("Você saiu da plataforma.");
  };

  // 6. Safe Clipboard Copy
  const copyText = async (text: string, successLabel: string = "Copiado com sucesso!"): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(successLabel);
        return true;
      }
      // Fallback using textarea
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
      throw new Error("Copy command not supported");
    } catch (err) {
      console.error("Falha ao copiar:", err);
      toast.error("Não foi possível copiar automaticamente. Selecione e copie o texto manualmente.");
      return false;
    }
  };

  // 7. Real Asset Download Helper
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
      toast.success(`Download de "${filename}" preparado!`);
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Erro ao iniciar download.");
    }
  };

  return (
    <AffiliateStoreContext.Provider
      value={{
        profile,
        updateProfile,
        completedLessonIds,
        isLessonDone,
        toggleLessonDone,
        markLessonDone,
        completedCount,
        totalLessonsCount,
        progressPercentage,
        nextLesson,
        posts,
        addPost,
        toggleLikePost,
        announcements,
        unreadAnnouncementsCount,
        markAllNotificationsRead,
        isAuthenticated,
        login,
        logout,
        copyText,
        downloadAsset,
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

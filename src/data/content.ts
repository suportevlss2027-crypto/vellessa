import serum from "@/assets/vellessa-serum.jpg";
import serumFloating from "@/assets/vellessa-serum-floating.jpg";
import cover1 from "@/assets/cover-1.jpg";
import cover2 from "@/assets/cover-2.jpg";
import cover3 from "@/assets/cover-3.jpg";

export const images = { serum, serumFloating, cover1, cover2, cover3 };

export const affiliate = {
  name: "",
  first: "Afiliada",
  level: "Afiliada Oficial",
  email: "",
  id: "",
};

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  done?: boolean;
  video_url?: string;
  description?: string;
};

export type Module = {
  id: string;
  title: string;
  subtitle: string;
  cover: string;
  lessons: Lesson[];
};

export const modules: Module[] = [];
export const allLessons: (Lesson & { module: Module })[] = [];
export const totalLessons = 0;
export const doneLessons = 0;

export type Creative = {
  id: string;
  title: string;
  type: "Feed" | "Stories" | "Reels" | "Copy";
  image?: string;
  text?: string;
  format: string;
};

export const creatives: Creative[] = [];

export interface ContentLink {
  label: string;
  url: string;
  note: string;
}

export const links: ContentLink[] = [];

export interface ContentMaterial {
  title: string;
  kind: string;
  size: string;
}

export const materials: ContentMaterial[] = [];

export interface ContentAnnouncement {
  id: string;
  pinned?: boolean;
  author: string;
  time: string;
  title: string;
  body: string;
}

export const announcements: ContentAnnouncement[] = [];

export interface ContentPost {
  id: string;
  author: string;
  initials: string;
  time: string;
  body: string;
  likes: number;
  replies: number;
}

export const posts: ContentPost[] = [];

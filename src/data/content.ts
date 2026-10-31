import serum from "@/assets/vellessa-serum.jpg";
import cover1 from "@/assets/cover-1.jpg";
import cover2 from "@/assets/cover-2.jpg";
import cover3 from "@/assets/cover-3.jpg";

export const images = { serum, cover1, cover2, cover3 };

export const affiliate = {
  name: "Mariana Costa",
  first: "Mariana",
  level: "Afiliada Ouro",
  email: "mariana@email.com",
  id: "VLS-20481",
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

export const modules: Module[] = [
  {
    id: "boas-vindas",
    title: "Boas-vindas à Vellessa",
    subtitle: "Conheça a marca, o produto e como funciona o programa",
    cover: cover1,
    lessons: [
      { id: "l1", title: "Nossa história e propósito", duration: "6:12", done: true },
      { id: "l2", title: "Como funciona a comissão", duration: "8:40", done: true },
      { id: "l3", title: "Primeiros passos na plataforma", duration: "5:05", done: true },
    ],
  },
  {
    id: "produto",
    title: "Dominando o Sérum",
    subtitle: "Ativos, benefícios e como apresentar com autoridade",
    cover: cover2,
    lessons: [
      { id: "l4", title: "Ácido hialurônico explicado", duration: "9:20", done: true },
      { id: "l5", title: "Rosa mosqueta e extrato de romã", duration: "7:48" },
      { id: "l6", title: "Respondendo objeções comuns", duration: "11:02" },
      { id: "l7", title: "Antes e depois: como usar provas", duration: "6:30" },
    ],
  },
  {
    id: "anuncios",
    title: "Anúncios que Vendem",
    subtitle: "Meta Ads, TikTok e criativos de alta conversão",
    cover: cover3,
    lessons: [
      { id: "l8", title: "Estrutura de campanha vencedora", duration: "14:10" },
      { id: "l9", title: "Público e segmentação", duration: "10:45" },
      { id: "l10", title: "Escalando com segurança", duration: "12:30" },
    ],
  },
  {
    id: "organico",
    title: "Vendas no Orgânico",
    subtitle: "Instagram, Reels e conteúdo que gera desejo",
    cover: serum,
    lessons: [
      { id: "l11", title: "Perfil que converte", duration: "8:00" },
      { id: "l12", title: "Roteiros de Reels prontos", duration: "9:15" },
    ],
  },
];

export const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m })));
export const totalLessons = allLessons.length;
export const doneLessons = allLessons.filter((l) => l.done).length;

export type Creative = {
  id: string;
  title: string;
  type: "Feed" | "Stories" | "Reels" | "Copy";
  image?: string;
  text?: string;
  format: string;
};

export const creatives: Creative[] = [
  { id: "c1", title: "Ritual dourado", type: "Feed", image: cover2, format: "1080×1080" },
  { id: "c2", title: "Pele radiante", type: "Stories", image: cover3, format: "1080×1920" },
  { id: "c3", title: "Toque aveludado", type: "Feed", image: cover1, format: "1080×1350" },
  { id: "c4", title: "Kit trio Vellessa", type: "Feed", image: serum, format: "1080×1080" },
  { id: "c5", title: "Aplicação em 15s", type: "Reels", image: cover3, format: "Vídeo 0:15" },
  { id: "c6", title: "Unboxing premium", type: "Reels", image: cover2, format: "Vídeo 0:30" },
  {
    id: "c7",
    title: "Copy — Hidratação imediata",
    type: "Copy",
    format: "Texto",
    text: "Sua pele merece um ritual de luxo. ✨ O Sérum Vellessa entrega hidratação imediata com toque aveludado — ácido hialurônico, rosa mosqueta e extrato de romã em cada gota. Garanta o seu com desconto exclusivo pelo link.",
  },
  {
    id: "c8",
    title: "Copy — Prova social",
    type: "Copy",
    format: "Texto",
    text: "Mais de 12 mil mulheres já trocaram 5 produtos por 1. O Sérum Vellessa virou o segredo de quem quer pele luminosa sem complicação. Experimente com garantia de 30 dias.",
  },
  { id: "c9", title: "Antes e depois", type: "Stories", image: cover1, format: "1080×1920" },
];

export const links = [
  { label: "Seu link de afiliada", url: "https://vellessa.com/?ref=VLS-20481", note: "Página principal com seu código" },
  { label: "Oferta Kit 3 frascos", url: "https://vellessa.com/kit3?ref=VLS-20481", note: "Maior ticket — melhor comissão" },
  { label: "Página de vídeo (VSL)", url: "https://vellessa.com/vsl?ref=VLS-20481", note: "Ideal para tráfego frio" },
];

export const materials = [
  { title: "Guia completo do afiliado", kind: "PDF", size: "4,2 MB" },
  { title: "Manual de marca Vellessa", kind: "PDF", size: "8,9 MB" },
  { title: "Fotos oficiais do produto", kind: "ZIP", size: "126 MB" },
  { title: "Banco de 50 copys", kind: "DOC", size: "320 KB" },
  { title: "Roteiros de Reels e TikTok", kind: "PDF", size: "1,8 MB" },
  { title: "Respostas para objeções", kind: "PDF", size: "900 KB" },
];

export const announcements = [
  { id: "a1", pinned: true, author: "Equipe Vellessa", time: "Hoje", title: "Nova comissão de 60% no Kit 3 frascos", body: "A partir desta semana, todas as vendas do Kit 3 frascos pagam 60% de comissão. Os novos links já estão em Materiais." },
  { id: "a2", pinned: true, author: "Equipe Vellessa", time: "Ontem", title: "Criativos de Black Friday liberados", body: "Preparamos 24 peças exclusivas para a campanha. Acesse a aba Criativos e filtre por Stories." },
  { id: "a3", author: "Equipe Vellessa", time: "3 dias", title: "Live de estratégia — quinta, 20h", body: "Vamos analisar campanhas reais de afiliadas que faturaram mais de R$ 50 mil no mês." },
];

export const posts = [
  { id: "p1", author: "Juliana R.", initials: "JR", time: "2h", body: "Bati minha primeira venda de Kit 3 hoje usando o criativo 'Ritual dourado'! Obrigada pela aula de público 💛", likes: 34, replies: 8 },
  { id: "p2", author: "Camila S.", initials: "CS", time: "5h", body: "Alguém testou o roteiro de Reels 3? Estou com ótimo alcance mas poucos cliques no link.", likes: 12, replies: 15 },
  { id: "p3", author: "Fernanda L.", initials: "FL", time: "1d", body: "Dica: postar o antes e depois às 21h dobrou meu engajamento nos stories.", likes: 58, replies: 11 },
];

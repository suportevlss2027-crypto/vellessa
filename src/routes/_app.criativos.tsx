import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Folder,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { type Creative } from "@/data/content";
import { EmptyState } from "@/components/EmptyState";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";
import { resolveCreativeDownload } from "@/lib/creative-storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/criativos")({
  head: () => ({
    meta: [
      { title: "Criativos — Vellessa Afiliados" },
      { name: "description", content: "Criativos e copys prontos para anúncios do Sérum Vellessa." },
      { property: "og:title", content: "Criativos — Vellessa Afiliados" },
      { property: "og:description", content: "Criativos e copys prontos para anúncios." },
    ],
  }),
  component: Criativos,
});

const filters = ["Todos", "Feed", "Stories", "Reels", "Copy"] as const;

const COLOR_GRADIENT: Record<string, string> = {
  gold:    "from-amber-950/80 via-zinc-900/60 to-black/80",
  emerald: "from-emerald-950/80 via-zinc-900/60 to-black/80",
  rose:    "from-rose-950/80 via-zinc-900/60 to-black/80",
  violet:  "from-purple-950/80 via-zinc-900/60 to-black/80",
  sky:     "from-sky-950/80 via-zinc-900/60 to-black/80",
  amber:   "from-amber-900/80 via-zinc-900/60 to-black/80",
};

const COLOR_BORDER: Record<string, string> = {
  gold:    "border-gold/40 hover:border-gold/70",
  emerald: "border-emerald-500/40 hover:border-emerald-500/70",
  rose:    "border-rose-500/40 hover:border-rose-500/70",
  violet:  "border-violet-500/40 hover:border-violet-500/70",
  sky:     "border-sky-500/40 hover:border-sky-500/70",
  amber:   "border-amber-500/40 hover:border-amber-500/70",
};

const COLOR_TEXT: Record<string, string> = {
  gold:    "text-gold",
  emerald: "text-emerald-400",
  rose:    "text-rose-400",
  violet:  "text-violet-400",
  sky:     "text-sky-400",
  amber:   "text-amber-400",
};

function getCreativeCopy(creative: Creative): string {
  return creative.text || "Copie este texto ou utilize os materiais oficiais para a sua campanha.";
}

function Criativos() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [open, setOpen] = useState<Creative | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [isResolvingVideo, setIsResolvingVideo] = useState(false);
  const { copyText, downloadAsset, creativesList, creativeFoldersList } =
    useAffiliateStore();

  // Reinicia paginação ao trocar de pasta ou filtro
  useEffect(() => {
    setVisibleCount(24);
  }, [currentFolderId, filter]);

  // Scroll lock ao abrir preview
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Carrega e resolve a prévia de vídeo quando o modal abre
  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;

    if (!open) {
      setPreviewVideoUrl(null);
      setIsResolvingVideo(false);
      return;
    }

    const isVideo =
      open.type === "Reels" ||
      open.fileType?.startsWith("video/") ||
      (open.fileUrl && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(open.fileUrl)) ||
      (open.title && /\.(mp4|webm|mov|m4v)$/i.test(open.title));

    if (isVideo) {
      setIsResolvingVideo(true);
      resolveCreativeDownload(open)
        .then((res) => {
          if (!active) {
            if (res?.isBlobUrl && res.url) URL.revokeObjectURL(res.url);
            return;
          }
          // Garante que só define previewVideoUrl se de fato for uma URL de vídeo ou blob
          const isUrlVideo = res?.url && (res.isBlobUrl || res.isVideo || !res.url.startsWith("data:image/"));
          if (isUrlVideo && res?.url) {
            if (res.isBlobUrl) createdBlobUrl = res.url;
            setPreviewVideoUrl(res.url);
          } else if (open.fileUrl && !open.fileUrl.startsWith("indexeddb://")) {
            setPreviewVideoUrl(open.fileUrl);
          } else {
            setPreviewVideoUrl(null);
          }
        })
        .catch((err) => {
          console.warn("Erro ao resolver prévia de vídeo:", err);
          if (active) setPreviewVideoUrl(open.fileUrl && !open.fileUrl.startsWith("indexeddb://") ? open.fileUrl : null);
        })
        .finally(() => {
          if (active) setIsResolvingVideo(false);
        });
    } else {
      setPreviewVideoUrl(null);
      setIsResolvingVideo(false);
    }

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [open]);

  const currentFolder = useMemo(
    () => creativeFoldersList.find((f) => f.id === currentFolderId),
    [creativeFoldersList, currentFolderId]
  );

  // Contagem de peças por grupo (com fallback de criativos órfãos para a primeira pasta)
  const countByFolder = useMemo(() => {
    const map: Record<string, number> = {};
    const firstFolderId = creativeFoldersList[0]?.id;
    for (const c of creativesList) {
      const fId = c.folderId || firstFolderId;
      if (fId) {
        map[fId] = (map[fId] || 0) + 1;
      }
    }
    return map;
  }, [creativesList, creativeFoldersList]);

  // Criativos ativos de acordo com o grupo atual (sempre dentro de uma pasta)
  const activeCreatives = useMemo(() => {
    if (!currentFolderId) return [];
    const isFirstFolder = creativeFoldersList[0]?.id === currentFolderId;
    return creativesList.filter(
      (c) => c.folderId === currentFolderId || (isFirstFolder && !c.folderId)
    );
  }, [creativesList, currentFolderId, creativeFoldersList]);

  const visualItems = activeCreatives.filter((c) => c.type !== "Copy");
  const copyItems = activeCreatives.filter((c) => c.type === "Copy");

  const filteredVisualItems =
    filter === "Todos"
      ? visualItems
      : filter === "Copy"
      ? []
      : visualItems.filter((c) => c.type === filter);

  const displayedVisualItems = useMemo(
    () => filteredVisualItems.slice(0, visibleCount),
    [filteredVisualItems, visibleCount]
  );

  const filteredCopyItems =
    filter === "Todos" || filter === "Copy"
      ? copyItems
      : [];

  // Download: arquivo direto via Supabase CDN / IndexedDB blob ou fallback
  const handleDownload = async (c: Creative) => {
    try {
      const resolved = await resolveCreativeDownload(c);
      if (resolved) {
        const a = document.createElement("a");
        a.href = resolved.url;
        a.download = resolved.fileName;
        if (!resolved.isBlobUrl && (resolved.url.startsWith("http://") || resolved.url.startsWith("https://"))) {
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        }
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (resolved.isBlobUrl) {
          setTimeout(() => URL.revokeObjectURL(resolved.url), 10000);
        }
        return;
      }
    } catch (e) {
      console.warn("Erro ao resolver download:", e);
    }

    const isVideoCreative = c.type === "Vídeo" || (c.format && c.format.toLowerCase().includes("video"));
    if (isVideoCreative) {
      toast.error("O arquivo de vídeo deste criativo ainda está sendo sincronizado na nuvem pelo administrador.");
      return;
    }

    if (c.image) {
      downloadAsset(c.image, `${c.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`);
    } else if (c.text) {
      const blob = new Blob([c.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadAsset(url, `${c.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── CABEÇALHO DA BIBLIOTECA (TELA RAIZ) ─────────────────────────── */}
      {!currentFolderId && (
        <PageHeader
          eyebrow="Biblioteca Oficial"
          title="Criativos para Anúncios"
          description="Coleções de alta conversão aprovadas pela marca, organizadas por grupos para download e veiculação imediata."
        />
      )}

      {/* ── NAVEGAÇÃO & FILTROS DENTRO DE UM GRUPO ───────────────────────── */}
      {currentFolderId && currentFolder && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                setCurrentFolderId(null);
                setFilter("Todos");
              }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/60 text-muted-foreground transition hover:border-gold hover:text-gold cursor-pointer"
              title="Voltar para todas as coleções"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gold font-semibold">Coleção Oficial</span>
                <span className="text-[10px] text-muted-foreground/60">•</span>
                <span className="text-[10px] font-mono text-muted-foreground">{activeCreatives.length} {activeCreatives.length === 1 ? "peça disponível" : "peças disponíveis"}</span>
              </div>
              <h2 className="font-display text-lg font-bold text-foreground truncate">{currentFolder.name}</h2>
              {currentFolder.description && (
                <p className="text-xs text-muted-foreground truncate">{currentFolder.description}</p>
              )}
            </div>
          </div>

          {/* Filtros contextuais por formato */}
          <div className="flex gap-1 overflow-x-auto rounded-full border border-border/40 bg-card/60 p-1 backdrop-blur-sm shadow-xs shrink-0">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 cursor-pointer",
                  filter === f
                    ? "bg-gold-gradient text-primary-foreground font-semibold shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── TELA RAIZ: APENAS AS COLEÇÕES / GRUPOS EM 16:9 (ZERO DUALIDADE) ── */}
      {!currentFolderId && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Folder className="h-4 w-4 text-gold" />
              <span>Coleções de Criativos</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {creativeFoldersList.length} {creativeFoldersList.length === 1 ? "coleção" : "coleções"}
            </span>
          </div>

          {creativeFoldersList.length === 0 ? (
            <EmptyState
              icon={Folder}
              title="Nenhuma coleção disponível"
              description="Aguarde o administrador publicar novas coleções de criativos."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {creativeFoldersList.map((folder) => {
                const count = countByFolder[folder.id] || 0;
                const colorKey = folder.color || "gold";
                const gradient = COLOR_GRADIENT[colorKey] || COLOR_GRADIENT.gold;
                const border = COLOR_BORDER[colorKey] || COLOR_BORDER.gold;
                const colorText = COLOR_TEXT[colorKey] || COLOR_TEXT.gold;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setFilter("Todos");
                    }}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/20 text-left cursor-pointer flex flex-col justify-between",
                      border
                    )}
                  >
                    {/* Área 9:16 — Capa Vertical Nativa (Sem cortes) */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-muted/80">
                      {folder.coverImage ? (
                        <img
                          src={folder.coverImage}
                          alt={folder.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-full w-full bg-gradient-to-br",
                            gradient
                          )}
                        />
                      )}
                      {/* Overlay degradê na base e topo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30" />

                      {/* Badge de contagem no canto superior direito */}
                      <div className="absolute right-2.5 top-2.5">
                        <span className="rounded-full border border-white/20 bg-black/85 px-2 py-0.5 text-[9px] font-mono font-bold text-white shadow-xs">
                          {count} {count === 1 ? "peça" : "peças"}
                        </span>
                      </div>

                      {/* Ícone de pasta no centro quando sem capa */}
                      {!folder.coverImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Folder className={cn("h-12 w-12 opacity-20", colorText)} />
                        </div>
                      )}

                      {/* Título e descrição sobrepostos na base */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-display text-sm sm:text-base font-bold text-white drop-shadow-md truncate group-hover:text-gold transition duration-200">
                          {folder.name}
                        </h3>
                        {folder.description && (
                          <p className="mt-0.5 text-[11px] text-white/75 line-clamp-2">
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer do card */}
                    <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/10 bg-black/40">
                      <span className={cn("text-[11px] font-semibold flex items-center gap-1", colorText)}>
                        Acessar coleção →
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {count} {count === 1 ? "peça" : "peças"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── TELA DENTRO DA COLEÇÃO: MÍDIAS EM 16:9 & BANCO DE COPYS ───────── */}
      {currentFolderId && (
        <>
          {/* ESTADO VAZIO DO FILTRO OU GRUPO */}
          {filteredVisualItems.length === 0 && filteredCopyItems.length === 0 && (
            <EmptyState
              icon={ImageIcon}
              title={
                filter === "Todos"
                  ? `Nenhum criativo na coleção "${currentFolder?.name}"`
                  : `Nenhum criativo no formato "${filter}"`
              }
              description={
                filter === "Todos"
                  ? "Esta coleção ainda não possui criativos adicionados."
                  : "Tente selecionar outro formato de filtro acima para visualizar as peças disponíveis."
              }
            />
          )}

          {/* SEÇÃO 1: GALERIA DE CRIATIVOS VISUAIS EM 16:9 WIDESCREEN */}
          {filteredVisualItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <h2 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gold" />
                  <span>Mídias & Vídeos</span>
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">{filteredVisualItems.length} peças</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayedVisualItems.map((c) => (
                  <div
                    key={c.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card shadow-md transition-all duration-200 hover:border-gold/40 hover:-translate-y-1 hover:shadow-gold/20"
                  >
                    {/* Janela Visual 9:16 Vertical (dimensão de tela de smartphone) */}
                    <button
                      type="button"
                      onClick={() => setOpen(c)}
                      className="relative aspect-[9/16] w-full overflow-hidden bg-muted/80 text-left block cursor-pointer"
                    >
                      {/* Capa: thumbnail do arquivo ou imagem estática */}
                      {c.image ? (
                        <img
                          src={c.image}
                          alt={c.title}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/40" />

                      {/* Badges de Formato / Tipo */}
                      <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1">
                        <span className="rounded-full border border-white/10 bg-black/85 px-2 py-0.5 text-[9px] font-mono font-bold text-gold">
                          {c.type}
                        </span>
                        {c.format && (
                          <span className="rounded-full border border-white/10 bg-black/85 px-1.5 py-0.5 text-[8px] font-mono text-white/80 hidden sm:inline-block">
                            {c.format}
                          </span>
                        )}
                      </div>

                      {/* Badge de tamanho do arquivo */}
                      {c.fileSize && (
                        <div className="absolute right-2 top-2">
                          <span className="rounded-full border border-white/10 bg-black/85 px-1.5 py-0.5 text-[8px] font-mono text-white/70">
                            {c.fileSize}
                          </span>
                        </div>
                      )}

                      {/* Ícone de Play para Reels/Vídeos */}
                      {(c.type === "Reels" || c.fileType?.startsWith("video/")) && (
                        <div className="absolute inset-0 grid place-items-center">
                          <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-black/85 text-gold shadow-gold transition group-hover:scale-110">
                            <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                          </span>
                        </div>
                      )}

                      {/* Título sobreposto na base */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="font-display text-xs font-bold text-white tracking-tight drop-shadow-md line-clamp-2">
                          {c.title}
                        </p>
                      </div>
                    </button>

                    {/* Rodapé com ações */}
                    <div className="flex items-center justify-between p-2 sm:p-2.5 border-t border-border/30 bg-card/80 gap-1">
                      <span className="text-[9px] font-mono text-muted-foreground truncate max-w-[50px]">
                        {c.fileType ? c.fileType.split("/")[1]?.toUpperCase() : c.format}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => copyText(getCreativeCopy(c), "Copy do criativo copiada!")}
                          title="Copiar texto sugerido deste criativo"
                          aria-label="Copiar texto"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card text-muted-foreground hover:border-gold hover:text-gold transition cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>

                        {/* Link externo (Google Drive / Canva) */}
                        {c.externalDownloadUrl && (
                          <a
                            href={c.externalDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Acessar link externo"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/40 bg-card text-muted-foreground hover:border-gold hover:text-gold transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}

                        {/* Download de arquivo */}
                        <button
                          onClick={() => handleDownload(c)}
                          title="Baixar peça em alta resolução"
                          aria-label="Baixar peça"
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-gold/30 bg-gold/10 px-2 text-[10px] font-semibold text-gold hover:bg-gold/20 transition shadow-xs cursor-pointer"
                        >
                          <Download className="h-3 w-3" />
                          <span className="hidden sm:inline">Baixar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação Progressiva para Performance Máxima */}
              {filteredVisualItems.length > visibleCount && (
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 24)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-card px-6 py-2.5 text-xs font-semibold text-gold hover:bg-gold/10 hover:border-gold transition shadow-md cursor-pointer"
                  >
                    Carregar mais peças (+{Math.min(24, filteredVisualItems.length - visibleCount)} de {filteredVisualItems.length - visibleCount})
                  </button>
                </div>
              )}
            </section>
          )}

          {/* SEÇÃO 2: BANCO DE COPYS */}
          {filteredCopyItems.length > 0 && (
            <section className={cn("space-y-3", filteredVisualItems.length > 0 && "pt-6")}>
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <h2 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" />
                  <span>Banco de Copys de Alta Conversão</span>
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">{filteredCopyItems.length} copys</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCopyItems.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm shadow-xs transition hover:border-gold/30"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span className="font-bold uppercase tracking-wider text-gold">Copy Persuasiva</span>
                        <span>Texto formatado</span>
                      </div>
                      <h3 className="mt-1.5 font-display text-base font-bold text-foreground">
                        {c.title.replace("Copy — ", "")}
                      </h3>
                      <div className="mt-2.5 rounded-xl border border-border/30 bg-muted/40 p-3 text-xs leading-relaxed text-foreground/85">
                        {c.text}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">Pronto para Meta Ads e WhatsApp</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDownload(c)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/40 bg-card/60 px-2.5 text-[11px] font-medium text-foreground hover:border-gold hover:text-gold transition cursor-pointer"
                          title="Salvar como arquivo .txt"
                        >
                          <Download className="h-3 w-3" />
                          <span>Salvar .txt</span>
                        </button>
                        <button
                          onClick={() => copyText(c.text!, "Texto da copy copiado com sucesso!")}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gold-gradient px-3 text-[11px] font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copiar Texto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* MODAL DE PREVIEW */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:grid-cols-[1.1fr_1fr] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual com Player de Vídeo Interativo ou Imagem */}
            <div className="relative bg-black/95 flex items-center justify-center min-h-[220px] sm:min-h-[320px] max-h-[36vh] md:max-h-[88vh] overflow-hidden p-2">
              {previewVideoUrl ? (
                <video
                  key={previewVideoUrl}
                  src={previewVideoUrl}
                  poster={open.image}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[34vh] md:max-h-[84vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                />
              ) : isResolvingVideo ? (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent shadow-gold" />
                  <p className="text-xs font-semibold text-gold">Carregando vídeo para pré-visualização...</p>
                  {open.image && (
                    <img
                      src={open.image}
                      alt={open.title}
                      className="max-h-36 sm:max-h-48 w-auto rounded-lg opacity-40 object-contain mt-1"
                    />
                  )}
                </div>
              ) : open.image ? (
                <img
                  src={open.image}
                  alt={open.title}
                  className="max-h-full max-w-full object-contain rounded-xl"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-8">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold backdrop-blur-md border border-white/10 z-10">
                {open.type} · {open.format}
              </span>
              {open.fileSize && (
                <span className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-0.5 text-[10px] font-mono text-white/70 backdrop-blur-md border border-white/10 z-10">
                  {open.fileSize}
                </span>
              )}
            </div>

            {/* Painel lateral */}
            <div className="flex flex-col flex-1 max-h-[54vh] md:max-h-[88vh] bg-card overflow-hidden">
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 pb-2.5 sm:pb-3 border-b border-border/20">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  Material Oficial Vellessa
                </span>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Fechar"
                  className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/50 hover:bg-muted transition text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Corpo */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 py-2.5 sm:py-3 space-y-3 custom-scrollbar overscroll-contain">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">{open.title}</h2>
                  <p className="mt-0.5 sm:mt-1 text-xs text-muted-foreground">
                    {open.fileType
                      ? `Formato ${open.fileType.split("/")[1]?.toUpperCase() ?? open.format}${open.fileSize ? ` · ${open.fileSize}` : ""}.`
                      : `Formato nativo ${open.format}.`}{" "}
                    Ideal para anúncios de topo de funil e stories engajados.
                  </p>
                </div>

                {/* Link externo se houver */}
                {open.externalDownloadUrl && (
                  <a
                    href={open.externalDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/40 p-2.5 sm:p-3 text-xs text-gold hover:border-gold/60 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Acessar arquivo no link externo</span>
                  </a>
                )}

                <div className="rounded-xl bg-muted/40 border border-border/40 p-3 sm:p-3.5 text-xs leading-relaxed text-foreground">
                  <p className="font-semibold text-gold text-[10px] uppercase mb-1">Copy Recomendada para Anúncio:</p>
                  <p className="whitespace-pre-wrap">{getCreativeCopy(open)}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 flex gap-2 p-3 sm:p-5 pt-2.5 sm:pt-3 border-t border-border/30 bg-card z-10">
                <button
                  onClick={() => copyText(getCreativeCopy(open), "Copy sugerida copiada!")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card py-2.5 text-xs font-semibold hover:border-gold hover:text-gold transition cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar Copy
                </button>
                <button
                  onClick={() => handleDownload(open)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-gradient py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar Peça
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

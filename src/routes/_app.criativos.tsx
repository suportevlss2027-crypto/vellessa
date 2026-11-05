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
  const [open, setOpen] = useState<Creative | null>(null);
  const { copyText, downloadAsset, creativesList, creativeFoldersList } =
    useAffiliateStore();

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

  const currentFolder = useMemo(
    () => creativeFoldersList.find((f) => f.id === currentFolderId),
    [creativeFoldersList, currentFolderId]
  );

  // Contagem de peças por grupo
  const countByFolder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of creativesList) {
      if (c.folderId) {
        map[c.folderId] = (map[c.folderId] || 0) + 1;
      }
    }
    return map;
  }, [creativesList]);

  // Criativos ativos de acordo com o grupo atual
  const activeCreatives = useMemo(() => {
    if (currentFolderId) {
      return creativesList.filter((c) => c.folderId === currentFolderId);
    }
    // Na raiz: mostra criativos sem grupo
    return creativesList.filter((c) => !c.folderId);
  }, [creativesList, currentFolderId]);

  const visualItems = activeCreatives.filter((c) => c.type !== "Copy");
  const copyItems = activeCreatives.filter((c) => c.type === "Copy");

  const filteredVisualItems =
    filter === "Todos"
      ? visualItems
      : filter === "Copy"
      ? []
      : visualItems.filter((c) => c.type === filter);

  const filteredCopyItems =
    filter === "Todos" || filter === "Copy"
      ? copyItems
      : [];

  // Download: arquivo direto ou fallback para imagem/texto
  const handleDownload = (c: Creative) => {
    if (c.fileUrl) {
      const a = document.createElement("a");
      a.href = c.fileUrl;
      a.download = c.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
      a.click();
    } else if (c.image) {
      downloadAsset(c.image, `${c.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`);
    } else if (c.text) {
      const blob = new Blob([c.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      downloadAsset(url, `${c.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`);
    }
  };

  const hasGroups = !currentFolderId && creativeFoldersList.length > 0;
  const totalRootCreatives = creativesList.filter((c) => !c.folderId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Biblioteca Oficial"
        title="Criativos para Anúncios"
        description="Peças publicitárias de alta conversão aprovadas pela marca, organizadas por grupos e formatos para download imediato."
      >
        <div className="flex gap-1 overflow-x-auto rounded-full border border-border/40 bg-card/60 p-1 backdrop-blur-sm shadow-xs">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                filter === f
                  ? "bg-gold-gradient text-primary-foreground font-semibold shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* ── NAVEGAÇÃO DENTRO DE UM GRUPO ─────────────────────────────────── */}
      {currentFolderId && currentFolder && (
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => setCurrentFolderId(null)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/60 text-muted-foreground transition hover:border-gold hover:text-gold"
            title="Voltar para todos os grupos"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gold truncate">{currentFolder.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {activeCreatives.length} {activeCreatives.length === 1 ? "peça disponível" : "peças disponíveis"}
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/60">Grupo de Criativos</span>
        </div>
      )}

      {/* ── GRUPOS ESTILO KIWIFY (16:9) ──────────────────────────────────── */}
      {hasGroups && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Folder className="h-4 w-4 text-gold" />
              <span>Grupos de Criativos</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {creativeFoldersList.length} {creativeFoldersList.length === 1 ? "grupo" : "grupos"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl text-left",
                    border
                  )}
                >
                  {/* Área 16:9 — Capa Estilo Kiwify */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    {folder.coverImage ? (
                      <img
                        src={folder.coverImage}
                        alt={folder.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={cn(
                          "h-full w-full bg-gradient-to-br",
                          gradient
                        )}
                      />
                    )}
                    {/* Overlay degradê na base */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badge de contagem no canto superior direito */}
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full border border-white/15 bg-black/60 px-2.5 py-0.5 text-[10px] font-mono font-bold text-white backdrop-blur-md">
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
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-display text-sm font-bold text-white drop-shadow-sm truncate group-hover:text-gold transition duration-200">
                        {folder.name}
                      </h3>
                      {folder.description && (
                        <p className="mt-0.5 text-[11px] text-white/70 line-clamp-1">
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer do card */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-black/20">
                    <span className={cn("text-[11px] font-semibold", colorText)}>
                      Acessar grupo
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {count} {count === 1 ? "peça disponível" : "peças disponíveis"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Divisor entre grupos e criativos avulsos */}
          {totalRootCreatives > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-[11px] font-mono text-muted-foreground">
                {totalRootCreatives} {totalRootCreatives === 1 ? "criativo avulso" : "criativos avulsos"}
              </span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
          )}
        </section>
      )}

      {/* ESTADO VAZIO */}
      {filteredVisualItems.length === 0 && filteredCopyItems.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title={
            currentFolder
              ? `Nenhum criativo no grupo "${currentFolder.name}"`
              : filter === "Todos"
              ? creativeFoldersList.length > 0
                ? "Nenhum criativo avulso"
                : "Nenhum criativo disponível"
              : `Nenhum criativo no filtro "${filter}"`
          }
          description={
            currentFolder
              ? "Este grupo ainda não possui criativos adicionados."
              : creativeFoldersList.length > 0
              ? "Acesse um dos grupos acima para ver os criativos disponíveis."
              : "Aguarde o administrador publicar novas peças."
          }
        />
      )}

      {/* SEÇÃO 1: GALERIA DE CRIATIVOS VISUAIS */}
      {filteredVisualItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-gold" />
              <span>
                {currentFolder ? `Mídias — ${currentFolder.name}` : "Mídias Gráficas & Vídeos"}
              </span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">{filteredVisualItems.length} peças</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVisualItems.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-card/60 transition-all duration-300 hover:border-gold/40 hover:-translate-y-0.5 shadow-xs backdrop-blur-sm"
              >
                {/* Janela Visual (Aspect 4:5) */}
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className="relative aspect-[4/5] w-full overflow-hidden bg-muted/80 text-left block cursor-pointer"
                >
                  {/* Capa: thumbnail do arquivo ou imagem estática */}
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />

                  {/* Badges de Formato / Tipo */}
                  <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1">
                    <span className="rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[9px] font-mono font-bold text-gold backdrop-blur-md">
                      {c.type}
                    </span>
                    {c.format && (
                      <span className="rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/80 backdrop-blur-md">
                        {c.format}
                      </span>
                    )}
                  </div>

                  {/* Badge de tamanho do arquivo */}
                  {c.fileSize && (
                    <div className="absolute right-2.5 top-2.5">
                      <span className="rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/70 backdrop-blur-md">
                        {c.fileSize}
                      </span>
                    </div>
                  )}

                  {/* Ícone de Play para Reels/Vídeos */}
                  {(c.type === "Reels" || c.fileType?.startsWith("video/")) && (
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-black/60 text-gold shadow-gold backdrop-blur-md transition group-hover:scale-110">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </span>
                    </div>
                  )}

                  {/* Título sobreposto na base */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="font-display text-sm font-bold text-white tracking-tight drop-shadow-sm truncate">
                      {c.title}
                    </p>
                  </div>
                </button>

                {/* Rodapé com ações */}
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-card/40 gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px]">
                    {c.fileType ? c.fileType.split("/")[1]?.toUpperCase() : c.format}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => copyText(getCreativeCopy(c), "Copy do criativo copiada!")}
                      title="Copiar texto sugerido deste criativo"
                      aria-label="Copiar texto"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-gold hover:text-gold transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>

                    {/* Link externo (Google Drive / Canva) */}
                    {c.externalDownloadUrl && (
                      <a
                        href={c.externalDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Acessar link externo"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/40 bg-card/60 px-2.5 text-[11px] font-semibold text-muted-foreground hover:border-gold hover:text-gold transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Link</span>
                      </a>
                    )}

                    {/* Download de arquivo */}
                    <button
                      onClick={() => handleDownload(c)}
                      title="Baixar peça em alta resolução"
                      aria-label="Baixar peça"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/10 px-2.5 text-[11px] font-semibold text-gold hover:bg-gold/20 transition shadow-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Baixar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEÇÃO 2: BANCO DE COPYS */}
      {filteredCopyItems.length > 0 && (
        <section className={cn("space-y-3", filter === "Todos" && "pt-6")}>
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-gold" />
              <span>Banco de Copys de Alta Conversão</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">{filteredCopyItems.length} copys</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCopyItems.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm shadow-xs transition hover:border-gold/30"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="font-bold uppercase tracking-wider text-gold">Copy Persuasiva</span>
                    <span>Texto formatado</span>
                  </div>
                  <h3 className="mt-1.5 font-display text-base font-bold text-foreground">
                    {c.title.replace("Copy — ", "")}
                  </h3>
                  <div className="mt-2.5 rounded-lg border border-border/30 bg-muted/40 p-3 text-xs leading-relaxed text-foreground/85">
                    {c.text}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 pt-2 border-t border-border/30">
                  <span className="text-[10px] text-muted-foreground">Pronto para Meta Ads e WhatsApp</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(c)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/40 bg-card/60 px-2.5 text-[11px] font-medium text-foreground hover:border-gold hover:text-gold transition"
                      title="Salvar como arquivo .txt"
                    >
                      <Download className="h-3 w-3" />
                      <span>Salvar .txt</span>
                    </button>
                    <button
                      onClick={() => copyText(c.text!, "Texto da copy copiado com sucesso!")}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gold-gradient px-3 text-[11px] font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
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

      {/* MODAL DE PREVIEW */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative grid max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:grid-cols-[1.1fr_1fr] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual */}
            <div className="relative bg-black/95 flex items-center justify-center max-h-[45vh] md:max-h-[88vh] overflow-hidden p-2">
              {open.image ? (
                <img
                  src={open.image}
                  alt={open.title}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-20 w-20 text-muted-foreground/20" />
                </div>
              )}
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold backdrop-blur-md border border-white/10">
                {open.type} · {open.format}
              </span>
              {open.fileSize && (
                <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-mono text-white/70 backdrop-blur-md border border-white/10">
                  {open.fileSize}
                </span>
              )}
            </div>

            {/* Painel lateral */}
            <div className="flex flex-col max-h-[45vh] md:max-h-[88vh] bg-card">
              {/* Header */}
              <div className="shrink-0 flex items-center justify-between p-5 pb-3 border-b border-border/20">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  Material Oficial Vellessa
                </span>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Fechar"
                  className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/50 hover:bg-muted transition text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* Corpo */}
              <div className="flex-1 overflow-y-auto p-5 py-3 space-y-3 custom-scrollbar overscroll-contain">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{open.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
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
                    className="flex items-center gap-2 rounded-xl border border-border/40 bg-muted/40 p-3 text-xs text-gold hover:border-gold/60 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Acessar arquivo no link externo</span>
                  </a>
                )}

                <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5 text-xs leading-relaxed text-foreground">
                  <p className="font-semibold text-gold text-[10px] uppercase mb-1">Copy Recomendada para Anúncio:</p>
                  <p className="whitespace-pre-wrap">{getCreativeCopy(open)}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 flex gap-2 p-5 pt-3 border-t border-border/30 bg-card">
                <button
                  onClick={() => copyText(getCreativeCopy(open), "Copy sugerida copiada!")}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-card py-2.5 text-xs font-semibold hover:border-gold hover:text-gold transition"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar Copy
                </button>
                <button
                  onClick={() => handleDownload(open)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-gradient py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
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

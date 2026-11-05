import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Play,
  Sparkles,
  Video,
  X,
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

const COLOR_MAP: Record<string, string> = {
  gold: "text-gold bg-gold/15 border-gold/30 hover:border-gold/60",
  emerald: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/60",
  rose: "text-rose-400 bg-rose-500/15 border-rose-500/30 hover:border-rose-500/60",
  violet: "text-violet-400 bg-violet-500/15 border-violet-500/30 hover:border-violet-500/60",
  sky: "text-sky-400 bg-sky-500/15 border-sky-500/30 hover:border-sky-500/60",
  amber: "text-amber-400 bg-amber-500/15 border-amber-500/30 hover:border-amber-500/60",
};

const COLOR_DOT: Record<string, string> = {
  gold: "bg-gold",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
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

  // Contagem de peças por pasta
  const countByFolder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of creativesList) {
      if (c.folderId) {
        map[c.folderId] = (map[c.folderId] || 0) + 1;
      }
    }
    return map;
  }, [creativesList]);

  // Criativos ativos de acordo com a pasta atual
  const activeCreatives = useMemo(() => {
    if (currentFolderId) {
      return creativesList.filter((c) => c.folderId === currentFolderId);
    }
    // Na raiz geral: mostra apenas criativos sem pasta
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

  const handleDownload = (c: Creative) => {
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
      <PageHeader
        eyebrow="Biblioteca Oficial"
        title="Criativos para Anúncios"
        description="Peças publicitárias de alta conversão aprovadas pela marca, organizadas por pastas e formatos para download imediato."
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

      {/* ── BREADCRUMB ESPACIAL (FINDER) ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 sm:px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition font-medium ${
              !currentFolderId
                ? "bg-gold/15 text-gold font-semibold border border-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Raiz Geral</span>
          </button>

          {currentFolder && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/15 text-gold font-semibold border border-gold/30">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>{currentFolder.name}</span>
                <span className="ml-1 text-[10px] opacity-75">
                  ({activeCreatives.length})
                </span>
              </div>
            </>
          )}

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition"
              title="Voltar para a raiz"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar à raiz
            </button>
          )}
        </div>

        <span className="text-xs text-muted-foreground font-mono">
          {activeCreatives.length} {activeCreatives.length === 1 ? "peça" : "peças"}
        </span>
      </div>

      {/* ── SEÇÃO DE PASTAS DE CRIATIVOS (EXIBIDA NA RAIZ) ──────────────── */}
      {!currentFolderId && creativeFoldersList.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-base font-bold tracking-tight text-foreground flex items-center gap-2">
              <Folder className="h-4 w-4 text-gold" />
              <span>Pastas de Campanhas & Formatos</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {creativeFoldersList.length} {creativeFoldersList.length === 1 ? "pasta" : "pastas"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {creativeFoldersList.map((folder) => {
              const count = countByFolder[folder.id] || 0;
              const colorTheme = COLOR_MAP[folder.color || "gold"] || COLOR_MAP.gold;
              const dotColor = COLOR_DOT[folder.color || "gold"] || COLOR_DOT.gold;

              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="group relative cursor-pointer rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:border-gold/50 hover:bg-card hover:shadow-gold flex flex-col justify-between backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-xl border transition ${colorTheme}`}
                      >
                        <Folder className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-gold transition">
                          {folder.name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {count} {count === 1 ? "peça disponível" : "peças disponíveis"}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-gold group-hover:translate-x-0.5 transition shrink-0 mt-1" />
                  </div>

                  {folder.description && (
                    <p className="mt-2.5 text-xs text-muted-foreground line-clamp-1">
                      {folder.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 border-t border-border/40 pt-2 text-[11px] text-gold font-medium">
                    <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                    <span>Ver criativos desta pasta</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ESTADO VAZIO CASO NÃO HAJA CRIATIVOS CADASTRADOS */}
      {filteredVisualItems.length === 0 && filteredCopyItems.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title={
            currentFolder
              ? `Nenhum criativo na pasta "${currentFolder.name}"`
              : filter === "Todos"
              ? "Nenhum criativo avulso na raiz"
              : `Nenhum criativo no filtro "${filter}"`
          }
          description={
            currentFolder
              ? "Esta pasta ainda não possui criativos adicionados."
              : "Verifique as pastas acima ou aguarde o administrador publicar novas peças."
          }
        />
      )}

      {/* SEÇÃO 1: GALERIA DE CRIATIVOS VISUAIS (GRID PERFEITO E SIMÉTRICO) */}
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
                {/* Janela Visual Padronizada (Aspect 4:5 Consistente) */}
                <button
                  type="button"
                  onClick={() => setOpen(c)}
                  className="relative aspect-[4/5] w-full overflow-hidden bg-muted/80 text-left block cursor-pointer"
                >
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />

                  {/* Badge de Formato no Topo */}
                  <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                    <span className="rounded-full border border-white/10 bg-black/70 px-2 py-0.5 text-[9px] font-mono font-bold text-gold backdrop-blur-md">
                      {c.type}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-mono text-white/80 backdrop-blur-md">
                      {c.format}
                    </span>
                  </div>

                  {/* Ícone de Play para Reels/Vídeos */}
                  {c.type === "Reels" && (
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-black/60 text-gold shadow-gold backdrop-blur-md transition group-hover:scale-110">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </span>
                    </div>
                  )}

                  {/* Título sobreposto suavemente na base da imagem */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <p className="font-display text-sm font-bold text-white tracking-tight drop-shadow-sm truncate">
                      {c.title}
                    </p>
                  </div>
                </button>

                {/* Rodapé Alinhado com Altura e Ações Uniformes */}
                <div className="flex items-center justify-between p-3 border-t border-border/30 bg-card/40">
                  <span className="text-[10px] font-mono text-muted-foreground">{c.format}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyText(getCreativeCopy(c), "Copy do criativo copiada!")}
                      title="Copiar texto sugerido deste criativo"
                      aria-label="Copiar texto"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-card/60 text-muted-foreground hover:border-gold hover:text-gold transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(c)}
                      title="Baixar imagem/vídeo em alta resolução"
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

      {/* SEÇÃO 2: BANCO DE COPYS VALIDADAS (DEDICADA & SEM POLUIR AS MÍDIAS) */}
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
                className="flex flex-col justify-between rounded-xl border border-white/10 bg-card/60 p-4.5 backdrop-blur-sm shadow-xs transition hover:border-gold/30"
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

      {/* MODAL DE PREVIEW EM ALTA RESOLUÇÃO */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative grid max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:grid-cols-[1.1fr_1fr] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual da Imagem sem Distorção */}
            <div className="relative bg-black/95 flex items-center justify-center max-h-[45vh] md:max-h-[88vh] overflow-hidden p-2">
              <img
                src={open.image}
                alt={open.title}
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold backdrop-blur-md border border-white/10">
                {open.type} · {open.format}
              </span>
            </div>

            {/* Painel Lateral com Detalhes e Ações - Tripartite */}
            <div className="flex flex-col max-h-[45vh] md:max-h-[88vh] bg-card">
              {/* Header fixo */}
              <div className="shrink-0 flex items-center justify-between p-5 pb-3 border-b border-border/20">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                  Material Oficial Vellessa
                </span>
                <button
                  onClick={() => setOpen(null)}
                  aria-label="Fechar"
                  className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/50 hover:bg-muted transition text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Corpo rolável com scroll suave */}
              <div className="flex-1 overflow-y-auto p-5 py-3 space-y-3 custom-scrollbar overscroll-contain">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{open.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formato nativo {open.format}. Ideal para anúncios de topo de funil e stories engajados.
                  </p>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border/40 p-3.5 text-xs leading-relaxed text-foreground">
                  <p className="font-semibold text-gold text-[10px] uppercase mb-1">Copy Recomendada para Anúncio:</p>
                  <p className="whitespace-pre-wrap">{getCreativeCopy(open)}</p>
                </div>
              </div>

              {/* Footer fixo */}
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

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, FileText, Image as ImageIcon, Play, Sparkles, Video, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { creatives, type Creative } from "@/data/content";
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

function getCreativeCopy(creative: Creative): string {
  if (creative.text) return creative.text;
  if (creative.title.includes("Ritual")) {
    return "Sua pele merece um ritual de luxo diário. ✨ O Sérum Vellessa combina ácido hialurônico, rosa mosqueta e extrato de romã para hidratação profunda e toque aveludado imediato. Adquira pelo link oficial com desconto exclusivo!";
  }
  if (creative.title.includes("Radiante") || creative.title.includes("Pele")) {
    return "Mais de 12 mil mulheres já comprovaram a luminosidade e firmeza da pele com o Sérum Vellessa. Sem oleosidade, com toque acetinado e resultados visíveis nas primeiras semanas. Experimente com garantia de 30 dias!";
  }
  if (creative.title.includes("Kit") || creative.title.includes("Trio")) {
    return "OFERTA EXCLUSIVA: Leve o Kit 3 Frascos do Sérum Vellessa com desconto especial e tratamento completo para 90 dias. Resultados potencializados e o melhor custo-benefício. Garanta o seu pelo link oficial!";
  }
  if (creative.type === "Reels") {
    return "Olha o resultado dessa aplicação em apenas 15 segundos! Pele com viço natural, toque seco e zero filtro. O segredo da pele luminosa está neste frasco dourado. Toque no link para conferir!";
  }
  return "Transforme sua rotina de cuidados com a elegância e potência do Sérum Vellessa. Alta concentração de ativos nobres para uma pele renovada e viçosa todos os dias. Link com desconto exclusivo!";
}

function Criativos() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("Todos");
  const [open, setOpen] = useState<Creative | null>(null);
  const { copyText, downloadAsset, creativesList } = useAffiliateStore();

  const currentCreatives = creativesList && creativesList.length > 0 ? creativesList : creatives;

  const visualItems = currentCreatives.filter((c) => c.type !== "Copy");
  const copyItems = currentCreatives.filter((c) => c.type === "Copy");

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
        description="Peças publicitárias de alta conversão aprovadas pela marca, organizadas por formato para download imediato."
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

      {/* SEÇÃO 1: GALERIA DE CRIATIVOS VISUAIS (GRID PERFEITO E SIMÉTRICO) */}
      {filteredVisualItems.length > 0 && (
        <section className="space-y-3">
          {filter === "Todos" && (
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-gold" />
                <span>Mídias Gráficas & Vídeos</span>
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground">{filteredVisualItems.length} peças</span>
            </div>
          )}

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
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative grid max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl md:grid-cols-[1.1fr_1fr] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Visual da Imagem sem Distorção */}
            <div className="relative bg-black/95 flex items-center justify-center max-h-[50vh] md:max-h-[85vh] overflow-hidden p-2">
              <img
                src={open.image}
                alt={open.title}
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold backdrop-blur-md border border-white/10">
                {open.type} · {open.format}
              </span>
            </div>

            {/* Painel Lateral com Detalhes e Ações */}
            <div className="flex flex-col justify-between p-5 sm:p-6 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">
                    Material Oficial de Alta Resolução
                  </span>
                  <button
                    onClick={() => setOpen(null)}
                    aria-label="Fechar"
                    className="grid h-8 w-8 place-items-center rounded-full bg-card border border-border/50 hover:bg-muted transition text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <h2 className="mt-2 font-display text-xl font-bold text-foreground">{open.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formato nativo {open.format}. Ideal para anúncios de topo de funil e stories engajados.
                </p>

                <div className="mt-4 rounded-xl bg-muted/40 border border-border/40 p-3.5 text-xs leading-relaxed text-foreground">
                  <p className="font-semibold text-gold text-[10px] uppercase mb-1">Copy Recomendada para Anúncio:</p>
                  {getCreativeCopy(open)}
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-3 border-t border-border/30">
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

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Play, X } from "lucide-react";
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
  const list = filter === "Todos" ? currentCreatives : currentCreatives.filter((c) => c.type === filter);

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
    <>
      <PageHeader
        eyebrow="Biblioteca Oficial"
        title="Criativos para anúncio"
        description="Peças publicitárias de alta conversão aprovadas pela marca, prontas para baixar e anunciar no Meta Ads, TikTok e Instagram."
      >
        <div className="flex gap-1 overflow-x-auto rounded-full border bg-card p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                filter === f
                  ? "bg-gold-gradient text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {list.map((c) =>
          c.type === "Copy" ? (
            <div key={c.id} className="break-inside-avoid rounded-3xl border bg-hero-gradient p-6 gold-hairline">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Copy Persuasiva</span>
                <span className="text-xs text-muted-foreground">{c.format}</span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold">{c.title.replace("Copy — ", "")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => copyText(c.text!, "Texto da copy copiado com sucesso!")}
                  className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium transition hover:border-gold hover:text-gold border"
                >
                  <Copy className="h-4 w-4" /> Copiar texto
                </button>
                <button
                  onClick={() => handleDownload(c)}
                  className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-2 text-sm font-medium hover:border-gold hover:text-gold transition"
                  title="Salvar como arquivo de texto"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              key={c.id}
              className="group block w-full break-inside-avoid overflow-hidden rounded-3xl border bg-card text-left transition hover:border-gold hover:shadow-soft"
            >
              <button
                onClick={() => setOpen(c)}
                className="w-full block text-left"
              >
                <div className={cn("relative overflow-hidden bg-muted", c.type === "Feed" ? "aspect-square" : "aspect-[9/14]")}>
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-card/85 px-3 py-1 text-xs font-semibold backdrop-blur">
                    {c.type}
                  </span>
                  {c.type === "Reels" && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-card/85 text-gold backdrop-blur transition group-hover:scale-110">
                        <Play className="h-5 w-5 fill-current" />
                      </span>
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center justify-between p-4 border-t bg-card/40">
                <div onClick={() => setOpen(c)} className="cursor-pointer">
                  <p className="font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.format}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyText(getCreativeCopy(c), "Copy do criativo copiada!")}
                    title="Copiar texto sugerido"
                    aria-label="Copiar texto sugerido"
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-gold transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(c)}
                    title="Baixar imagem/vídeo"
                    aria-label="Baixar imagem/vídeo"
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-gold transition"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-overlay/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative grid max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border bg-card shadow-soft md:grid-cols-[1.2fr_1fr] animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-black flex items-center justify-center max-h-[60vh] md:max-h-[90vh] overflow-hidden">
              <img
                src={open.image}
                alt={open.title}
                className="h-full w-full object-contain md:object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {open.type} · {open.format}
              </span>
            </div>

            <div className="flex flex-col p-6 sm:p-8 overflow-y-auto">
              <button
                onClick={() => setOpen(null)}
                aria-label="Fechar"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-card/90 border hover:bg-muted transition text-foreground"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Material de Alta Resolução
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground">{open.title}</h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Recomendação: utilize a copy validada abaixo para postagens no feed ou tráfego pago.
              </p>

              <div className="mt-4 rounded-2xl bg-muted/60 border p-4 text-xs sm:text-sm leading-relaxed text-foreground">
                <p className="font-semibold text-gold text-xs uppercase mb-1">Copy Recomendada:</p>
                {getCreativeCopy(open)}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => handleDownload(open)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
                >
                  <Download className="h-4 w-4" /> Baixar Peça
                </button>
                <button
                  onClick={() => copyText(getCreativeCopy(open), "Copy sugerida copiada com sucesso!")}
                  className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm font-medium hover:border-gold hover:text-gold transition"
                >
                  <Copy className="h-4 w-4" /> Copiar Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Download, ExternalLink, Link2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { links, materials } from "@/data/content";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/materiais")({
  head: () => ({
    meta: [
      { title: "Links e materiais — Vellessa Afiliados" },
      { name: "description", content: "Links de afiliada, páginas de venda, guias e PDFs da Vellessa." },
      { property: "og:title", content: "Links e materiais — Vellessa Afiliados" },
      { property: "og:description", content: "Links de afiliada, páginas de venda e guias." },
    ],
  }),
  component: Materiais,
});

function Materiais() {
  const { copyText, downloadAsset, profile } = useAffiliateStore();

  const handleDownloadMaterial = (m: (typeof materials)[number]) => {
    const content = `=== VELESSA AFILIADOS - ARQUIVO OFICIAL ===\n\nTítulo: ${m.title}\nTipo: ${m.kind}\nTamanho do Pacote: ${m.size}\nAfiliada ID: ${profile.id}\nAfiliada: ${profile.name}\nData de Emissão: ${new Date().toLocaleDateString("pt-BR")}\n\nEste documento contém diretrizes oficiais de divulgação, especificações de ativos do Sérum Vellessa e orientações para criação de campanhas de alta conversão.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase() === "pdf" ? "txt" : m.kind.toLowerCase()}`;
    downloadAsset(url, filename);
  };

  return (
    <>
      <PageHeader
        eyebrow="Ferramentas e Ativos"
        title="Links e materiais"
        description="Seus links rastreados com seu ID de afiliada e todos os manuais, arquivos e peças oficiais da marca."
      />

      <h2 className="mb-4 text-2xl font-semibold">Seus links rastreados</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        {links.map((l, i) => (
          <div
            key={l.url}
            className={
              i === 0
                ? "rounded-3xl bg-hero-gradient p-6 gold-hairline shadow-soft"
                : "rounded-3xl border bg-card p-6 shadow-xs"
            }
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-xs">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.note}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-4">
              <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{l.url}</span>
              <button
                onClick={() => copyText(l.url, `Link "${l.label}" copiado!`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar
              </button>
            </div>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
            >
              Abrir página <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-semibold">Arquivos e guias oficiais</h2>
      <div className="overflow-hidden rounded-3xl border bg-card">
        {materials.map((m) => (
          <div
            key={m.title}
            className="flex items-center gap-4 border-b p-4 last:border-0 sm:p-5 hover:bg-accent/30 transition"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent text-xs font-bold text-gold">
              {m.kind}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{m.title}</p>
              <p className="text-xs text-muted-foreground">
                Formato {m.kind} · {m.size}
              </p>
            </div>
            <button
              onClick={() => handleDownloadMaterial(m)}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:border-gold hover:text-gold transition"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Baixar Arquivo</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

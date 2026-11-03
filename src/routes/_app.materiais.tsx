import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Download, ExternalLink, Link2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/materiais")({
  head: () => ({
    meta: [
      { title: "Links e materiais — Vellessa Afiliados" },
      { name: "description", content: "Links de afiliada rastreados, páginas de venda, guias e PDFs da Vellessa." },
      { property: "og:title", content: "Links e materiais — Vellessa Afiliados" },
      { property: "og:description", content: "Links de afiliada, páginas de venda e guias." },
    ],
  }),
  component: Materiais,
});

function formatAffiliateUrl(rawUrl: string, affiliateCode: string): string {
  if (!rawUrl) return "";
  const code = affiliateCode || "VLS-OFICIAL";
  if (rawUrl.includes("{CODE}")) {
    return rawUrl.replace("{CODE}", code);
  }
  if (rawUrl.includes("ref=")) {
    return rawUrl.replace(/ref=[^&]+/, `ref=${code}`);
  }
  const sep = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${sep}ref=${code}`;
}

function Materiais() {
  const { copyText, downloadAsset, profile, linksList, materialsList } = useAffiliateStore();

  const handleDownloadMaterial = (m: { title: string; kind: string; size: string; file_url?: string }) => {
    if (m.file_url) {
      downloadAsset(m.file_url, `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase()}`);
      return;
    }
    const content = `=== VELESSA AFILIADOS - ARQUIVO OFICIAL ===\n\nTítulo: ${m.title}\nTipo: ${m.kind}\nTamanho do Pacote: ${m.size}\nAfiliada ID: ${profile.id}\nAfiliada: ${profile.name}\nData de Emissão: ${new Date().toLocaleDateString("pt-BR")}\n\nEste documento contém diretrizes oficiais de divulgação, especificações de ativos do Sérum Vellessa e orientações para criação de campanhas de alta conversão.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase() === "pdf" ? "txt" : m.kind.toLowerCase()}`;
    downloadAsset(url, filename);
  };

  return (
    <>
      <PageHeader
        eyebrow="Ferramentas e Ativos de Venda"
        title="Links e materiais"
        description="Seus links oficiais devidamente rastreados com seu ID único de afiliada, além de arquivos, manuais e materiais de apoio."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">Seus links rastreados</h2>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <Sparkles className="h-3 w-3" />
          <span>Seu código ativo: <strong className="font-mono">{profile.id}</strong></span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {linksList.map((l, i) => {
          const trackedUrl = formatAffiliateUrl(l.url, profile.id);
          return (
            <div
              key={l.id || l.url || i}
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
                <span className="flex-1 truncate font-mono text-xs text-muted-foreground" title={trackedUrl}>
                  {trackedUrl}
                </span>
                <button
                  onClick={() => copyText(trackedUrl, `Link "${l.label}" com seu código copiado!`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </button>
              </div>
              <a
                href={trackedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
              >
                Abrir página com meu código <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          );
        })}
      </div>

      <h2 className="mb-4 mt-12 text-2xl font-semibold">Arquivos e guias oficiais</h2>
      <div className="overflow-hidden rounded-3xl border bg-card">
        {materialsList.map((m, i) => (
          <div
            key={m.id || m.title || i}
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

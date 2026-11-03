import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/materiais")({
  head: () => ({
    meta: [
      { title: "Links e Materiais — Vellessa Afiliados" },
      {
        name: "description",
        content: "Acesso à Logzz para links oficiais rastreados, páginas de demonstração, manuais e materiais de apoio Vellessa.",
      },
      { property: "og:title", content: "Links e Materiais — Vellessa Afiliados" },
      { property: "og:description", content: "Central de links oficiais Logzz, páginas de referência e materiais de apoio." },
    ],
  }),
  component: Materiais,
});

function Materiais() {
  const { copyText, downloadAsset, profile, linksList, materialsList } = useAffiliateStore();

  const handleDownloadMaterial = (m: { title: string; kind: string; size: string; file_url?: string }) => {
    if (m.file_url) {
      downloadAsset(m.file_url, `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase()}`);
      return;
    }
    const content = `=== VELESSA AFILIADOS - ARQUIVO OFICIAL DE APOIO ===\n\nTítulo: ${m.title}\nTipo: ${m.kind}\nTamanho do Pacote: ${m.size}\nAluna/Membro: ${profile.name} (ID: ${profile.id})\nData de Emissão: ${new Date().toLocaleDateString("pt-BR")}\n\nEste documento contém diretrizes oficiais de divulgação, especificações de ativos do Sérum Vellessa e orientações para criação de campanhas de alta conversão.\n\nLembre-se: Todas as vendas e links comissionados são operados exclusivamente através da plataforma parceira LOGZZ.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase() === "pdf" ? "txt" : m.kind.toLowerCase()}`;
    downloadAsset(url, filename);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Central de Vendas & Ativos Oficiais"
        title="Links e Materiais de Apoio"
        description="Instruções para acessar seus links de vendas na Logzz, além de páginas oficiais de demonstração, manuais, fotos e copys validadas."
      />

      {/* 1. CARD PRINCIPAL OFICIAL: CONEXÃO COM A PLATAFORMA LOGZZ */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-card/90 to-card/70 p-6 md:p-8 backdrop-blur-xl shadow-soft">
        {/* Glow Esmeralda de Fundo */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-md">
                <span className="font-display text-sm font-black tracking-tighter text-emerald-800">
                  LQZZ
                </span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Plataforma Oficial de Checkout & Comissões</span>
                </div>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Onde está o seu link de vendas comissionado?
                </h2>
              </div>
            </div>

            <a
              href="https://app.logzz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02]"
            >
              <span>Acessar Painel Logzz & Pegar Meus Links</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-medium">
                A Vellessa opera no modelo <strong className="text-emerald-300">Cash on Delivery (Pagamento na Entrega)</strong> em parceria com a <strong className="text-foreground">Logzz</strong>. 
                É dentro do seu painel da Logzz que seu link com pixel de afiliada é gerado, as vendas caem em tempo real e você recebe suas comissões de <strong className="text-gold">até 60%</strong> direto no Pix.
              </p>
              
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Esta plataforma Vellessa é a sua <strong>área de membros e suporte</strong> (aulas, criativos e materiais).</span>
              </div>
            </div>

            {/* Passo a Passo Rápido */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-2.5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Como pegar seu link em 3 passos:
              </p>
              <div className="space-y-2 text-xs text-foreground/80">
                <div className="flex items-start gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">1</span>
                  <span>Entre na sua conta da <strong>Logzz</strong> (app.logzz.com.br).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">2</span>
                  <span>Acesse <em>Meus Produtos / Vitrine</em> e selecione a <strong>Vellessa</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">3</span>
                  <span>Copie o link com seu pixel do kit escolhido (ex: Kit 3 Campeão) e anuncie!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PÁGINAS OFICIAIS DE DEMONSTRAÇÃO E ESTUDO */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Páginas Oficiais de Demonstração
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Utilize estas páginas como referência para estudar os argumentos, ofertas e estrutura dos funis da Vellessa.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold self-start sm:self-auto">
            <Sparkles className="h-3 w-3" />
            <span>Páginas de Referência e Estudo</span>
          </div>
        </div>

        {/* Alerta de Esclarecimento sobre Links de Venda */}
        <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-xs text-foreground/85">
          <AlertCircle className="h-4 w-4 text-gold shrink-0" />
          <span>
            <strong>Atenção:</strong> Estes links abaixo são modelos públicos oficiais para você navegar e analisar. 
            Para anunciar e receber comissão de 60%, <strong>você deve usar o link com seu código gerado dentro da Logzz</strong>.
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {linksList.map((l, i) => (
            <div
              key={l.id || l.url || i}
              className={
                i === 0
                  ? "rounded-3xl bg-hero-gradient p-6 gold-hairline shadow-soft flex flex-col justify-between"
                  : "rounded-3xl border border-gold/20 bg-card/60 p-6 shadow-xs backdrop-blur-md flex flex-col justify-between"
              }
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-xs">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{l.label}</p>
                    <p className="text-xs text-muted-foreground">{l.note}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 p-1.5 pl-3.5">
                  <span className="flex-1 truncate font-mono text-xs text-muted-foreground" title={l.url}>
                    {l.url}
                  </span>
                  <button
                    onClick={() => copyText(l.url, `URL de referência "${l.label}" copiada!`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Modelo de Demonstração</span>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                >
                  Visualizar página <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ARQUIVOS E GUIAS OFICIAIS DE APOIO */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Arquivos e Manuais Oficiais
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Baixe fotos em alta definição, especificações técnicas, copys validadas e roteiros prontos para suas campanhas.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gold/25 bg-card/60 backdrop-blur-md shadow-xs">
          {materialsList.map((m, i) => (
            <div
              key={m.id || m.title || i}
              className="flex items-center gap-4 border-b border-border/40 p-4 last:border-0 sm:p-5 hover:bg-accent/30 transition"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 border border-gold/30 text-xs font-bold text-gold">
                {m.kind}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground text-sm">{m.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Formato {m.kind} · {m.size}
                </p>
              </div>
              <button
                onClick={() => handleDownloadMaterial(m)}
                className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:border-gold hover:text-gold transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Baixar Arquivo</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

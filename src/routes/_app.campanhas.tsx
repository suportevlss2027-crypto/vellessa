import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  Edit2,
  ExternalLink,
  Flame,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Link2,
  MoreVertical,
  PlusCircle,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAffiliateStore, type Campaign } from "@/lib/affiliate-store";
import { CampaignCalculator } from "@/components/campaigns/CampaignCalculator";
import { CampaignModal } from "@/components/campaigns/CampaignModal";
import { DailyMetricModal } from "@/components/campaigns/DailyMetricModal";

export const Route = createFileRoute("/_app/campanhas")({
  head: () => ({
    meta: [
      { title: "Gestor de Tráfego & Campanhas — Vellessa Afiliados" },
      {
        name: "description",
        content:
          "Gestão inteligente de campanhas no Meta Ads, vinculação de criativos oficiais e autorais, cálculo de break-even e lucro líquido em tempo real.",
      },
    ],
  }),
  component: GestaoTrafegoPage,
});

type TabType = "campaigns" | "calculator" | "utms";
type StatusFilter = "all" | "active" | "testing" | "scaling" | "paused";

function GestaoTrafegoPage() {
  const { campaignsList, deleteCampaign, copyText, profile } = useAffiliateStore();

  const [activeTab, setActiveTab] = useState<TabType>("campaigns");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [metricCampaign, setMetricCampaign] = useState<Campaign | null>(null);

  // KPIs Financeiros Consolidados
  const kpis = useMemo(() => {
    const totalSpend = campaignsList.reduce((acc, c) => acc + (c.totalAdSpend || 0), 0);
    const totalSales = campaignsList.reduce((acc, c) => acc + (c.salesCount || 0), 0);
    const totalCommission = campaignsList.reduce(
      (acc, c) => acc + (c.totalCommission || 0),
      0
    );
    const totalExtras = campaignsList.reduce((acc, c) => acc + (c.extraCosts || 0), 0);
    const netProfit = totalCommission - totalSpend - totalExtras;
    const roas = totalSpend > 0 ? totalCommission / totalSpend : 0;
    const margin = totalCommission > 0 ? (netProfit / totalCommission) * 100 : 0;

    return {
      totalSpend,
      totalSales,
      totalCommission,
      netProfit,
      roas,
      margin,
    };
  }, [campaignsList]);

  // Filtros
  const filteredCampaigns = useMemo(() => {
    return campaignsList.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (
        search.trim() &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.kitName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [campaignsList, statusFilter, search]);

  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover a campanha "${name}"?`)) {
      deleteCampaign(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        eyebrow="Inteligência Financeira & Tráfego Pago"
        title="Gestão de Tráfego & Campanhas"
        description="Controle seus custos no Meta Ads, vincule criativos aos kits da Logzz, calcule seu ponto de equilíbrio e monitore seu lucro líquido real."
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab("calculator")}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-card px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/10 transition shadow-xs"
          >
            <Calculator className="h-4 w-4" /> Calculadora Break-Even
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <PlusCircle className="h-4 w-4" /> Nova Campanha
          </button>
        </div>
      </PageHeader>

      {/* 4 Cards de Métricas Financeiras (Quiet Luxury) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Gasto em Anúncios */}
        <div className="rounded-3xl border border-white/10 bg-card p-5 space-y-2 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Investimento em Anúncios
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-muted-foreground">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            R$ {kpis.totalSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {campaignsList.length} campanhas cadastradas
          </p>
        </div>

        {/* Card 2: Comissões Logzz */}
        <div className="rounded-3xl border border-white/10 bg-card p-5 space-y-2 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Retorno em Comissões
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-400">
            R$ {kpis.totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {kpis.totalSales} {kpis.totalSales === 1 ? "venda confirmada" : "vendas confirmadas"}
          </p>
        </div>

        {/* Card 3: Lucro Líquido Real */}
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-b from-card via-card to-gold/5 p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Lucro Líquido Real
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                kpis.netProfit >= 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
              }`}
            >
              {kpis.margin.toFixed(0)}% margem
            </span>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-display font-bold ${
              kpis.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {kpis.netProfit >= 0 ? "+" : ""}R${" "}
            {kpis.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Descontados anúncios e contingência
          </p>
        </div>

        {/* Card 4: ROAS Global */}
        <div className="rounded-3xl border border-white/10 bg-card p-5 space-y-2 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              ROAS Médio Consolidado
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-gold">
            {kpis.roas.toFixed(2)}x
          </p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              kpis.roas >= 2
                ? "bg-emerald-500/10 text-emerald-400"
                : kpis.roas >= 1
                ? "bg-blue-500/10 text-blue-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {kpis.roas >= 2
              ? "Escala Lucrativa"
              : kpis.roas >= 1
              ? "Equilibrado / Otimização"
              : "Aguardando Vendas"}
          </span>
        </div>
      </section>

      {/* Navegação por Abas */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4 flex-wrap gap-4">
        <div className="flex rounded-full border border-border/60 bg-card p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
              activeTab === "campaigns"
                ? "bg-gold text-primary-foreground shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Minhas Campanhas ({campaignsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
              activeTab === "calculator"
                ? "bg-gold text-primary-foreground shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Calculadora de Break-Even</span>
          </button>

          <button
            onClick={() => setActiveTab("utms")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
              activeTab === "utms"
                ? "bg-gold text-primary-foreground shadow-gold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Gerador Rápido de UTMs</span>
          </button>
        </div>

        {activeTab === "campaigns" && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground w-64">
              <Search className="h-3.5 w-3.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campanha ou kit..."
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
              />
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo da Aba 1: Minhas Campanhas */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          {/* Filtros de Status */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "Todas" },
              { key: "active", label: "Ativas" },
              { key: "testing", label: "Em Teste" },
              { key: "scaling", label: "Em Escala" },
              { key: "paused", label: "Pausadas" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as StatusFilter)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition border ${
                  statusFilter === f.key
                    ? "bg-gold/15 text-gold border-gold/40 shadow-xs"
                    : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-card p-10 text-center space-y-4 shadow-xs">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold/10 text-gold mx-auto">
                <Target className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="font-display text-lg font-bold text-foreground">
                  Nenhuma campanha cadastrada ainda
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Cadastre sua primeira campanha para vincular os criativos oficiais da Vellessa, gerar seu link rastreado do Meta Ads e monitorar o lucro líquido diário.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                <PlusCircle className="h-4 w-4" /> Criar Minha Primeira Campanha
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCampaigns.map((c) => {
                const profit =
                  (c.totalCommission || 0) - (c.totalAdSpend || 0) - (c.extraCosts || 0);
                const roas =
                  (c.totalAdSpend || 0) > 0
                    ? ((c.totalCommission || 0) / c.totalAdSpend).toFixed(2)
                    : "0.00";
                const cpa =
                  (c.salesCount || 0) > 0
                    ? ((c.totalAdSpend || 0) / c.salesCount).toFixed(2)
                    : "—";

                const creativeThumb =
                  c.creativeSource === "official"
                    ? c.officialCreativeImage
                    : c.customCreative?.imageOrVideoUrl;

                return (
                  <div
                    key={c.id}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-card p-5 sm:p-6 shadow-xs hover:border-gold/30 transition space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/30 pb-4">
                      {/* Lado Esquerdo: Info da Campanha & Criativo Vinculado */}
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-muted/60 shrink-0 border border-white/10 shadow-xs">
                          {creativeThumb ? (
                            <img
                              src={creativeThumb}
                              alt={c.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full grid place-items-center text-gold text-xs font-bold">
                              {c.platform === "meta" ? "META" : "ADS"}
                            </div>
                          )}
                          <span className="absolute bottom-1 right-1 rounded-full bg-black/70 px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                            {c.platform}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-foreground">{c.name}</h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                c.status === "scaling"
                                  ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                                  : c.status === "active"
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                  : c.status === "testing"
                                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {c.status === "scaling"
                                ? "🔵 Escala"
                                : c.status === "active"
                                ? "🟢 Ativa"
                                : c.status === "testing"
                                ? "🟡 Em Teste"
                                : "⚪ Pausada"}
                            </span>
                            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/20">
                              {c.kitName} (R$ {c.commissionPerSale},00)
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="h-3.5 w-3.5 text-gold/70" />
                              {c.creativeSource === "official"
                                ? `Oficial: ${c.officialCreativeTitle || "Peça CMS"}`
                                : `Autoral: ${c.customCreative?.title || "Criativo Próprio"} (${c.customCreative?.format})`}
                            </span>
                            {c.targetAudience && (
                              <>
                                <span>·</span>
                                <span>Público: {c.targetAudience}</span>
                              </>
                            )}
                            <span>·</span>
                            <span>Orçamento: R$ {c.dailyBudget}/dia</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações Rápidas */}
                      <div className="flex items-center gap-2 self-start lg:self-center">
                        <button
                          onClick={() => setMetricCampaign(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition"
                        >
                          <PlusCircle className="h-3.5 w-3.5" /> Lançar Métricas
                        </button>
                        {c.utmLink && (
                          <button
                            onClick={() =>
                              copyText(c.utmLink!, "Link com UTM copiado com sucesso!")
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground hover:border-gold hover:text-gold transition"
                            title="Copiar Link com UTM"
                          >
                            <Copy className="h-3.5 w-3.5" /> UTM
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 bg-muted/20 text-muted-foreground hover:border-gold hover:text-gold transition"
                          title="Editar Campanha"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-border/60 bg-muted/20 text-muted-foreground hover:border-destructive hover:text-destructive transition"
                          title="Excluir Campanha"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Cockpit de Indicadores da Campanha */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="rounded-2xl border border-white/5 bg-muted/20 p-3">
                        <span className="text-[10px] text-muted-foreground">Total Gasto em Ads</span>
                        <p className="text-base font-display font-bold text-foreground">
                          R$ {c.totalAdSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-muted/20 p-3">
                        <span className="text-[10px] text-muted-foreground">Vendas Confirmadas</span>
                        <p className="text-base font-display font-bold text-emerald-400">
                          {c.salesCount} {c.salesCount === 1 ? "venda" : "vendas"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-muted/20 p-3">
                        <span className="text-[10px] text-muted-foreground">Comissões Logzz</span>
                        <p className="text-base font-display font-bold text-foreground">
                          R$ {c.totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-muted/20 p-3">
                        <span className="text-[10px] text-muted-foreground">Lucro Líquido Real</span>
                        <p
                          className={`text-base font-display font-bold ${
                            profit >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {profit >= 0 ? "+" : ""}R${" "}
                          {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/5 bg-muted/20 p-3">
                        <span className="text-[10px] text-muted-foreground">ROAS / CPA</span>
                        <p className="text-base font-display font-bold text-gold">
                          {roas}x{" "}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            (CPA: R$ {cpa})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Calculadora de Break-Even */}
      {activeTab === "calculator" && <CampaignCalculator />}

      {/* Conteúdo da Aba 3: Gerador Rápido de UTMs */}
      {activeTab === "utms" && (
        <div className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl mx-auto">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Link2 className="h-4 w-4" /> Gerador de Links com UTMs
            </span>
            <h3 className="text-xl font-bold text-foreground mt-1">
              Construtor de Links Parametrizados Logzz
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evite perder vendas por falta de rastreamento no Meta Ads. Gere parâmetros padronizados de forma imediata.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                URL da Página de Vendas ou Checkout
              </label>
              <input
                type="text"
                defaultValue="https://checkout.logzz.com.br/vellessa-serum"
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none font-mono"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Plataforma (utm_source)</label>
                <input
                  type="text"
                  defaultValue="meta"
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Campanha (utm_campaign)</label>
                <input
                  type="text"
                  defaultValue="cbo-rugas-40-aberto"
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none font-mono"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase text-emerald-400">
                Resultado do Link Formatado:
              </span>
              <p className="text-xs font-mono text-muted-foreground break-all bg-card/70 p-3 rounded-xl border border-white/5">
                https://checkout.logzz.com.br/vellessa-serum?utm_source=meta&utm_medium=paid&utm_campaign=cbo-rugas-40-aberto&src={profile.id || "afiliada"}
              </p>
              <button
                onClick={() =>
                  copyText(
                    `https://checkout.logzz.com.br/vellessa-serum?utm_source=meta&utm_medium=paid&utm_campaign=cbo-rugas-40-aberto&src=${profile.id || "afiliada"}`,
                    "Link de exemplo copiado!"
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 text-xs transition shadow-xs"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Campanha */}
      {modalOpen && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Modal de Lançamento de Métricas Diárias */}
      {metricCampaign && (
        <DailyMetricModal
          campaign={metricCampaign}
          onClose={() => setMetricCampaign(null)}
        />
      )}
    </div>
  );
}

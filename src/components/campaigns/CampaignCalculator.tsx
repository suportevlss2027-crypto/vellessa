import React, { useState, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface CampaignCalculatorProps {
  onApplyToNewCampaign?: (data: {
    kitName: string;
    commission: number;
    dailyBudget: number;
  }) => void;
}

const DEFAULT_KITS = [
  { name: "Kit 1 Frasco (Iniciante)", commission: 80, price: 147 },
  { name: "Kit 3 Frascos (Campeão de Vendas)", commission: 140, price: 247, popular: true },
  { name: "Kit 5 Frascos (Máxima Conversão)", commission: 220, price: 347 },
];

export function CampaignCalculator({ onApplyToNewCampaign }: CampaignCalculatorProps) {
  const [selectedKitIdx, setSelectedKitIdx] = useState<number>(1);
  const [customCommission, setCustomCommission] = useState<string>("140");
  const [isCustomKit, setIsCustomKit] = useState<boolean>(false);
  const [dailyBudget, setDailyBudget] = useState<number>(50);
  const [conversionRate, setConversionRate] = useState<number>(1.8); // 1.8% padrão página de vendas

  const commission = useMemo(() => {
    if (isCustomKit) {
      const parsed = parseFloat(customCommission.replace(",", "."));
      return isNaN(parsed) || parsed <= 0 ? 140 : parsed;
    }
    return DEFAULT_KITS[selectedKitIdx]?.commission || 140;
  }, [isCustomKit, customCommission, selectedKitIdx]);

  // Cálculos de Performance & Direct Response
  const calculations = useMemo(() => {
    const breakEvenCpa = commission;
    // Quantas vendas diárias para empatar
    const minSalesDaily = commission > 0 ? dailyBudget / commission : 0;
    const roundedMinSales = Math.ceil(minSalesDaily);

    // CPC Máximo viável: Taxa de Conversão * Comissão
    // Ex: 1.8% de conversão = 0.018 * R$ 140 = R$ 2.52
    const maxCpc = (conversionRate / 100) * commission;

    // Estimativas considerando cenário base: 2 vendas por dia
    const estRevenue1Sale = commission * 1;
    const estProfit1Sale = estRevenue1Sale - dailyBudget;

    const estRevenue2Sales = commission * 2;
    const estProfit2Sales = estRevenue2Sales - dailyBudget;
    const roas2Sales = dailyBudget > 0 ? estRevenue2Sales / dailyBudget : 0;

    const estRevenue3Sales = commission * 3;
    const estProfit3Sales = estRevenue3Sales - dailyBudget;
    const roas3Sales = dailyBudget > 0 ? estRevenue3Sales / dailyBudget : 0;

    // Projeção Mensal (30 dias) considerando cenário moderado (2 vendas/dia)
    const monthlySpend = dailyBudget * 30;
    const monthlyRevenue = estRevenue2Sales * 30;
    const monthlyNetProfit = monthlyRevenue - monthlySpend;

    return {
      breakEvenCpa,
      minSalesDaily: minSalesDaily.toFixed(2),
      roundedMinSales,
      maxCpc: maxCpc.toFixed(2),
      estProfit1Sale,
      estProfit2Sales,
      roas2Sales: roas2Sales.toFixed(2),
      estProfit3Sales,
      roas3Sales: roas3Sales.toFixed(2),
      monthlySpend,
      monthlyRevenue,
      monthlyNetProfit,
    };
  }, [dailyBudget, commission, conversionRate]);

  return (
    <div className="space-y-6">
      {/* Top Banner Explicativo */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-hero-gradient p-6 sm:p-8 gold-hairline shadow-soft">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <Calculator className="h-3.5 w-3.5" />
            <span>Simulador Matemático de Tráfego Pago (Meta Ads)</span>
          </div>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Calculadora de Break-Even & Viabilidade
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Descubra exatamente o <strong>CPA Limite</strong>, o <strong>CPC Máximo</strong> que você pode pagar no leilão do Facebook e quantas vendas precisa realizar para ter lucro com o Sérum Vellessa.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Painel Esquerdo: Configuração dos Parâmetros */}
        <div className="rounded-3xl border bg-card p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gold" />
              1. Selecione a Oferta / Kit da Campanha
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              A comissão da Logzz define o seu teto máximo de custo por aquisição.
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {DEFAULT_KITS.map((kit, idx) => (
              <button
                key={kit.name}
                type="button"
                onClick={() => {
                  setSelectedKitIdx(idx);
                  setIsCustomKit(false);
                }}
                className={`relative flex flex-col justify-between rounded-2xl p-4 text-left transition border ${
                  !isCustomKit && selectedKitIdx === idx
                    ? "border-gold bg-gold/10 shadow-xs"
                    : "border-border/60 bg-muted/20 hover:border-gold/40 hover:bg-muted/40"
                }`}
              >
                {kit.popular && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-gold-gradient px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                    Mais Vendido
                  </span>
                )}
                <div>
                  <p className="text-xs font-semibold text-foreground leading-snug">{kit.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Valor final: R$ {kit.price}</p>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Sua Comissão</p>
                  <p className="text-lg font-display font-bold text-gold">R$ {kit.commission},00</p>
                </div>
              </button>
            ))}
          </div>

          {/* Opção de Comissão Personalizada */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsCustomKit(!isCustomKit)}
              className="text-xs text-muted-foreground hover:text-gold transition font-medium flex items-center gap-1.5"
            >
              <span>{isCustomKit ? "▲ Usar kits padrão da Logzz" : "▼ Inserir valor de comissão personalizado"}</span>
            </button>
            {isCustomKit && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/5 p-3">
                <span className="text-xs text-muted-foreground">Comissão por Venda: R$</span>
                <input
                  type="number"
                  value={customCommission}
                  onChange={(e) => setCustomCommission(e.target.value)}
                  className="w-28 rounded-lg border bg-card px-3 py-1.5 text-sm font-bold text-gold outline-none"
                  placeholder="140"
                />
              </div>
            )}
          </div>

          <div className="border-t pt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-gold" />
                  2. Investimento Diário Planejado (Meta Ads)
                </label>
                <span className="font-display font-bold text-base text-gold">
                  R$ {dailyBudget},00 / dia
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="mt-3 w-full accent-gold h-1.5 bg-muted rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                <span>R$ 20 (Teste)</span>
                <span>R$ 100 (Validação)</span>
                <span>R$ 500 (Escala)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-gold" />
                  3. Taxa de Conversão Estimada da Página
                </label>
                <span className="font-display font-bold text-base text-foreground">
                  {conversionRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.1"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="mt-3 w-full accent-gold h-1.5 bg-muted rounded-full cursor-pointer"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Média do nicho cosmético de alta conversão: <strong>1.5% a 2.5%</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Painel Direito: Resultados & Decisor Estratégico */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-gold/30 bg-gradient-to-b from-card via-card to-gold/5 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Métricas Limite de Equilíbrio
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                Break-Even
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Card CPA Máximo */}
              <div className="rounded-2xl border border-white/10 bg-muted/30 p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  CPA Máximo (Break-Even)
                </span>
                <p className="text-2xl font-display font-bold text-emerald-400">
                  R$ {calculations.breakEvenCpa},00
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Se o custo por venda no Meta estiver abaixo deste valor, você está no lucro.
                </p>
              </div>

              {/* Card CPC Máximo */}
              <div className="rounded-2xl border border-white/10 bg-muted/30 p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  CPC Máximo Viável
                </span>
                <p className="text-2xl font-display font-bold text-gold">
                  R$ {calculations.maxCpc}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Teto de custo por clique no anúncio para pagar a taxa de conversão esperada.
                </p>
              </div>
            </div>

            {/* Vendas Diárias Necessárias */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Meta Mínima para Empatar o Dia
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Com R$ {dailyBudget}/dia investidos em anúncios
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 border border-blue-500/20">
                  {calculations.roundedMinSales} {calculations.roundedMinSales === 1 ? "venda" : "vendas"}
                </span>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  ({calculations.minSalesDaily} vds exatas)
                </p>
              </div>
            </div>

            {/* Cenários de Lucro Diário */}
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-semibold text-foreground">Simulação de Lucro Líquido Diário:</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border bg-card p-2.5 space-y-1">
                  <p className="text-[10px] text-muted-foreground">1 Venda / dia</p>
                  <p
                    className={`font-bold ${
                      calculations.estProfit1Sale >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {calculations.estProfit1Sale >= 0 ? "+" : ""}R$ {calculations.estProfit1Sale}
                  </p>
                </div>

                <div className="rounded-xl border border-gold/40 bg-gold/10 p-2.5 space-y-1 shadow-xs">
                  <p className="text-[10px] font-semibold text-gold">2 Vendas / dia (Meta)</p>
                  <p className="font-bold text-emerald-400">
                    +R$ {calculations.estProfit2Sales}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground">
                    ROAS: {calculations.roas2Sales}x
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-2.5 space-y-1">
                  <p className="text-[10px] text-muted-foreground">3 Vendas / dia</p>
                  <p className="font-bold text-emerald-400">
                    +R$ {calculations.estProfit3Sales}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground">
                    ROAS: {calculations.roas3Sales}x
                  </p>
                </div>
              </div>
            </div>

            {/* Projeção Mensal */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Projeção Mensal (30 dias)
                </span>
                <p className="text-sm font-semibold text-foreground">
                  Lucro Líquido Estimado
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Gasto: R$ {calculations.monthlySpend} · Retorno: R$ {calculations.monthlyRevenue}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-display font-bold text-emerald-400">
                +R$ {calculations.monthlyNetProfit.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dica de Direct Response */}
          <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 text-xs text-muted-foreground flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Regra de Ouro do Produtor:</strong> Se o seu anúncio no Meta Ads gastou o valor equivalente a <strong>1x o CPA de Break-Even (R$ {calculations.breakEvenCpa})</strong> sem marcar nenhuma venda ou início de finalização de compra, pause o criativo e teste um novo ângulo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

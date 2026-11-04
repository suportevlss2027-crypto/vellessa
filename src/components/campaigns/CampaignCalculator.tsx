import React, { useState, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Target,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";

interface CampaignCalculatorProps {
  onApplyToNewCampaign?: (data: {
    kitName: string;
    commission: number;
    dailyBudget: number;
  }) => void;
}

const DEFAULT_KITS = [
  { name: "Kit 1 Frasco", tag: "Iniciante", commission: 80, price: 147 },
  { name: "Kit 3 Frascos", tag: "Campeão de Vendas", commission: 140, price: 247, popular: true },
  { name: "Kit 5 Frascos", tag: "Máxima Margem", commission: 220, price: 347 },
];

export function CampaignCalculator({ onApplyToNewCampaign }: CampaignCalculatorProps) {
  const [selectedKitIdx, setSelectedKitIdx] = useState<number>(1);
  const [customCommission, setCustomCommission] = useState<string>("140");
  const [isCustomKit, setIsCustomKit] = useState<boolean>(false);
  const [dailyBudget, setDailyBudget] = useState<number>(50);
  const [conversionRate, setConversionRate] = useState<number>(1.8);

  const selectedKit = DEFAULT_KITS[selectedKitIdx];

  const commission = useMemo(() => {
    if (isCustomKit) {
      const parsed = parseFloat(customCommission.replace(",", "."));
      return isNaN(parsed) || parsed <= 0 ? 140 : parsed;
    }
    return selectedKit?.commission || 140;
  }, [isCustomKit, customCommission, selectedKit]);

  // Cálculos de Performance & Direct Response
  const calculations = useMemo(() => {
    const breakEvenCpa = commission;
    const minSalesDaily = commission > 0 ? dailyBudget / commission : 0;
    const roundedMinSales = Math.ceil(minSalesDaily);

    // CPC Máximo viável: (Taxa de Conversão / 100) * Comissão
    const maxCpc = (conversionRate / 100) * commission;

    // Cenários de Lucro Diário
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

  // Percentuais de preenchimento para os Sliders estilo Apple
  const budgetPercentage = Math.min(100, Math.max(0, ((dailyBudget - 20) / (500 - 20)) * 100));
  const conversionPercentage = Math.min(100, Math.max(0, ((conversionRate - 0.8) / (4.0 - 0.8)) * 100));

  const handleApply = () => {
    if (onApplyToNewCampaign) {
      onApplyToNewCampaign({
        kitName: isCustomKit ? "Oferta Personalizada" : selectedKit.name,
        commission,
        dailyBudget,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Explicativo — Estilo Apple Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-card via-card to-gold/10 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
              <Calculator className="h-3.5 w-3.5" />
              <span>Simulador Matemático de Viabilidade & CPA</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-display font-extrabold text-foreground tracking-tight">
              Calculadora de Break-Even & Teto de CPC
            </h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Descubra o <strong>CPA Limite</strong> e o <strong>CPC Máximo</strong> viável para pagar no leilão do Facebook sem entrar no prejuízo.
            </p>
          </div>

          {onApplyToNewCampaign && (
            <button
              onClick={handleApply}
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition self-start sm:self-center shrink-0"
            >
              <span>Usar em Nova Campanha</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Painel Esquerdo: Configuração dos Parâmetros */}
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-xs space-y-6 backdrop-blur-md">
          {/* 1. Seleção dos Kits */}
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gold" />
                1. Selecione a Oferta / Kit da Campanha
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomKit(!isCustomKit)}
                className="text-[11px] text-muted-foreground hover:text-gold transition font-medium"
              >
                {isCustomKit ? "Usar kits Logzz" : "Comissão personalizada"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              A comissão da Logzz define o seu teto máximo de custo por aquisição (CPA).
            </p>
          </div>

          {!isCustomKit ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {DEFAULT_KITS.map((kit, idx) => {
                const isSelected = selectedKitIdx === idx;
                return (
                  <button
                    key={kit.name}
                    type="button"
                    onClick={() => setSelectedKitIdx(idx)}
                    className={`relative flex flex-col justify-between rounded-2xl p-4 text-left transition-all duration-200 min-h-[120px] border ${
                      isSelected
                        ? "border-gold bg-gold/10 ring-1 ring-gold/40 shadow-xs"
                        : "border-white/10 bg-muted/20 hover:border-gold/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {kit.tag}
                        </span>
                        {kit.popular && (
                          <span className="rounded-md bg-gold-gradient px-1.5 py-0.2 text-[8px] font-extrabold text-primary-foreground uppercase shadow-xs">
                            Top
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground leading-tight">{kit.name}</p>
                      <p className="text-[10px] text-muted-foreground">Valor: R$ {kit.price}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5">
                      <span className="text-[9px] font-medium text-muted-foreground uppercase">Comissão</span>
                      <p className="text-base font-display font-extrabold text-gold">
                        R$ {kit.commission},00
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-foreground">Comissão Personalizada por Venda</span>
                <p className="text-[11px] text-muted-foreground">Insira o valor líquido recebido por cada venda na Logzz.</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-bold text-gold">R$</span>
                <input
                  type="number"
                  value={customCommission}
                  onChange={(e) => setCustomCommission(e.target.value)}
                  className="w-24 rounded-xl border border-white/10 bg-card px-3 py-1.5 text-sm font-bold text-foreground outline-none focus:border-gold font-mono"
                  placeholder="140"
                />
              </div>
            </div>
          )}

          {/* 2. Investimento Diário (Slider Híbrido Apple) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-gold" />
                2. Investimento Diário no Meta Ads
              </label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">R$</span>
                <input
                  type="number"
                  min={20}
                  max={1000}
                  step={5}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value) || 20)}
                  className="w-18 h-7 text-right font-display font-bold text-sm text-gold bg-muted/40 border border-white/10 rounded-lg px-2 outline-none focus:border-gold font-mono"
                />
                <span className="text-xs text-muted-foreground">/ dia</span>
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${budgetPercentage}%, rgba(255,255,255,0.1) ${budgetPercentage}%, rgba(255,255,255,0.1) 100%)`,
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-gold"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1.5">
                <span>R$ 20 (Teste)</span>
                <span>R$ 100 (Validação)</span>
                <span>R$ 500 (Escala)</span>
              </div>
            </div>
          </div>

          {/* 3. Taxa de Conversão Estimada (Slider Híbrido Apple) */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-gold" />
                3. Taxa de Conversão da Página de Vendas
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={conversionRate}
                  onChange={(e) => setConversionRate(Number(e.target.value) || 1.8)}
                  className="w-16 h-7 text-right font-display font-bold text-sm text-foreground bg-muted/40 border border-white/10 rounded-lg px-2 outline-none focus:border-gold font-mono"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>

            <div className="relative pt-1">
              <input
                type="range"
                min="0.8"
                max="4.0"
                step="0.1"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${conversionPercentage}%, rgba(255,255,255,0.1) ${conversionPercentage}%, rgba(255,255,255,0.1) 100%)`,
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-gold"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Média do nicho cosmético de alta conversão: <strong>1.5% a 2.5%</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Painel Direito: Resultados & Decisor Estratégico */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-gold/30 bg-gradient-to-b from-card/90 via-card/90 to-gold/5 p-6 shadow-xs space-y-5 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Métricas Limite de Equilíbrio
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gold">
                Break-Even
              </span>
            </div>

            {/* Destaque Duplo: CPA Máximo & CPC Máximo */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card CPA Máximo */}
              <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CPA Máximo (Break-Even)
                </span>
                <p className="text-2xl font-display font-extrabold text-foreground">
                  R$ {calculations.breakEvenCpa},00
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Se o custo por venda no Meta estiver abaixo deste valor, você está no lucro.
                </p>
              </div>

              {/* Card CPC Máximo */}
              <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  CPC Máximo Viável
                </span>
                <p className="text-2xl font-display font-extrabold text-gold">
                  R$ {calculations.maxCpc}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Teto de custo por clique no anúncio para pagar a taxa de conversão estimada.
                </p>
              </div>
            </div>

            {/* Meta Mínima de Vendas */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">
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
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs font-bold text-foreground">Simulação de Lucro Líquido Diário:</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/5 bg-muted/20 p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">1 Venda / dia</p>
                  <p
                    className={`font-display font-bold text-sm ${
                      calculations.estProfit1Sale >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {calculations.estProfit1Sale >= 0 ? "+" : ""}R$ {calculations.estProfit1Sale}
                  </p>
                </div>

                <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 space-y-1 shadow-xs">
                  <p className="text-[10px] font-bold text-gold">2 Vendas / dia (Meta)</p>
                  <p className="font-display font-bold text-sm text-emerald-400">
                    +R$ {calculations.estProfit2Sales}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground">
                    ROAS: {calculations.roas2Sales}x
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-muted/20 p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium">3 Vendas / dia</p>
                  <p className="font-display font-bold text-sm text-emerald-400">
                    +R$ {calculations.estProfit3Sales}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground">
                    ROAS: {calculations.roas3Sales}x
                  </p>
                </div>
              </div>
            </div>

            {/* Projeção Mensal Estilo Glassmorphism */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 to-card p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Projeção Mensal (30 dias)
                </span>
                <p className="text-xs font-bold text-foreground">
                  Lucro Líquido Estimado (Cenário Moderado)
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Gasto: R$ {calculations.monthlySpend} · Retorno: R$ {calculations.monthlyRevenue}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400">
                +R$ {calculations.monthlyNetProfit.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Dica de Direct Response — Regra de Ouro */}
          <div className="rounded-2xl border border-white/10 bg-muted/10 p-4 text-xs text-muted-foreground flex items-start gap-3">
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

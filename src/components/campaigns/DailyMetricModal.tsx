import React, { useState, useEffect } from "react";
import { X, PlusCircle, DollarSign, ShoppingCart, Sparkles, AlertCircle } from "lucide-react";
import { useAffiliateStore, type Campaign } from "@/lib/affiliate-store";
import { toast } from "sonner";

interface DailyMetricModalProps {
  campaign: Campaign;
  onClose: () => void;
}

export function DailyMetricModal({ campaign, onClose }: DailyMetricModalProps) {
  const { recordCampaignMetric } = useAffiliateStore();

  // Trava de scroll do fundo
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const [adSpend, setAdSpend] = useState<string>("");
  const [salesCount, setSalesCount] = useState<string>("");
  const [extraCosts, setExtraCosts] = useState<string>("");

  const numSpend = parseFloat(adSpend.replace(",", ".")) || 0;
  const numSales = parseInt(salesCount, 10) || 0;
  const numExtras = parseFloat(extraCosts.replace(",", ".")) || 0;

  const addedCommission = numSales * (campaign.commissionPerSale || 0);
  const netProfit = addedCommission - numSpend - numExtras;
  const roas = numSpend > 0 ? (addedCommission / numSpend).toFixed(2) : "0.00";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numSpend <= 0 && numSales <= 0 && numExtras <= 0) {
      toast.error("Informe ao menos o valor gasto ou o número de vendas realizadas.");
      return;
    }

    recordCampaignMetric(campaign.id, {
      adSpend: numSpend,
      salesCount: numSales,
      extraCosts: numExtras,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-3xl border border-white/10 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Fixo */}
        <div className="flex items-start justify-between border-b border-border/40 px-6 py-4 shrink-0 bg-card/95 backdrop-blur-sm z-10">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Lançamento Rápido de Tráfego
            </span>
            <h3 className="text-lg font-bold text-foreground">
              Registrar Resultados do Dia
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm mt-0.5">
              Campanha: <strong className="text-foreground">{campaign.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 overscroll-contain custom-scrollbar">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-gold" />
                Gasto em Anúncios no Meta Ads (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                placeholder="Ex: 54.30"
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-sm font-bold text-foreground outline-none focus:border-gold transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5 text-emerald-400" />
                Vendas Confirmadas na Logzz hoje
              </label>
              <input
                type="number"
                min="0"
                value={salesCount}
                onChange={(e) => setSalesCount(e.target.value)}
                placeholder="Ex: 2"
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-sm font-bold text-emerald-400 outline-none focus:border-gold transition"
              />
              <p className="text-[10px] text-muted-foreground font-mono">
                Comissão desta campanha: R$ {campaign.commissionPerSale.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por venda
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Custos Extras / Contingência (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={extraCosts}
                onChange={(e) => setExtraCosts(e.target.value)}
                placeholder="Ex: 10.00 (domínio, perfis, proxies)"
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2 text-xs text-foreground outline-none focus:border-gold transition"
              />
            </div>

            {/* Prévia do Resultado do Lançamento */}
            <div className="rounded-2xl border border-gold/20 bg-muted/30 p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-gold" /> Impacto Financeiro deste Lançamento:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-card p-2 border">
                  <p className="text-[10px] text-muted-foreground">Comissão</p>
                  <p className="font-bold text-emerald-400">+R$ {addedCommission}</p>
                </div>
                <div className="rounded-lg bg-card p-2 border">
                  <p className="text-[10px] text-muted-foreground">Lucro Líquido</p>
                  <p
                    className={`font-bold ${
                      netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {netProfit >= 0 ? "+" : ""}R$ {netProfit.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-card p-2 border">
                  <p className="text-[10px] text-muted-foreground">ROAS</p>
                  <p className="font-bold text-gold">{roas}x</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Fixo */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border/40 shrink-0 bg-card/95 backdrop-blur-sm z-10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              Adicionar Métricas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

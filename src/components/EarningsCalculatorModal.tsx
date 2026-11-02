import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Sparkles, TrendingUp, ArrowRight, CheckCircle2, Coins, ShieldCheck } from "lucide-react";

export interface KitOption {
  id: string;
  name: string;
  bottles: number;
  tag?: string;
  popular?: boolean;
  price: number;
  promoPrice?: number;
}

export const KITS_VELLESSA: KitOption[] = [
  {
    id: "1-frasco",
    name: "1 Frasco",
    bottles: 1,
    tag: "Individual",
    price: 197.90,
    promoPrice: 147.00,
  },
  {
    id: "2-frascos",
    name: "Kit 2 Frascos",
    bottles: 2,
    tag: "Dupla",
    price: 197.90,
    promoPrice: 177.00,
  },
  {
    id: "3-frascos",
    name: "Kit 3 Frascos",
    bottles: 3,
    tag: "★ Campeão",
    popular: true,
    price: 297.90,
    promoPrice: 197.00,
  },
  {
    id: "4-frascos",
    name: "Kit 4 Frascos (3+1)",
    bottles: 4,
    tag: "3 + 1 Frasco",
    price: 297.90,
    promoPrice: 247.00,
  },
  {
    id: "6-frascos",
    name: "Kit 6 Frascos",
    bottles: 6,
    tag: "Tratamento",
    price: 397.90,
    promoPrice: 347.00,
  },
  {
    id: "12-frascos",
    name: "Kit 12 Frascos Master",
    bottles: 12,
    tag: "✦ Maior Lucro",
    price: 697.90,
    promoPrice: 677.00,
  },
];

const COMMISSION_RATE = 0.60; // 60% de comissão direta

interface EarningsCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSignup?: () => void;
}

export function EarningsCalculatorModal({
  open,
  onOpenChange,
  onStartSignup,
}: EarningsCalculatorModalProps) {
  const [selectedKitId, setSelectedKitId] = useState<string>("3-frascos");
  const [salesPerDay, setSalesPerDay] = useState<number>(3);
  const [usePromoPrice, setUsePromoPrice] = useState<boolean>(false);

  const selectedKit = KITS_VELLESSA.find((k) => k.id === selectedKitId) || KITS_VELLESSA[2];
  const activePrice = usePromoPrice && selectedKit.promoPrice ? selectedKit.promoPrice : selectedKit.price;
  
  // Cálculos de Ganhos
  const commissionPerSale = activePrice * COMMISSION_RATE;
  const dailyEarnings = commissionPerSale * salesPerDay;
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = dailyEarnings * 365;

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleActionClick = () => {
    onOpenChange(false);
    if (onStartSignup) {
      onStartSignup();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card/95 border-gold/30 text-foreground backdrop-blur-2xl p-6 sm:p-8 shadow-2xl rounded-3xl overflow-hidden">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        <DialogHeader className="relative z-10 text-left space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-xs font-semibold text-gold w-fit">
            <Sparkles className="h-3 w-3 text-gold" />
            <span>Simulador de Lucro de Afiliadas — Vellessa</span>
          </div>
          <DialogTitle className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Calcule seus <span className="italic text-gold-gradient">ganhos reais</span> como parceira
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
            Selecione uma oferta oficial e projete sua receita diária e mensal com comissões de até 60%.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-5 space-y-5">
          {/* Seletor de Kits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Escolha a Oferta / Kit
              </span>
              {selectedKit.promoPrice && (
                <button
                  type="button"
                  onClick={() => setUsePromoPrice(!usePromoPrice)}
                  className="text-[11px] font-medium text-gold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {usePromoPrice ? "Usar Preço Padrão" : "Ver Preço Promocional"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KITS_VELLESSA.map((kit) => {
                const isSelected = kit.id === selectedKitId;
                const priceToShow = usePromoPrice && kit.promoPrice ? kit.promoPrice : kit.price;
                return (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`relative flex flex-col p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-gold bg-gold/15 shadow-md shadow-gold/10"
                        : "border-border/60 bg-surface/40 hover:border-gold/40 hover:bg-surface/70"
                    }`}
                  >
                    {kit.popular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-gold-gradient px-2 py-0.5 text-[9px] font-bold text-primary-foreground shadow-xs">
                        Mais Vendido
                      </span>
                    )}
                    <span className="text-xs font-bold text-foreground leading-tight">
                      {kit.name}
                    </span>
                    <span className="text-[11px] font-semibold text-gold mt-1">
                      {formatCurrency(priceToShow)}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Lucro: <strong className="text-foreground">{formatCurrency(priceToShow * COMMISSION_RATE)}</strong>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider de Vendas por Dia */}
          <div className="rounded-2xl border border-border/50 bg-surface/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Vendas estimadas por dia
              </span>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-0.5">
                <Flame className="h-3.5 w-3.5 text-gold" />
                <span className="text-sm font-bold text-gold">
                  {salesPerDay} {salesPerDay === 1 ? "venda" : "vendas"} / dia
                </span>
              </div>
            </div>

            <Slider
              value={[salesPerDay]}
              min={1}
              max={15}
              step={1}
              onValueChange={(val) => setSalesPerDay(val[0] || 1)}
              className="py-2"
            />

            {/* Atalhos Rápidos */}
            <div className="flex items-center justify-between mt-3 gap-1.5">
              {[1, 2, 3, 5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSalesPerDay(num)}
                  className={`flex-1 rounded-xl py-1 text-xs font-semibold transition cursor-pointer ${
                    salesPerDay === num
                      ? "bg-gold text-primary-foreground shadow-xs"
                      : "bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  {num}v
                </button>
              ))}
            </div>
          </div>

          {/* Display de Ganhos Diários e Mensais (Ouro) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card Ganho Diário */}
            <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/10 to-surface/40 p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold/90 flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-gold" />
                Ganho Diário Estimado
              </span>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-gold tracking-tight mt-1">
                {formatCurrency(dailyEarnings)}
              </p>
              <span className="text-[10px] text-muted-foreground mt-1">
                {salesPerDay} × {formatCurrency(commissionPerSale)} de comissão
              </span>
            </div>

            {/* Card Ganho Mensal */}
            <div className="rounded-2xl border border-gold/35 bg-gradient-to-br from-gold/20 to-surface/60 p-4 flex flex-col justify-between shadow-lg shadow-gold/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-gold" />
                Ganho Mensal (30 dias)
              </span>
              <p className="font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                {formatCurrency(monthlyEarnings)}
              </p>
              <span className="text-[10px] text-gold/80 font-semibold mt-1">
                ✦ Projeção Anual: {formatCurrency(yearlyEarnings)}
              </span>
            </div>
          </div>

          {/* Garantias & Botão de Conversão */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-[11px] text-foreground/70 px-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-gold" /> Comissões creditadas a cada venda
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-gold" /> Saque sem burocracia
              </span>
            </div>

            <button
              type="button"
              onClick={handleActionClick}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gold-gradient font-bold text-primary-foreground shadow-gold text-sm sm:text-base tracking-wide transition-all duration-300 hover:brightness-105 hover:scale-[1.01] cursor-pointer"
            >
              <span>Quero Começar a Lucrar Agora</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

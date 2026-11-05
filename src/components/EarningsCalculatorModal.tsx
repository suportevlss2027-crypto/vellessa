import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Sparkles, ArrowRight, Coins } from "lucide-react";

export interface KitOption {
  id: string;
  name: string;
  bottles: number;
  tag: string;
  price: number;
}

export const KITS_VELLESSA: KitOption[] = [
  { id: "1-frasco", name: "1 Frasco", bottles: 1, tag: "Individual", price: 197.90 },
  { id: "2-frascos", name: "2 Frascos", bottles: 2, tag: "Dupla", price: 197.90 },
  { id: "3-frascos", name: "3 Frascos", bottles: 3, tag: "★ Campeão", price: 297.90 },
  { id: "4-frascos", name: "4 Frascos", bottles: 4, tag: "3 + 1 Frasco", price: 297.90 },
  { id: "6-frascos", name: "6 Frascos", bottles: 6, tag: "Tratamento", price: 397.90 },
  { id: "12-frascos", name: "12 Frascos", bottles: 12, tag: "Master VIP", price: 697.90 },
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

  const selectedKit = KITS_VELLESSA.find((k) => k.id === selectedKitId) || KITS_VELLESSA[2];
  
  // Cálculos de Ganhos
  const commissionPerSale = selectedKit.price * COMMISSION_RATE;
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
      <DialogContent className="max-w-lg w-[92vw] max-h-[86vh] overflow-y-auto bg-background/95 border border-gold/30 text-foreground backdrop-blur-2xl p-5 sm:p-6 shadow-2xl rounded-3xl">
        {/* Glow suave atmosférico */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />

        <DialogHeader className="relative z-10 text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold text-gold w-fit">
            <Sparkles className="h-3 w-3 text-gold" />
            <span>Simulador de Lucratividade Oficial</span>
          </div>
          <DialogTitle className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Projete seus <span className="italic text-gold-gradient">ganhos reais</span> como parceiro(a)
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground/75 leading-relaxed">
            Selecione uma oferta oficial e simule seu retorno financeiro com 60% de comissão direta.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-3.5 space-y-3.5">
          {/* 1. Seletor de Kits em Fita de Pílulas Minimalista */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                1. Escolha o Kit da Oferta
              </span>
              <span className="text-[10px] font-semibold text-gold">
                {selectedKit.tag} · {formatCurrency(selectedKit.price)}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40">
              {KITS_VELLESSA.map((kit) => {
                const isSelected = kit.id === selectedKitId;
                return (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => setSelectedKitId(kit.id)}
                    className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gold text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground text-xs font-medium hover:bg-card/50"
                    }`}
                  >
                    <span className="block text-[11px] leading-tight whitespace-nowrap">{kit.name}</span>
                    <span className="block text-[9px] mt-0.5 opacity-85">{formatCurrency(kit.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Slider Elegante de Vendas Diárias */}
          <div className="rounded-2xl border border-border/40 bg-surface/30 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                2. Vendas estimadas por dia
              </span>
              <span className="font-display text-base font-bold text-gold">
                {salesPerDay} {salesPerDay === 1 ? "venda" : "vendas"} / dia
              </span>
            </div>

            <Slider
              value={[salesPerDay]}
              min={1}
              max={15}
              step={1}
              onValueChange={(val) => setSalesPerDay(val[0] || 1)}
              className="py-1"
            />

            <div className="flex items-center justify-between mt-2 gap-1">
              {[1, 2, 3, 5, 10, 15].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSalesPerDay(num)}
                  className={`flex-1 rounded-lg py-0.5 text-[10px] font-medium transition cursor-pointer ${
                    salesPerDay === num
                      ? "bg-gold/20 text-gold font-bold border border-gold/40"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {num}v/dia
                </button>
              ))}
            </div>
          </div>

          {/* 3. Display Unificado de Ganhos em Vidro Acetinado (Ouro) */}
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/15 to-surface/30 p-4 text-center space-y-1.5 shadow-lg shadow-black/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold/90 flex items-center justify-center gap-1">
              <Coins className="h-3 w-3 text-gold" /> Renda Mensal Projetada (30 dias)
            </span>
            <p className="font-display text-3xl sm:text-4xl font-extrabold text-gold leading-none tracking-tight">
              {formatCurrency(monthlyEarnings)}
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px] text-foreground/80 pt-1.5 border-t border-border/30">
              <span>Diário: <strong className="text-foreground">{formatCurrency(dailyEarnings)}</strong></span>
              <span className="text-border">•</span>
              <span>Lucro/venda: <strong className="text-gold">{formatCurrency(commissionPerSale)}</strong></span>
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5">
              ✦ Projeção anual em 12 meses: <strong className="text-foreground/90">{formatCurrency(yearlyEarnings)}</strong>
            </p>
          </div>

          {/* 4. Botão de Conversão Suave */}
          <button
            type="button"
            onClick={handleActionClick}
            className="group flex h-11 w-full items-center justify-center gap-2 rounded-full bg-gold-gradient font-bold text-primary-foreground shadow-gold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:brightness-105 cursor-pointer mt-1"
          >
            <span>Quero Começar a Lucrar Agora</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

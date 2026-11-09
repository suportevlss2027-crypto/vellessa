import React, { useState } from "react";
import {
  Sparkles,
  Phone,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Rocket,
  Sprout,
  DollarSign,
  HelpCircle,
  Lock,
} from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function OnboardingGateModal() {
  const { profile, completeOnboarding } = useAffiliateStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(profile.phone || "");
  const [trafficExperience, setTrafficExperience] = useState<"yes" | "no" | null>(
    (profile.trafficExperience as any) || null
  );
  // Seleção pendente da Etapa 2 (separada do estado confirmado)
  const [pendingExperience, setPendingExperience] = useState<"yes" | "no" | null>(
    (profile.trafficExperience as any) || null
  );
  const [trafficInvestment, setTrafficInvestment] = useState<string>(
    profile.trafficInvestment || ""
  );
  const [trafficWillingness, setTrafficWillingness] = useState<"yes" | "no" | null>(
    (profile.trafficWillingness as any) || null
  );
  const [trafficBudget, setTrafficBudget] = useState<string>(
    profile.trafficBudget || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formata telefone celular brasileiro: (XX) 9XXXX-XXXX
  const formatPhone = (val: string) => {
    // Extrai somente dígitos do valor atual, limitando a 11
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sempre re-aplica a máscara sobre o valor atual do input
    setPhone(formatPhone(e.target.value));
  };

  // Validação estrita do WhatsApp: 11 dígitos, DDD válido (11-99), 9º dígito = "9"
  const rawDigits = phone.replace(/\D/g, "");
  const ddd = parseInt(rawDigits.slice(0, 2), 10);
  const isPhoneValid =
    rawDigits.length === 11 &&
    ddd >= 11 &&
    ddd <= 99 &&
    rawDigits[2] === "9";

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneValid) {
      toast.error("Por favor, informe um número de WhatsApp válido com DDD (ex: 11 99999-9999).");
      return;
    }
    setStep(2);
  };

  // Etapa 2: seleciona sem avançar — botão "Continuar" confirma
  const handleSelectExperience = (exp: "yes" | "no") => {
    setPendingExperience(exp);
  };

  const handleConfirmExperience = () => {
    if (!pendingExperience) return;
    setTrafficExperience(pendingExperience);
    setStep(3);
  };

  const handleFinish = async () => {
    if (trafficExperience === "yes" && !trafficInvestment) {
      toast.error("Selecione a sua faixa de investimento mensal ou acumulada.");
      return;
    }
    if (trafficExperience === "no" && !trafficWillingness) {
      toast.error("Indique se você tem interesse em investir em tráfego pago.");
      return;
    }
    if (trafficExperience === "no" && trafficWillingness === "yes" && !trafficBudget) {
      toast.error("Selecione quanto você pretende começar investindo.");
      return;
    }

    setIsSubmitting(true);
    const ok = await completeOnboarding({
      phone,
      trafficExperience,
      trafficInvestment: trafficExperience === "yes" ? trafficInvestment : undefined,
      trafficWillingness: trafficExperience === "no" ? trafficWillingness : undefined,
      trafficBudget: trafficExperience === "no" && trafficWillingness === "yes" ? trafficBudget : undefined,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in select-none">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-gold/40 bg-card/95 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 flex flex-col max-h-[92vh]">
        {/* Glow dourado ambiente */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />

        {/* Top Header com Barra de Progresso */}
        <div className="relative z-10 border-b border-border/40 p-5 sm:p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[10px] sm:text-[11px] font-semibold text-gold">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Etapa Obrigatória de Ativação</span>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Passo {step} de 3
            </span>
          </div>

          <h2 className="mt-3 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {step === 1 && "Confirmação do WhatsApp Oficial"}
            {step === 2 && "Perfil de Tráfego Pago"}
            {step === 3 && (trafficExperience === "yes" ? "Volume de Investimento" : "Intenção de Anúncios")}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {step === 1 && "Seu número é essencial para liberação de saques, envio de comissões e suporte prioritário."}
            {step === 2 && "Ajude-nos a calibrar suas recomendações de campanhas e suporte comercial."}
            {step === 3 && (trafficExperience === "yes" ? "Selecione a faixa aproximada do seu investimento em anúncios." : "Como você pretende estruturar suas vendas como afiliado(a) Vellessa?")}
          </p>

          {/* Barra de progresso visual */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 1 ? "bg-gold-gradient shadow-gold" : "bg-muted")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 2 ? "bg-gold-gradient shadow-gold" : "bg-muted")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step >= 3 ? "bg-gold-gradient shadow-gold" : "bg-muted")} />
          </div>
        </div>

        {/* Corpo do Formulário */}
        <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-5">
          {/* ── ETAPA 1: TELEFONE / WHATSAPP ───────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Número do seu WhatsApp Pessoal / Comercial <span className="text-gold">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gold">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    autoFocus
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="w-full rounded-2xl border border-border/60 bg-muted/30 py-3.5 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition focus:border-gold focus:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-gold"
                  />
                  {isPhoneValid && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-gold shrink-0" />
                  <span>Seus dados são confidenciais e protegidos pela política de privacidade Vellessa.</span>
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 text-xs text-emerald-300/90 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O cadastro do número correto é <strong>obrigatório</strong> para validação de comissões na plataforma e contato pelo seu gerente de contas.
                </span>
              </div>

              <button
                type="submit"
                disabled={!isPhoneValid}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gold-gradient py-3.5 text-sm font-bold text-primary-foreground shadow-gold hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                <span>Avançar para o Perfil de Tráfego</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* ── ETAPA 2: EXPERIÊNCIA COM TRÁFEGO PAGO ───────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Selecione a sua experiência atual com anúncios:
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Opção SIM */}
                <button
                  type="button"
                  onClick={() => handleSelectExperience("yes")}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border p-4 sm:p-5 text-left transition duration-200 cursor-pointer group",
                    pendingExperience === "yes"
                      ? "border-gold bg-gold/15 shadow-gold"
                      : "border-border/60 bg-muted/20 hover:border-gold/50 hover:bg-muted/40"
                  )}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-xs group-hover:scale-105 transition">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Sim, já invisto
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Já anunciei ou mantenho campanhas ativas no Meta Ads, Google Ads ou TikTok.
                    </p>
                  </div>
                  {pendingExperience === "yes" ? (
                    <span className="text-[11px] font-semibold text-gold mt-auto flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selecionado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gold mt-auto flex items-center gap-1">
                      Selecionar perfil com experiência →
                    </span>
                  )}
                </button>

                {/* Opção NÃO */}
                <button
                  type="button"
                  onClick={() => handleSelectExperience("no")}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-2xl border p-4 sm:p-5 text-left transition duration-200 cursor-pointer group",
                    pendingExperience === "no"
                      ? "border-emerald-500/60 bg-emerald-950/20 shadow-sm"
                      : "border-border/60 bg-muted/20 hover:border-gold/50 hover:bg-muted/40"
                  )}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-105 transition">
                    <Sprout className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      Não, nunca investi
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Estou começando agora ou ainda pretendo aprender como anunciar online.
                    </p>
                  </div>
                  {pendingExperience === "no" ? (
                    <span className="text-[11px] font-semibold text-emerald-400 mt-auto flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selecionado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-400 mt-auto flex items-center gap-1">
                      Selecionar perfil iniciante →
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-gold transition inline-flex items-center gap-1 cursor-pointer"
                >
                  ← Voltar para alterar o telefone
                </button>
                <button
                  type="button"
                  disabled={!pendingExperience}
                  onClick={handleConfirmExperience}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-6 py-3 text-sm font-bold text-primary-foreground shadow-gold hover:brightness-105 active:scale-[0.99] transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <span>Continuar</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 3A: RAMO "SIM" (QUANTO JÁ INVESTE) ────────────────────── */}
          {step === 3 && trafficExperience === "yes" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Qual é a sua faixa de investimento mensal ou acumulada? <span className="text-gold">*</span>
              </label>

              <div className="space-y-2">
                {[
                  { value: "Ate R$ 500 / mes", label: "Iniciante no Tráfego", sub: "Até R$ 500 / mês investidos" },
                  { value: "R$ 500 a R$ 2.000 / mes", label: "Campanhas Consistentes", sub: "R$ 500 a R$ 2.000 / mês" },
                  { value: "R$ 2.000 a R$ 5.000 / mes", label: "Média Escala", sub: "R$ 2.000 a R$ 5.000 / mês" },
                  { value: "R$ 5.000 a R$ 10.000 / mes", label: "Alta Conversão", sub: "R$ 5.000 a R$ 10.000 / mês" },
                  { value: "Mais de R$ 10.000 / mes", label: "Escala Pesada / Profissional", sub: "Mais de R$ 10.000 / mês" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTrafficInvestment(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition cursor-pointer",
                      trafficInvestment === opt.value
                        ? "border-gold bg-gold/15 shadow-gold text-foreground font-semibold"
                        : "border-border/50 bg-muted/20 hover:border-gold/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.sub}</p>
                    </div>
                    {trafficInvestment === opt.value && (
                      <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-muted-foreground hover:text-gold transition cursor-pointer"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  disabled={!trafficInvestment || isSubmitting}
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-6 py-3 text-sm font-bold text-primary-foreground shadow-gold hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <span>{isSubmitting ? "Ativando Perfil..." : "Concluir e Acessar Meu Painel"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── ETAPA 3B: RAMO "NÃO" (DISPOSIÇÃO A INVESTIR) ────────────────── */}
          {step === 3 && trafficExperience === "no" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Você está disposto(a) a investir em anúncios para acelerar suas vendas? <span className="text-gold">*</span>
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setTrafficWillingness("yes")}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition cursor-pointer",
                      trafficWillingness === "yes"
                        ? "border-gold bg-gold/15 shadow-gold text-foreground font-semibold"
                        : "border-border/50 bg-muted/20 hover:border-gold/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <p className="text-xs font-bold text-gold uppercase tracking-wider">Sim</p>
                    <p className="text-sm font-semibold mt-0.5">Pretendo começar a investir</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTrafficWillingness("no");
                      setTrafficBudget("Foco 100% Orgânico");
                    }}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition cursor-pointer",
                      trafficWillingness === "no"
                        ? "border-gold bg-gold/15 shadow-gold text-foreground font-semibold"
                        : "border-border/50 bg-muted/20 hover:border-gold/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Não</p>
                    <p className="text-sm font-semibold mt-0.5">Vou focar 100% no orgânico</p>
                  </button>
                </div>
              </div>

              {/* Se disposto a investir: quanto pretende investir */}
              {trafficWillingness === "yes" && (
                <div className="space-y-2 pt-2 animate-in fade-in">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Qual valor você pretende separar para iniciar seus testes? <span className="text-gold">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      "R$ 100 a R$ 300 (Testes iniciais)",
                      "R$ 300 a R$ 1.000 (Validação consistente)",
                      "R$ 1.000 a R$ 3.000 (Escala moderada)",
                      "Mais de R$ 3.000 (Aporte forte)",
                      "Ainda estou definindo o orçamento",
                    ].map((budget) => (
                      <button
                        key={budget}
                        type="button"
                        onClick={() => setTrafficBudget(budget)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition cursor-pointer",
                          trafficBudget === budget
                            ? "border-gold bg-gold/15 text-gold font-semibold"
                            : "border-border/40 bg-muted/20 hover:border-gold/30 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{budget}</span>
                        {trafficBudget === budget && <CheckCircle2 className="h-3.5 w-3.5 text-gold shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-muted-foreground hover:text-gold transition cursor-pointer"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  disabled={
                    !trafficWillingness ||
                    (trafficWillingness === "yes" && !trafficBudget) ||
                    isSubmitting
                  }
                  onClick={handleFinish}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gold-gradient px-6 py-3 text-sm font-bold text-primary-foreground shadow-gold hover:brightness-105 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <span>{isSubmitting ? "Ativando Perfil..." : "Concluir e Acessar Meu Painel"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

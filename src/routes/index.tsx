import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Calculator, Lock, Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/AppShell";
import { images } from "@/data/content";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { EarningsCalculatorModal } from "@/components/EarningsCalculatorModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar — Vellessa Afiliados" },
      { name: "description", content: "Área exclusiva de membros para afiliados Vellessa: aulas, criativos e materiais." },
      { property: "og:title", content: "Vellessa Afiliados" },
      { property: "og:description", content: "Área exclusiva de membros para afiliados Vellessa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { login, signUp, resetPassword, authLoading } = useAffiliateStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      toast.error("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("Por favor, informe seu nome completo.");
        return;
      }
      const success = await signUp(email, password, name);
      if (success) {
        setMode("login");
      }
      return;
    }

    // Login mode
    const ok = await login(email, password);
    if (ok) {
      navigate({ to: "/painel" });
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Digite seu e-mail no campo acima para redefinir a senha.");
      return;
    }
    await resetPassword(email);
  };

  return (
    <div className="grid min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Vitrine Editorial de Luxo (Lado Esquerdo) — Zero-Scroll Perfeito */}
      <div className="relative hidden lg:flex flex-col justify-between border-r border-border/40 bg-surface/30 px-6 py-4 xl:px-10 xl:py-5 pb-5 xl:pb-6 h-full overflow-hidden">
        {/* Glow dourado suave de estúdio */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-6 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

        {/* Topo: Posicionamento de Marca */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[11px] font-semibold text-gold shadow-xs">
            <Sparkles className="h-3 w-3 text-gold" />
            <span>Portal Oficial de Afiliadas & Gestão</span>
          </div>
          <h2 className="mt-2 font-display text-2xl xl:text-3xl 2xl:text-4xl font-bold leading-tight tracking-tight text-foreground">
            A arte de transformar beleza em{" "}
            <span className="italic text-gold-gradient">resultados extraordinários.</span>
          </h2>
          <p className="mt-1.5 text-xs text-foreground/80 font-normal leading-relaxed whitespace-nowrap">
            Acesse criativos validados de alta conversão, comissões de até 60% e suporte exclusivo.
          </p>
        </div>

        {/* Centro: Vitrine Cinematográfica com Métricas Estratégicas ao Lado (Zero-Scroll Absoluto) */}
        <div className="relative z-10 my-auto w-full py-1">
          {/* Halo Dourado Atmosférico de Fundo */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-center gap-5 xl:gap-8 max-w-lg mx-auto w-full">
            {/* Lado 1: Vídeo Cinematográfico do Sérum */}
            <div className="relative shrink-0 w-[230px] sm:w-[255px] xl:w-[290px] aspect-[3/4] flex items-center justify-center transition duration-700 hover:scale-[1.015]">
              {/* Brilho radial acolhedor atrás dos frascos */}
              <div className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.80_0.12_82/0.22)_0%,transparent_70%)]" />
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/videos/vellessa-serum-poster.jpg"
                className="h-full w-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_95%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_95%)]"
              >
                <source src="/videos/vellessa-serum-hero.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Lado 2: Pilares Estratégicos ao Lado do Vídeo — Inline Compacto */}
            <div className="shrink-0 flex flex-col justify-center gap-2.5 text-left border-l border-border/40 pl-5 xl:pl-6">
              {[
                { label: "Criativos Prontos", value: "Alta Conversão" },
                { label: "Comissões", value: "Até 60%" },
                { label: "Suporte", value: "Exclusivo" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-gold text-[11px]">✦</span>
                  <span className="text-[11px] xl:text-[12px] font-semibold text-foreground/90">{label}</span>
                  <span className="text-foreground/30 text-[10px]">·</span>
                  <span className="text-[11px] xl:text-[12px] font-bold text-gold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Micro-Gatilho Simulador de Lucros (Suave & Alta Joalheria) */}
        <div className="relative z-10 flex justify-center py-1">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(true)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/5 hover:bg-gold/15 px-3 py-1 text-[11px] font-medium text-gold/90 transition-all duration-300 hover:scale-[1.01] hover:text-gold cursor-pointer"
          >
            <Calculator className="h-3 w-3 text-gold/80" />
            <span>Simular ganhos estimados como afiliada</span>
            <ArrowUpRight className="h-3 w-3 text-gold/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Base: Rodapé Unificado */}
        <div className="relative z-10 flex items-center justify-center gap-1.5 border-t border-border/40 pt-2 pb-1 text-[10px] text-muted-foreground/70 font-medium">
          <span>Portal Oficial Vellessa Cosméticos</span>
          <span className="text-muted-foreground/30">·</span>
          <span>Tecnologia &amp; Gestão Segura</span>
          <span className="text-muted-foreground/30">·</span>
          <span>© 2026 Vellessa</span>
        </div>
      </div>

      {/* Formulário de Acesso (Lado Direito) — Zero-Scroll Garantido */}
      <div className="relative flex flex-col justify-between px-6 py-4 xl:py-6 sm:px-10 max-w-md mx-auto w-full h-full lg:overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <Logo />
        </div>

        {/* Form Center */}
        <div className="my-auto w-full py-2">
          {/* Alternador Entrar / Criar Conta */}
          <div className="mb-3.5 flex rounded-full border border-border/60 bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-1.5 text-xs sm:text-sm font-bold transition ${
                mode === "login"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-1.5 text-xs sm:text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Bem-vinda de volta" : "Cadastre-se na Vellessa"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-foreground/75 leading-relaxed">
            {mode === "login"
              ? "Insira seus dados para acessar a área de membros."
              : "Preencha seus dados para receber seu link e começar a divulgar."}
          </p>

          <form className="mt-3.5 space-y-2.5 sm:space-y-3" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <Field
                icon={<User className="h-4 w-4" />}
                label="Nome completo"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            )}

            <Field
              icon={<Mail className="h-4 w-4" />}
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />

            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-foreground/80 font-medium cursor-pointer">
                  <input type="checkbox" className="accent-[var(--gold)]" defaultChecked /> Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-gold hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            <button
              disabled={authLoading}
              className="group mt-2.5 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-bold text-primary-foreground shadow-gold text-sm sm:text-base tracking-wide transition hover:brightness-105 disabled:opacity-60"
            >
              {authLoading ? (
                "Aguarde..."
              ) : (
                <>
                  {mode === "login" ? "Entrar na plataforma" : "Criar minha conta"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <p className="mt-3.5 text-center text-xs sm:text-sm text-foreground/75">
            {mode === "login" ? "Ainda não tem cadastro? " : "Já tem uma conta? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-bold text-gold hover:underline"
            >
              {mode === "login" ? "Cadastre-se aqui" : "Faça login"}
            </button>
          </p>
        </div>

        {/* Rodapé Fixo na Base com Folga */}
        <p className="text-center text-xs text-foreground/60 py-2">
          © 2026 Vellessa. Todos os direitos reservados.
        </p>
      </div>

      {/* Modal Interativo da Calculadora de Afiliadas Vellessa */}
      <EarningsCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
        onStartSignup={() => setMode("signup")}
      />
    </div>
  );
}

function Field({
  icon,
  label,
  ...props
}: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs sm:text-sm font-semibold text-foreground/90">{label}</span>
      <span className="relative block">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          {...props}
          className="h-11 sm:h-12 w-full rounded-xl border border-border/70 bg-card/70 pl-10 pr-3.5 text-sm font-medium text-foreground outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted-foreground/60"
        />
      </span>
    </label>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/AppShell";
import { images } from "@/data/content";
import { useAffiliateStore } from "@/lib/affiliate-store";

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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Vitrine Editorial de Luxo (Lado Esquerdo) */}
      <div className="relative hidden lg:flex flex-col justify-between border-r border-border/40 bg-surface/30 px-6 py-6 xl:px-12 xl:py-8 min-h-screen">
        {/* Glow dourado suave de estúdio */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-6 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

        {/* Topo: Posicionamento de Marca */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold text-gold shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Portal Oficial de Afiliadas & Gestão</span>
          </div>
          <h2 className="mt-3 font-display text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-[1.15] tracking-tight text-foreground">
            A arte de transformar beleza em{" "}
            <span className="italic text-gold-gradient">resultados extraordinários.</span>
          </h2>
          <p className="mt-2.5 text-sm xl:text-base text-foreground/80 font-normal leading-relaxed max-w-lg">
            Tenha em mãos criativos prontos de alta conversão, suporte dedicado, links com comissões de até 60% e treinamentos práticos.
          </p>
        </div>

        {/* Centro: Vitrine Cinematográfica Escultural & Ampla (Zero Caixas / Pura Tipografia) */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 xl:py-4 w-full">
          {/* Halo Dourado Atmosférico de Fundo */}
          <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-gold/15 blur-3xl" />

          {/* Vídeo Cinematográfico Amplo (Aspect 3/4 com Enquadramento Generoso e Foco no Sérum) */}
          <div className="relative w-full max-w-[300px] sm:max-w-[340px] xl:max-w-[380px] aspect-[3/4] flex items-center justify-center transition duration-700 hover:scale-[1.015]">
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

          {/* Métricas Flutuantes de Alto Impacto (Apenas as Letras, Zero Caixas, Centralizadas com Margem de Segurança) */}
          <div className="mt-4 flex items-center justify-center gap-6 sm:gap-8 xl:gap-12 text-center w-full max-w-lg mx-auto">
            <div className="flex flex-col items-center">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-gold/80">
                Lucro Máximo
              </span>
              <span className="font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold text-gold leading-tight mt-0.5">
                R$ 406<span className="text-lg xl:text-xl font-bold">,20</span>
              </span>
              <span className="text-[11px] xl:text-xs text-foreground/80 font-medium">
                por venda Kit Master
              </span>
            </div>

            <div className="h-10 w-px bg-border/50" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-gold/80">
                Comissão
              </span>
              <span className="font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold text-foreground leading-tight mt-0.5">
                Até 60%
              </span>
              <span className="text-[11px] xl:text-xs text-foreground/80 font-medium">
                comissão direta
              </span>
            </div>

            <div className="h-10 w-px bg-border/50" />

            <div className="flex flex-col items-center">
              <span className="text-[10px] xl:text-xs font-bold uppercase tracking-widest text-gold/80">
                Esteira
              </span>
              <span className="font-display text-2xl sm:text-3xl xl:text-4xl font-extrabold text-foreground leading-tight mt-0.5">
                6 Kits
              </span>
              <span className="text-[11px] xl:text-xs text-foreground/80 font-medium">
                R$ 99 até R$ 677
              </span>
            </div>
          </div>
        </div>

        {/* Base: Linha Editorial de Diferenciais (Sem Repetição) */}
        <div className="relative z-10 flex items-center justify-between border-t border-border/40 pt-4 pb-2 text-xs text-foreground/75 font-medium">
          <span className="flex items-center gap-1.5"><span className="text-gold">✦</span> Criativos prontos de alta conversão</span>
          <span className="flex items-center gap-1.5"><span className="text-gold">✦</span> Suporte dedicado às afiliadas</span>
          <span className="flex items-center gap-1.5"><span className="text-gold">✦</span> Repasses rápidos e seguros</span>
        </div>
      </div>

      {/* Formulário de Acesso (Lado Direito) */}
      <div className="relative flex flex-col justify-between min-h-screen px-6 py-6 sm:px-10 max-w-md mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <Logo />
        </div>

        {/* Form Center */}
        <div className="my-auto w-full py-6">
          {/* Alternador Entrar / Criar Conta */}
          <div className="mb-5 flex rounded-full border border-border/60 bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition ${
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
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {mode === "login" ? "Bem-vinda de volta" : "Cadastre-se na Vellessa"}
          </h1>
          <p className="mt-2 text-sm text-foreground/75 leading-relaxed">
            {mode === "login"
              ? "Insira seus dados para acessar a área de membros."
              : "Preencha seus dados para receber seu link e começar a divulgar."}
          </p>

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit}>
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
              <div className="flex items-center justify-between text-xs pt-1">
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
              className="group mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-bold text-primary-foreground shadow-gold text-sm sm:text-base tracking-wide transition hover:brightness-105 disabled:opacity-60"
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

          <p className="mt-5 text-center text-xs sm:text-sm text-foreground/75">
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
        <p className="text-center text-xs text-foreground/60 py-4">
          © 2026 Vellessa. Todos os direitos reservados.
        </p>
      </div>
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

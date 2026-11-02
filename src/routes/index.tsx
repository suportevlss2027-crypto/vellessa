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
    <div className="grid min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden lg:grid-cols-[1.1fr_1fr] bg-background">
      {/* Vitrine Editorial de Luxo (Lado Esquerdo) — Zero-Scroll Garantido */}
      <div className="relative hidden lg:flex flex-col justify-between border-r border-border/40 bg-surface/30 px-6 py-4 xl:px-10 xl:py-6 overflow-hidden">
        {/* Glow dourado suave de estúdio */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-6 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

        {/* Topo: Posicionamento de Marca */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-0.5 text-[11px] font-semibold text-gold shadow-xs">
            <Sparkles className="h-3 w-3" />
            <span>Portal Oficial de Afiliadas & Gestão</span>
          </div>
          <h2 className="mt-2 font-display text-2xl xl:text-4xl font-semibold leading-tight tracking-tight">
            A arte de transformar beleza em{" "}
            <span className="italic text-gold-gradient">resultados extraordinários.</span>
          </h2>
          <p className="mt-1.5 text-xs xl:text-sm text-muted-foreground max-w-md leading-relaxed">
            Tenha em mãos criativos prontos de alta conversão, suporte dedicado, links com comissões de até 60% e treinamentos práticos.
          </p>
        </div>

        {/* Centro: Vitrine Flutuante do Produto */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2 xl:py-3">
          {/* Halo Dourado Suave */}
          <div className="pointer-events-none absolute h-48 w-48 rounded-full bg-gold/20 blur-2xl" />
          
          <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-card/50 p-2 shadow-2xl shadow-gold/15 backdrop-blur-md max-w-[240px] xl:max-w-[270px] w-full transition duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-gold/25 group">
            <div className="overflow-hidden rounded-xl bg-black/60 aspect-square flex items-center justify-center">
              <img
                src={images.serumFloating || images.serum}
                alt="Sérum Vellessa"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Sérum Facial Vellessa</p>
                <p className="text-[10px] text-muted-foreground">Fórmula Exclusiva · 30ml</p>
              </div>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                Até 60% comissão
              </span>
            </div>
          </div>
        </div>

        {/* Base: 3 Pilares com Folga Garantida */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-border/40 pt-2.5 pb-2 text-[10px] xl:text-[11px]">
          <div>
            <p className="font-semibold text-foreground">Aulas Práticas</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Do anúncio à escala</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Criativos Oficiais</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Vídeos e copys validadas</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Alta Retenção</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Recompra acelerada real</p>
          </div>
        </div>
      </div>

      {/* Formulário de Acesso (Lado Direito) — Zero Scroll */}
      <div className="relative flex flex-col justify-between h-full px-6 py-4 xl:py-6 sm:px-10 max-w-md mx-auto w-full">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <Logo />
        </div>

        {/* Form Center */}
        <div className="my-auto w-full py-2">
          {/* Alternador Entrar / Criar Conta */}
          <div className="mb-3.5 flex rounded-full border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
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
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition ${
                mode === "signup"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {mode === "login" ? "Bem-vinda de volta" : "Cadastre-se na Vellessa"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login"
              ? "Insira seus dados para acessar a área de membros."
              : "Preencha seus dados para receber seu link e começar a divulgar."}
          </p>

          <form className="mt-4 space-y-2.5" onSubmit={handleSubmit}>
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
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="accent-[var(--gold)]" defaultChecked /> Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-gold hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            )}

            <button
              disabled={authLoading}
              className="group mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold text-sm transition hover:brightness-105 disabled:opacity-60"
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

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {mode === "login" ? "Ainda não tem cadastro? " : "Já tem uma conta? "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-gold hover:underline"
            >
              {mode === "login" ? "Cadastre-se aqui" : "Faça login"}
            </button>
          </p>
        </div>

        {/* Rodapé Fixo na Base com Folga */}
        <p className="text-center text-[11px] text-muted-foreground pb-2">
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
      <span className="mb-1 block text-xs font-medium text-foreground">{label}</span>
      <span className="relative block">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          {...props}
          className="h-10 sm:h-11 w-full rounded-xl border bg-card/60 pl-10 pr-3.5 text-xs sm:text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20 placeholder:text-muted-foreground/50"
        />
      </span>
    </label>
  );
}

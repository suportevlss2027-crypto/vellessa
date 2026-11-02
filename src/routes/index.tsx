import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { Logo, ThemeToggle } from "@/components/AppShell";
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
      // Se for admin, pode ir para o admin ou painel
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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <img
          src={images.serum}
          alt="Sérum Vellessa"
          className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-multiply dark:opacity-60 dark:mix-blend-normal"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Plataforma de Afiliadas & Gestão</p>
          <h2 className="mt-3 text-5xl font-semibold leading-[1.05]">
            Venda luxo.<br />
            <span className="italic text-gold-gradient">Viva de beleza.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Acesse seus links de afiliada, aulas em alta resolução, criativos prontos e materiais oficiais da marca.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="mb-6 flex rounded-full border bg-card p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
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
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                mode === "signup"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold">
            {mode === "login" ? "Bem-vinda de volta" : "Cadastre-se na Vellessa"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Insira seus dados para acessar a área de membros."
              : "Preencha seus dados para receber seu link e começar a divulgar."}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
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
              <div className="flex items-center justify-between text-sm">
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
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60"
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

          <p className="mt-8 text-center text-sm text-muted-foreground">
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

        <p className="text-center text-xs text-muted-foreground">© 2026 Vellessa. Todos os direitos reservados.</p>
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
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <span className="relative block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <input
          {...props}
          className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 placeholder:text-muted-foreground/60"
        />
      </span>
    </label>
  );
}

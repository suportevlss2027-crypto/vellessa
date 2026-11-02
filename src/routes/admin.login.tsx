import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, KeyRound, Lock, Mail, Shield, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Logo, ThemeToggle } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acesso Administrativo — Vellessa Central" },
      { name: "description", content: "Portal de gestão executiva para produtores da Vellessa." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, adminSignUp, authLoading, isAuthenticated, isAdmin } = useAffiliateStore();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");

  // Se já for admin autenticado, redireciona diretamente para o painel
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate({ to: "/admin" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail de administrador válido.");
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
      const ok = await adminSignUp({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        masterKey: masterKey.trim(),
      });
      if (ok) {
        navigate({ to: "/admin" });
      }
      return;
    }

    // Modo Login
    const ok = await adminLogin(email, password);
    if (ok) {
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-surface px-6 py-8 sm:px-12">
      {/* Top Bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block h-4 w-px bg-border" />
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[11px] font-semibold text-gold">
            <Shield className="h-3 w-3" />
            Central de Gestão
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Form Center */}
      <main className="mx-auto my-auto w-full max-w-md py-8">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 md:p-10 shadow-soft">
          {/* Top Gold Badge */}
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient shadow-gold mb-6">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>

          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Acesso Restrito ao Produtor
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {mode === "login" ? "Painel Administrativo" : "Criar Conta de Gestão"}
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {mode === "login"
                ? "Insira suas credenciais de gestão para gerenciar cursos, criativos, materiais e afiliados."
                : "Cadastre-se como Produtor Titular ou Gerente Oficial da marca Vellessa."}
            </p>
          </div>

          {/* Alternador de Modos (Entrar / Cadastrar) */}
          <div className="mt-6 flex rounded-full border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                mode === "login"
                  ? "bg-gold-gradient text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Acessar Painel
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
              Cadastrar Produtor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-foreground">
                  Nome Completo
                </span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="h-12 w-full rounded-xl border bg-muted/30 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-ring/15"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                E-mail do Administrador
              </span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vellessa.com"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-xl border bg-muted/30 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-ring/15"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                Senha de Acesso
              </span>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  className="h-12 w-full rounded-xl border bg-muted/30 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-ring/15"
                />
              </div>
            </label>

            {mode === "signup" && (
              <label className="block">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    Chave Mestre de Segurança
                  </span>
                  <span className="text-[10px] text-gold font-medium">Opcional no 1º acesso</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="VELLESSA-MASTER-2026"
                    className="h-12 w-full rounded-xl border bg-muted/30 pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-ring/15 font-mono text-xs"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                  No 1º acesso ao sistema, a chave é opcional. Para novos gerentes, utilize a chave de segurança.
                </p>
              </label>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60 text-sm"
            >
              {authLoading ? (
                "Processando..."
              ) : (
                <>
                  {mode === "login" ? "Entrar na Central de Gestão" : "Criar Conta de Administrador"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/40 p-3 text-center text-[11px] text-muted-foreground leading-relaxed">
            Área de segurança monitorada. Contas de afiliadas não possuem permissão de acesso a este painel.
          </div>
        </div>

        {/* Back Link to Affiliate Portal */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-gold transition inline-flex items-center gap-1"
          >
            ← Voltar para a Área de Afiliadas (Login de Alunas)
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-5xl text-center text-xs text-muted-foreground">
        © 2026 Vellessa Central. Todos os direitos reservados.
      </footer>
    </div>
  );
}

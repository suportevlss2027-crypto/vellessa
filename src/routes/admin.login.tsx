import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Lock, Mail, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acesso Administrativo — Vellessa Central" },
      { name: "description", content: "Portal de gestão executiva para o titular e administradores da Vellessa." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, authLoading, isAuthenticated, isAdmin } = useAffiliateStore();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

    const ok = await adminLogin(email, password);
    if (ok) {
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="relative flex min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden flex-col justify-between bg-background px-6 py-4 sm:px-12">
      {/* Top Bar */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block h-4 w-px bg-border" />
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[11px] font-semibold text-gold">
            <Shield className="h-3 w-3" />
            Central de Gestão Executiva
          </span>
        </div>
      </header>

      {/* Main Form Center */}
      <main className="mx-auto my-auto w-full max-w-md py-4">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-6 md:p-8 shadow-soft">
          {/* Top Gold Badge */}
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold-gradient shadow-gold mb-4">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>

          <div className="text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
              Acesso Restrito ao Titular & Gestão
            </span>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Insira suas credenciais autorizadas para gerenciar cursos, criativos, materiais e afiliadas da operação.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-foreground">
                E-mail Administrativo
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
                  className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 placeholder:text-muted-foreground/60"
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
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border bg-background pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 placeholder:text-muted-foreground/60"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={authLoading}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-60 text-sm"
            >
              {authLoading ? (
                "Verificando permissões..."
              ) : (
                <>
                  Entrar na Central de Gestão
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-gold/20 bg-gold/5 p-3.5 text-center text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-gold">Governança Vellessa:</span> Novos administradores são nomeados exclusivamente pelo Titular. O auto-cadastramento público está permanentemente desativado.
          </div>
        </div>

        {/* Back Link to Affiliate Portal */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-gold transition inline-flex items-center gap-1"
          >
            ← Voltar para o Portal de Afiliadas (Login de Alunas)
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

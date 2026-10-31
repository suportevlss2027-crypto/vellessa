import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
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
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { login } = useAffiliateStore();
  const [email, setEmail] = useState("mariana@email.com");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    if (!password.trim() || password.length < 4) {
      toast.error("Por favor, insira uma senha válida.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      login(email.trim());
      setLoading(false);
      navigate({ to: "/painel" });
    }, 400);
  };

  const handleForgotPassword = () => {
    toast.info("Instruções de redefinição enviadas para seu e-mail cadastrado.");
  };

  const handleRequestAccess = () => {
    toast.info("Inscrições abertas! Entre em contato com o suporte oficial Vellessa no WhatsApp.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <img
          src={images.serum}
          alt="Sérum Vellessa"
          className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-multiply dark:opacity-60 dark:mix-blend-normal"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Programa de Afiliados</p>
          <h2 className="mt-3 text-5xl font-semibold leading-[1.05]">
            Venda luxo.<br />
            <span className="italic text-gold-gradient">Viva de beleza.</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Tudo que você precisa para vender o Sérum Vellessa com elegância e alta conversão — em um só lugar.
          </p>
        </div>
      </div>

      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-4xl font-semibold">Bem-vinda de volta</h1>
          <p className="mt-2 text-muted-foreground">Acesse sua área exclusiva de membros.</p>
          <form className="mt-10 space-y-4" onSubmit={handleSubmit}>
            <Field
              icon={<Mail className="h-4 w-4" />}
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
            <Field
              icon={<Lock className="h-4 w-4" />}
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
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
            <button
              disabled={loading}
              className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-70"
            >
              {loading ? (
                "Acessando..."
              ) : (
                <>
                  Entrar na plataforma <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ainda não é afiliada?{" "}
            <button
              type="button"
              onClick={handleRequestAccess}
              className="font-medium text-gold hover:underline"
            >
              Solicite acesso
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
          className="h-12 w-full rounded-xl border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-ring/15"
        />
      </span>
    </label>
  );
}

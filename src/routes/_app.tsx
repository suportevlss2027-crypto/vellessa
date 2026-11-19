import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, authLoading } = useAffiliateStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  // QA-10: Tela de carregamento de alto padrão visual (evita flash de tela em branco)
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-gradient shadow-gold animate-pulse">
            <span className="font-sans text-xl font-extrabold text-primary-foreground tracking-tight">V</span>
          </div>
          <div className="flex flex-col items-center leading-none">
            <span className="font-sans text-sm font-black tracking-[0.24em] text-foreground">VELLESSA</span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.35em] text-gold/90">AFILIADOS</span>
          </div>
          <div className="h-1 w-24 overflow-hidden rounded-full bg-card/80 mt-1">
            <div className="h-full w-full bg-gold-gradient animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <AppShell />;
}

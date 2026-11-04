import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell, BookOpen, ChevronsLeft, Crown, Home, Image, Link2, LogOut, Search, Shield, Sparkles, TrendingUp, Users,
} from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { NotificationsPopover } from "./NotificationsPopover";

const nav = [
  { to: "/painel", label: "Início", icon: Home },
  { to: "/aulas", label: "Aulas", icon: BookOpen },
  { to: "/campanhas", label: "Gestor de Tráfego", icon: TrendingUp },
  { to: "/criativos", label: "Criativos", icon: Image },
  { to: "/materiais", label: "Materiais", icon: Link2 },
  { to: "/comunidade", label: "Comunidade", icon: Users },
] as const;

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient shadow-gold">
        <span className="font-display text-lg font-semibold text-primary-foreground">V</span>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-xl font-semibold tracking-[0.18em]">VELLESSA</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Afiliados</div>
        </div>
      )}
    </div>
  );
}

export function ThemeToggle() {
  return null;
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { profile, unreadAnnouncementsCount, logout, isAdmin, isTitular } = useAffiliateStore();
  const navigate = useNavigate();

  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const initials = profile.name
    ? profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("")
    : (profile.first ? profile.first[0]?.toUpperCase() : "AF");

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationsPopover open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/40 bg-surface/95 px-3 py-5 transition-all duration-300 md:flex backdrop-blur-xl",
          collapsed ? "w-16" : "w-56",
        )}
      >
        <div className={cn("flex items-center px-1", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/painel"><Logo compact={collapsed} /></Link>
        </div>
        <nav className="mt-5 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive(to)
                  ? "bg-gold/10 text-gold font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
            >
              {isActive(to) && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-gold" />}
              <Icon className={cn("h-4 w-4 transition shrink-0", isActive(to) ? "text-gold" : "text-muted-foreground group-hover:text-gold")} />
              {!collapsed && label}
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/10 transition",
                collapsed && "justify-center px-0"
              )}
            >
              {isTitular ? (
                <Crown className="h-4 w-4 shrink-0 text-gold" />
              ) : (
                <Shield className="h-4 w-4 shrink-0 text-gold" />
              )}
              {!collapsed && (isTitular ? "Painel Titular" : "Painel Admin")}
            </Link>
          )}
        </nav>

        {!collapsed && (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-card/40 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/80">
              <span className="flex items-center gap-1 text-gold"><Sparkles className="h-2.5 w-2.5" /> Logzz COD</span>
              <span className="font-mono text-gold font-bold">Até 60%</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
              Comissão máxima ativa no Kit 3
            </p>
            <Link to="/materiais" className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-gold hover:underline transition">
              <span>Materiais e Logzz</span>
              <span>→</span>
            </Link>
          </div>
        )}

        <div className="flex-1 min-h-4" />
        <div className="flex flex-col gap-0.5 pt-2 border-t border-border/40">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition", collapsed && "justify-center")}
          >
            <ChevronsLeft className={cn("h-3.5 w-3.5 transition", collapsed && "rotate-180")} />
            {!collapsed && "Recolher menu"}
          </button>
          <button
            onClick={handleLogout}
            className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition", collapsed && "justify-center")}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && "Sair da conta"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-surface/90 px-4 backdrop-blur-2xl md:px-8">
          <div className="md:hidden"><Logo compact /></div>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-full items-center justify-between rounded-full border border-border/50 bg-card/50 px-3.5 text-xs text-muted-foreground transition hover:border-gold/40 hover:bg-card/80 text-left shadow-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-gold/70" />
                <span className="text-xs text-foreground/75 font-medium">Buscar aulas, criativos, materiais…</span>
              </div>
              <kbd className="hidden rounded-full border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground lg:inline-block">Ctrl K</kbd>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold/20 transition shadow-xs"
              >
                {isTitular ? (
                  <Crown className="h-3 w-3 text-gold" />
                ) : (
                  <Shield className="h-3 w-3" />
                )}
                {isTitular ? "Painel Titular" : "Painel Admin"}
              </Link>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
              className="grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/60 text-foreground transition hover:border-gold/50 hover:text-gold sm:hidden"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label="Notificações"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-border/60 bg-card/60 hover:border-gold/40 hover:bg-card/80 transition backdrop-blur-md shadow-xs"
            >
              <Bell className="h-3.5 w-3.5 text-foreground/80" />
              {unreadAnnouncementsCount > 0 && (
                <span className="absolute right-1 top-1 grid h-3.5 min-w-[14px] place-items-center rounded-full bg-gold px-1 text-[8px] font-bold text-primary-foreground shadow-gold">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>
            <Link to="/perfil" className="ml-0.5 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 py-0.5 pl-0.5 pr-2.5 hover:border-gold/40 hover:bg-card/90 transition backdrop-blur-md shadow-xs">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gold-gradient text-[11px] font-bold text-primary-foreground shadow-xs">{initials}</span>
              <span className="hidden text-xs font-semibold text-foreground/90 lg:block">{profile.first}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pb-20 pt-5 md:px-8 md:pb-12 md:pt-6">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet />
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl border bg-surface/95 p-1.5 shadow-soft backdrop-blur-xl md:hidden">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition",
              isActive(to) ? "bg-accent text-gold font-semibold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between border-b border-border/30 pb-4">
      <div>
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-gold-gradient transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

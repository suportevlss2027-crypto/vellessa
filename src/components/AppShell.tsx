import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell, BookOpen, ChevronsLeft, Home, Image, Link2, LogOut, Search, Shield, Users,
} from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { NotificationsPopover } from "./NotificationsPopover";

const nav = [
  { to: "/painel", label: "Início", icon: Home },
  { to: "/aulas", label: "Aulas", icon: BookOpen },
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
  const { profile, unreadAnnouncementsCount, logout } = useAffiliateStore();
  const navigate = useNavigate();

  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || path.startsWith(to + "/");

  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "MC";

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
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-surface px-4 py-6 transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64",
        )}      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/painel"><Logo compact={collapsed} /></Link>
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                collapsed && "justify-center",
                isActive(to)
                  ? "bg-accent text-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {isActive(to) && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gold-gradient" />}
              <Icon className={cn("h-[18px] w-[18px]", isActive(to) && "text-gold")} />
              {!collapsed && label}
            </Link>
          ))}
        </nav>
        {!collapsed && (
          <div className="mb-4 rounded-2xl bg-hero-gradient p-4 gold-hairline">
            <p className="font-display text-lg leading-tight">Comissão de 60%</p>
            <p className="mt-1 text-xs text-muted-foreground">no Kit 3 frascos esta semana</p>
            <Link to="/materiais" className="mt-3 inline-block text-xs font-semibold text-gold">Pegar meu link →</Link>
          </div>
        )}
        {profile.role === "admin" && (
          <Link
            to="/admin"
            className={cn(
              "mb-2 flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition",
              collapsed && "justify-center"
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!collapsed && "Painel Admin (CMS)"}
          </Link>
        )}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition", collapsed && "justify-center")}
          >
            <ChevronsLeft className={cn("h-[18px] w-[18px] transition", collapsed && "rotate-180")} />
            {!collapsed && "Recolher"}
          </button>
          <button
            onClick={handleLogout}
            className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition", collapsed && "justify-center")}
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-surface/90 px-4 backdrop-blur-xl md:px-8">
          <div className="md:hidden"><Logo compact /></div>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-full items-center justify-between rounded-full border bg-card px-4 text-sm text-muted-foreground transition hover:border-gold text-left"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span>Buscar aulas, criativos, materiais…</span>
              </div>
              <kbd className="hidden rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground lg:inline-block">Ctrl K</kbd>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {profile.role === "admin" && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 transition"
              >
                <Shield className="h-3.5 w-3.5" />
                Painel Admin
              </Link>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
              className="grid h-10 w-10 place-items-center rounded-full border bg-card text-foreground transition hover:border-gold hover:text-gold sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNotificationsOpen(true)}
              aria-label="Notificações"
              className="relative grid h-10 w-10 place-items-center rounded-full border bg-card hover:border-gold transition"
            >
              <Bell className="h-4 w-4" />
              {unreadAnnouncementsCount > 0 && (
                <span className="absolute right-2 top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {unreadAnnouncementsCount}
                </span>
              )}
            </button>
            <Link to="/perfil" className="ml-1 flex items-center gap-3 rounded-full border bg-card py-1 pl-1 pr-3 hover:border-gold transition">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground">{initials}</span>
              <span className="hidden text-sm font-medium lg:block">{profile.first}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-8">
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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>}
        <h1 className="mt-2 text-4xl font-semibold md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-xl text-muted-foreground">{description}</p>}
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

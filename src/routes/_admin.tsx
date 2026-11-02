import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BookOpen,
  FolderPlus,
  Home,
  Image,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  Moon,
  PlusCircle,
  Settings,
  Shield,
  ShieldAlert,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

const adminNav = [
  { to: "/admin", label: "Painel Geral", icon: LayoutDashboard },
  { to: "/admin/aulas", label: "Gestão de Aulas", icon: BookOpen },
  { to: "/admin/criativos", label: "Gestão de Criativos", icon: Image },
  { to: "/admin/materiais", label: "Links e Materiais", icon: Link2 },
  { to: "/admin/afiliados", label: "Afiliados Cadastrados", icon: Users },
] as const;

function AdminLayout() {
  const { profile, logout, isAdmin, isAuthenticated } = useAffiliateStore();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate({ to: "/admin/login" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const isActive = (to: string) => path === to || (to !== "/admin" && path.startsWith(to));

  const handleLogout = () => {
    logout();
    navigate({ to: "/admin/login" });
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar Admin */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-surface px-4 py-6 transition-all duration-300 md:flex",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-gradient shadow-gold">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <p className="font-display text-lg font-bold tracking-wider">ADMIN CMS</p>
                <p className="text-[10px] uppercase tracking-widest text-gold font-semibold">Vellessa Central</p>
              </div>
            )}
          </Link>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1.5">
          {adminNav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                collapsed && "justify-center",
                isActive(to)
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              )}
            >
              {isActive(to) && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gold-gradient" />
              )}
              <Icon className={cn("h-[18px] w-[18px]", isActive(to) && "text-gold")} />
              {!collapsed && label}
            </Link>
          ))}
        </nav>

        {/* Link para alternar para a visão de Afiliado */}
        {!collapsed && (
          <div className="mb-4 rounded-2xl bg-card border p-3.5 shadow-xs">
            <p className="text-xs font-semibold text-foreground">Visão do Afiliado</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Veja como seus afiliados enxergam a plataforma.</p>
            <Link
              to="/painel"
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              Abrir Área de Membros →
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-1 border-t pt-3">
          <button
            onClick={toggle}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition",
              collapsed && "justify-center"
            )}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && "Alternar tema"}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && "Sair da conta"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-gold">
              <Shield className="h-3.5 w-3.5" />
              Painel do Produtor / Gerente
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/painel"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:border-gold transition"
            >
              Ver como Afiliada
            </Link>

            <div className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-1 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground shadow-xs">
                AD
              </span>
              <span className="text-sm font-medium">{profile.name} (Admin)</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-20 pt-6 md:px-8 md:pb-12 md:pt-8">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

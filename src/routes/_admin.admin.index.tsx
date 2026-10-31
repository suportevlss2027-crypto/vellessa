import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Image, Link2, PlusCircle, RefreshCw, Sparkles, TrendingUp, Users } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({
    meta: [{ title: "Painel Administrativo — Vellessa CMS" }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const {
    modulesList,
    allLessonsList,
    creativesList,
    materialsList,
    linksList,
    seedInitialDataToDatabase,
  } = useAffiliateStore();

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 gold-hairline md:p-10 shadow-soft">
        <div className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Controle Total do Produtor</span>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold leading-tight">
            Central de Gestão de Conteúdo
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Adicione aulas, vídeos, criativos publicitários, materiais e links que seus afiliados recebem em tempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/aulas"
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              <PlusCircle className="h-4 w-4" /> Cadastrar Nova Aula
            </Link>
            <button
              onClick={seedInitialDataToDatabase}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-xs font-semibold hover:border-gold hover:text-gold transition"
              title="Restaura todo o conteúdo inicial de exemplo caso o banco esteja vazio"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restaurar Conteúdo Padrão
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas do CMS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Módulos Ativos", value: modulesList.length, desc: "Cursos na plataforma", icon: BookOpen, to: "/admin/aulas" },
          { label: "Aulas em Vídeo", value: allLessonsList.length, desc: "Conteúdos disponíveis", icon: Sparkles, to: "/admin/aulas" },
          { label: "Peças de Criativos", value: creativesList.length, desc: "Feed, Stories e Reels", icon: Image, to: "/admin/criativos" },
          { label: "Materiais & Links", value: materialsList.length + linksList.length, desc: "PDFs e links de venda", icon: Link2, to: "/admin/materiais" },
        ].map(({ label, value, desc, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="group rounded-2xl border bg-card p-5 transition hover:border-gold hover:shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-gold">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-display font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Ações Rápidas de Gerenciamento */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Módulos da Academia</h2>
            <Link to="/admin/aulas" className="text-xs font-semibold text-gold hover:underline">
              Gerenciar todos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {modulesList.map((m, idx) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    Módulo {idx + 1}: {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.lessons.length} aulas cadastradas</p>
                </div>
                <Link to="/admin/aulas" className="text-xs font-semibold text-gold hover:underline">
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Biblioteca de Criativos</h2>
            <Link to="/admin/criativos" className="text-xs font-semibold text-gold hover:underline">
              Adicionar criativos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {creativesList.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border">
                <div>
                  <p className="font-medium text-sm text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Formato: <span className="font-semibold text-gold">{c.type}</span> · {c.format}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Ativo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

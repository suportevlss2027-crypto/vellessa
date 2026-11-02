import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CheckCircle, Image, Link2, Pin, Play, Sparkles, TrendingUp, Users } from "lucide-react";
import { ProgressBar } from "@/components/AppShell";
import { images, materials, totalLessons } from "@/data/content";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/painel")({
  head: () => ({
    meta: [
      { title: "Início — Vellessa Afiliados" },
      { name: "description", content: "Seu painel de afiliada Vellessa: progresso, avisos e novidades." },
      { property: "og:title", content: "Início — Vellessa Afiliados" },
      { property: "og:description", content: "Seu painel de afiliada Vellessa." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    profile,
    completedCount,
    totalLessonsCount,
    progressPercentage,
    nextLesson,
    announcements,
  } = useAffiliateStore();

  const isCompletedAll = completedCount === totalLessonsCount;

  const shortcuts = [
    { to: "/aulas", label: "Aulas", desc: `${totalLessonsCount} aulas`, icon: BookOpen },
    { to: "/criativos", label: "Criativos", desc: "Prontos para anunciar", icon: Image },
    { to: "/materiais", label: "Links e materiais", desc: "Seus links e PDFs", icon: Link2 },
    { to: "/comunidade", label: "Comunidade", desc: "Avisos e conversas", icon: Users },
  ] as const;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 gold-hairline md:p-12">
        <img
          src={images.serum}
          alt=""
          className="pointer-events-none absolute -right-10 top-0 hidden h-full w-[45%] object-cover opacity-70 mix-blend-multiply md:block dark:opacity-35 dark:mix-blend-luminosity"
        />
        {/* Overlay extra no modo claro para o produto se destacar do fundo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent dark:from-background/40" />
        <div className="relative max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{profile.level}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">Olá, {profile.first}.</h1>
          <p className="mt-3 text-muted-foreground">
            {isCompletedAll
              ? "Parabéns! Você concluiu 100% da Academia Vellessa e está pronta para escalar suas vendas."
              : `Você concluiu ${progressPercentage}% da jornada. Continue de onde parou e prepare sua próxima campanha.`}
          </p>
          <div className="mt-6 max-w-xs">
            <ProgressBar value={progressPercentage} />
          </div>

          {nextLesson && (
            <Link
              to="/aulas/$id"
              params={{ id: nextLesson.id }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              {isCompletedAll ? (
                <>
                  <Sparkles className="h-4 w-4 fill-current" /> Revisar conteúdos da academia
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" /> Continuar assistindo
                </>
              )}
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shortcuts.map(({ to, label, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold hover:shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-gold">
                <Icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-gold" />
            </div>
            <p className="mt-5 font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {isCompletedAll ? "Academia Concluída" : "Continue assistindo"}
            </h2>
            <Link to="/aulas" className="text-sm font-medium text-gold hover:underline">
              Ver todas
            </Link>
          </div>

          {nextLesson ? (
            <Link
              to="/aulas/$id"
              params={{ id: nextLesson.id }}
              className="group mt-5 flex flex-col gap-5 sm:flex-row"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl sm:w-64 bg-muted">
                <img
                  src={nextLesson.module.cover}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 grid place-items-center bg-overlay/30">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-card/90 text-gold backdrop-blur">
                    {isCompletedAll ? <CheckCircle className="h-5 w-5 text-gold" /> : <Play className="h-5 w-5 fill-current" />}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{nextLesson.module.title}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{nextLesson.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{nextLesson.duration} min</p>
                {isCompletedAll && (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold">
                    <Sparkles className="h-3.5 w-3.5" /> Trilha 100% finalizada
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma aula encontrada no momento.
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 border-t pt-6">
            <Stat label="Aulas concluídas" value={`${completedCount}/${totalLessonsCount}`} />
            <Stat label="Criativos" value="24" />
            <Stat label="Comissão" value="até 60%" icon />
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Avisos da Equipe</h2>
            <Link to="/comunidade" className="text-sm font-medium text-gold hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 divide-y">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="py-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {a.pinned && <Pin className="h-3 w-3 text-gold" />} {a.time}
                </div>
                <p className="mt-1 font-medium text-foreground">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Materiais recentes</h2>
          <Link to="/materiais" className="text-sm font-medium text-gold hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {materials.slice(0, 3).map((m) => (
            <Link
              key={m.title}
              to="/materiais"
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:border-gold hover:shadow-soft transition"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-gradient text-xs font-bold text-primary-foreground">
                {m.kind}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.size}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div>
      <p className="flex items-center gap-1 font-display text-2xl font-semibold md:text-3xl">
        {value}
        {icon && <TrendingUp className="h-4 w-4 text-gold" />}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

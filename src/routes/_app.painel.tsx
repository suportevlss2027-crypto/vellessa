import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen, CheckCircle, CheckCircle2, DollarSign, Image, Link2, Pin, Play, Smartphone, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
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
    { to: "/aulas", label: "Aulas", count: `${totalLessonsCount} aulas`, desc: "Trilhas e estratégias", icon: BookOpen },
    { to: "/criativos", label: "Criativos", count: "24 peças", desc: "Prontos para anunciar", icon: Image },
    { to: "/materiais", label: "Links e materiais", count: "3 links", desc: "Seus links e PDFs", icon: Link2 },
    { to: "/comunidade", label: "Comunidade", count: "Ativa", desc: "Avisos e conversas", icon: Users },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Hero Banner Principal — Alta Conversão & Motivação com Notificações de Vendas Reais */}
      <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-r from-card/95 via-card/85 to-card/60 p-8 md:p-12 backdrop-blur-xl shadow-soft">
        {/* Glow Dourado e Esmeralda de Fundo (Psicologia de Dinheiro & Sucesso) */}
        <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-40 -top-10 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

        {/* Vitrine Visual de Vendas: Mockup do Smartphone do Vendedor com Notificações em Tempo Real */}
        <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end justify-center w-[46%] max-w-[490px] pr-8 select-none">
          {/* Header Superior da Operação */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md shadow-xs animate-in fade-in duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Vendas Cash on Delivery · Ao Vivo</span>
          </div>

          {/* Cascata de Notificações com Comissões Reais de 60% dos Kits Vellessa */}
          <div className="flex flex-col gap-2.5 w-full max-w-[370px]">
            {/* Card 1: Pedido Agendado Kit 1 Frasco (60% de R$ 197,90 = R$ 118,74) */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-950/80 p-3.5 backdrop-blur-xl shadow-lg transition-transform hover:-translate-x-1">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-xs">
                <span className="font-display text-xs font-black tracking-tighter text-emerald-800">
                  LQZZ
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white tracking-tight">Pedido Agendado!</p>
                  <span className="text-[10px] font-medium text-emerald-300/80">há 2m</span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">
                  Sua comissão é de <span className="font-extrabold text-emerald-300">R$ 118,74</span>
                </p>
              </div>
            </div>

            {/* Card 2: Pedido Agendado Kit 3 Frascos Campeão (60% de R$ 297,90 = R$ 178,74) */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/75 p-3.5 backdrop-blur-xl shadow-md translate-x-2 transition-transform hover:translate-x-1">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-xs">
                <span className="font-display text-xs font-black tracking-tighter text-emerald-800">
                  LQZZ
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white tracking-tight">Pedido Agendado!</p>
                  <span className="text-[10px] font-medium text-emerald-300/80">há 2m</span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">
                  Sua comissão é de <span className="font-extrabold text-emerald-300">R$ 178,74</span>
                </p>
              </div>
            </div>

            {/* Card 3: Pedido Agendado Kit 3 Frascos (60% = R$ 178,74) */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/70 p-3.5 backdrop-blur-xl shadow-sm translate-x-4 transition-transform hover:translate-x-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-xs">
                <span className="font-display text-xs font-black tracking-tighter text-emerald-800">
                  LQZZ
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white tracking-tight">Pedido Agendado!</p>
                  <span className="text-[10px] font-medium text-emerald-300/80">há 3m</span>
                </div>
                <p className="mt-0.5 text-xs text-white/80">
                  Sua comissão é de <span className="font-extrabold text-emerald-300">R$ 178,74</span>
                </p>
              </div>
            </div>

            {/* Card 4: Pedido Completo e Pago Kit 6 Frascos (60% de R$ 397,90 = R$ 238,74) */}
            <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-emerald-950/90 to-card/90 p-3.5 backdrop-blur-xl shadow-gold translate-x-1 transition-transform hover:translate-x-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-gradient shadow-xs">
                <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gold tracking-tight">Pedido Completo e Pago!</p>
                  <span className="text-[10px] font-bold text-gold">Agora</span>
                </div>
                <p className="mt-0.5 text-xs text-white/90">
                  Comissão liberada de <span className="font-extrabold text-gold">R$ 238,74</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay suave para garantir leitura perfeita do texto */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-0.5 text-[11px] font-bold text-gold shadow-xs">
            <Sparkles className="h-3 w-3 text-gold" />
            <span>{profile.level || "Afiliada Oficial"}</span>
          </div>

          <h1 className="mt-3 font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-foreground">
            Olá, <span className="italic text-gold-gradient">{profile.first}</span>.
          </h1>

          <p className="mt-3 text-sm md:text-base text-foreground/80 font-medium leading-relaxed max-w-md">
            {isCompletedAll
              ? "Parabéns! Você concluiu 100% da Academia Vellessa e está pronta para escalar suas vendas com autoridade."
              : `Você concluiu ${progressPercentage}% da jornada oficial. Continue de onde parou e prepare suas próximas campanhas de sucesso.`}
          </p>

          <div className="mt-6 flex items-center gap-3 max-w-xs">
            <div className="flex-1">
              <ProgressBar value={progressPercentage} />
            </div>
            <span className="text-xs font-bold text-gold font-sans">{progressPercentage}%</span>
          </div>

          {nextLesson && (
            <Link
              to="/aulas/$id"
              params={{ id: nextLesson.id }}
              className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-gold hover:brightness-105 hover:scale-[1.02] transition-all duration-300"
            >
              {isCompletedAll ? (
                <>
                  <Sparkles className="h-4 w-4 fill-current" /> Revisar conteúdos da academia
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current transition group-hover:scale-110" /> Continuar assistindo
                </>
              )}
            </Link>
          )}

          {/* Badge Mobile de Vendas em Tempo Real */}
          <div className="mt-6 flex lg:hidden items-center gap-2.5 rounded-2xl border border-emerald-500/35 bg-emerald-950/70 p-2.5 backdrop-blur-md shadow-xs max-w-sm">
            <span className="relative flex h-2 w-2 shrink-0 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-bold text-white">Pedido Agendado na Operação!</p>
              <p className="text-[10px] text-white/80">Comissão de <span className="font-extrabold text-emerald-300">R$ 178,74</span> há 2m</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Atalhos Rápidos de Ação — Proporção Equilibrada */}
      <section className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {shortcuts.map(({ to, label, count, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-2xl border border-gold/20 bg-card/60 p-4.5 xl:p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-[0_8px_30px_-6px_oklch(0.80_0.12_82/0.2)] hover:bg-card/85"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-gold/15 text-gold shadow-xs transition group-hover:scale-110 group-hover:bg-gold/25">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                {count}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="font-sans text-sm sm:text-base font-bold text-foreground tracking-tight group-hover:text-gold transition">
                  {label}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-medium mt-0.5">{desc}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
            </div>
          </Link>
        ))}
      </section>

      {/* Grid Central: Continue Assistindo & Avisos da Equipe */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Card: Aula em Andamento & Métricas de Prestígio */}
        <section className="rounded-3xl border border-gold/25 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {isCompletedAll ? "Academia Concluída" : "Continue assistindo"}
              </h2>
              <Link to="/aulas" className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
                <span>Ver todas</span>
                <span>→</span>
              </Link>
            </div>

            {nextLesson ? (
              <Link
                to="/aulas/$id"
                params={{ id: nextLesson.id }}
                className="group mt-5 flex flex-col gap-5 sm:flex-row items-center"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:w-64 shrink-0 bg-muted border border-gold/25 shadow-xs">
                  <img
                    src={nextLesson.module.cover}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[1px] transition group-hover:bg-black/30">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-card/90 text-gold shadow-gold backdrop-blur-md transition group-hover:scale-110">
                      {isCompletedAll ? <CheckCircle className="h-5 w-5 text-gold" /> : <Play className="h-5 w-5 fill-current" />}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold">
                    {nextLesson.module.title}
                  </span>
                  <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-foreground leading-snug group-hover:text-gold transition">
                    {nextLesson.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground font-medium">{nextLesson.duration} min de aula</p>
                  {isCompletedAll && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-gold">
                      <Sparkles className="h-3 w-3" /> Trilha 100% finalizada
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Nenhuma aula encontrada no momento.
              </div>
            )}
          </div>

          {/* 3 Cápsulas de Métricas de Prestígio */}
          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border/40 pt-6">
            <StatCard label="Aulas concluídas" value={`${completedCount}/${totalLessonsCount}`} />
            <StatCard label="Criativos prontos" value="24" />
            <StatCard label="Comissão máxima" value="Até 60%" icon gold />
          </div>
        </section>

        {/* Card: Avisos da Equipe */}
        <section className="rounded-3xl border border-gold/25 bg-card/60 p-6 md:p-8 backdrop-blur-md shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Avisos da Equipe</h2>
              <Link to="/comunidade" className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
                <span>Ver todos</span>
                <span>→</span>
              </Link>
            </div>
            <ul className="mt-2 divide-y divide-border/40">
              {announcements.slice(0, 3).map((a) => (
                <li key={a.id} className="py-3.5 group">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-gold">
                    {a.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[9px] text-gold">
                        <Pin className="h-2.5 w-2.5 text-gold" /> Fixado
                      </span>
                    )}
                    {a.pinned && <span className="text-foreground/30 text-[10px]">·</span>}
                    <span className="text-muted-foreground/80">{a.time}</span>
                  </div>
                  <p className="mt-1 font-sans text-sm font-bold text-foreground leading-snug group-hover:text-gold transition">
                    {a.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-foreground/75 font-normal leading-relaxed">
                    {a.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Seção: Materiais Recentes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Materiais recentes</h2>
          <Link to="/materiais" className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
            <span>Ver todos</span>
            <span>→</span>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {materials.slice(0, 3).map((m) => (
            <Link
              key={m.title}
              to="/materiais"
              className="group flex items-center gap-3.5 rounded-2xl border border-gold/20 bg-card/60 p-4 backdrop-blur-md hover:border-gold/50 hover:bg-card/85 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-6px_oklch(0.80_0.12_82/0.2)] transition-all duration-300"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-gradient text-xs font-bold text-primary-foreground shadow-gold transition group-hover:scale-105">
                {m.kind}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-sm font-bold text-foreground group-hover:text-gold transition">
                  {m.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">{m.size}</span>
                  <span className="text-foreground/20 text-[10px]">·</span>
                  <span className="text-[11px] font-bold text-gold">Baixar agora</span>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  gold,
}: {
  label: string;
  value: string;
  icon?: boolean;
  gold?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-card/50 p-3.5 text-center backdrop-blur-sm transition-all hover:border-gold/40">
      <p
        className={`flex items-center justify-center gap-1 font-display text-2xl sm:text-3xl font-bold tracking-tight ${
          gold ? "text-gold" : "text-foreground"
        }`}
      >
        {value}
        {icon && <TrendingUp className="h-4 w-4 text-gold" />}
      </p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

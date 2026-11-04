import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, BookOpen, CheckCircle, CheckCircle2, Image, Link2, Pin, Play, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { ProgressBar } from "@/components/AppShell";
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
    creativesList,
    materialsList,
    campaignsList,
    featureSettings,
    isAdmin,
  } = useAffiliateStore();

  const isCompletedAll = totalLessonsCount > 0 && completedCount === totalLessonsCount;

  const shortcuts = useMemo(
    () => [
      { to: "/aulas", label: "Aulas", count: `${completedCount}/${totalLessonsCount} conc.`, desc: "Trilhas de escala", icon: BookOpen },
      ...(featureSettings.trafficManagerEnabled || isAdmin
        ? [{ to: "/campanhas", label: "Gestor de Tráfego", count: `${campaignsList.length} campanhas`, desc: "Meta Ads & Lucro", icon: TrendingUp }]
        : []),
      { to: "/criativos", label: "Criativos", count: `${creativesList.length} peças`, desc: "Prontos para rodar", icon: Image },
      { to: "/materiais", label: "Links e materiais", count: "Logzz & Apoio", desc: "Acesse links Logzz", icon: Link2 },
      ...(featureSettings.communityEnabled || isAdmin
        ? [{ to: "/comunidade", label: "Comunidade", count: `${announcements.length} avisos`, desc: "Mural e avisos", icon: Users }]
        : []),
    ],
    [
      completedCount,
      totalLessonsCount,
      featureSettings.trafficManagerEnabled,
      featureSettings.communityEnabled,
      isAdmin,
      campaignsList.length,
      creativesList.length,
      announcements.length,
    ]
  );

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER PRINCIPAL — REFINADO, AREJADO & TRANSLÚCIDO (QUIET LUXURY) */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-card/95 via-card/85 to-card/60 p-6 md:p-8 backdrop-blur-xl shadow-xs">
        {/* Glow Dourado e Esmeralda de Fundo Suave */}
        <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 -top-10 h-56 w-56 rounded-full bg-gold/10 blur-2xl" />

        {/* Vitrine Oficial Logzz COD (Conexão Real e Limpa com a Plataforma de Vendas) */}
        <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end justify-center w-[40%] max-w-[360px] pr-6 select-none">
          <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950/80 p-5 backdrop-blur-xl shadow-xs text-left max-w-[320px] pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-xs">
                <span className="font-display text-[10px] font-black tracking-tighter text-emerald-900">
                  LQZZ
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">Parceria Oficial Logzz COD</p>
                <p className="text-[10px] text-emerald-400 font-medium">Checkout e Comissões via Pix</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-300 leading-relaxed font-normal">
              Acesse o painel da Logzz para pegar seus links rastreados com pixel e acompanhar suas comissões de até 60%.
            </p>
            <a
              href="https://app.logzz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              <span>Acessar painel Logzz</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Overlay suave para legibilidade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-gold shadow-xs">
            <Sparkles className="h-2.5 w-2.5 text-gold" />
            <span>{profile.level || "Afiliada Oficial"}</span>
          </div>

          <h1 className="mt-2.5 font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">
            Olá, <span className="italic text-gold-gradient">{profile.first || "Afiliada"}</span>.
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-foreground/80 font-normal leading-relaxed max-w-md">
            {totalLessonsCount === 0
              ? "Bem-vinda à sua área de membros Vellessa. Aqui você encontra aulas, materiais de apoio e criativos para suas vendas."
              : isCompletedAll
              ? "Parabéns! Você concluiu 100% da Academia Vellessa e está pronta para escalar suas vendas com autoridade."
              : `Você concluiu ${progressPercentage}% da jornada oficial. Continue de onde parou e prepare suas próximas campanhas.`}
          </p>

          {totalLessonsCount > 0 && (
            <div className="mt-4 flex items-center gap-2.5 max-w-xs">
              <div className="flex-1">
                <ProgressBar value={progressPercentage} />
              </div>
              <span className="text-[11px] font-mono font-bold text-gold">{progressPercentage}%</span>
            </div>
          )}

          {nextLesson && (
            <Link
              to="/aulas/$id"
              params={{ id: nextLesson.id }}
              className="group mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition-all"
            >
              {isCompletedAll ? (
                <>
                  <Sparkles className="h-3.5 w-3.5 fill-current" /> Revisar conteúdos da academia
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current transition group-hover:scale-110" /> Continuar assistindo
                </>
              )}
            </Link>
          )}

          {/* Badge Mobile Logzz Oficial */}
          <div className="mt-4 flex lg:hidden items-center justify-between gap-2 rounded-xl border border-emerald-500/20 bg-zinc-950/80 p-2.5 backdrop-blur-md shadow-xs max-w-sm">
            <div className="flex items-center gap-2">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white">
                <span className="font-display text-[8px] font-black tracking-tighter text-emerald-900">LQZZ</span>
              </div>
              <p className="text-[11px] font-bold text-white">Vendas e Checkout na Logzz</p>
            </div>
            <a
              href="https://app.logzz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-emerald-400 hover:underline"
            >
              Abrir →
            </a>
          </div>
        </div>
      </section>

      {/* 2. ATALHOS RÁPIDOS DE AÇÃO — COMPACTOS, ELEGANTES E AERADOS */}
      <section
        className={`grid gap-3 sm:gap-3.5 ${
          shortcuts.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : shortcuts.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        }`}
      >
        {shortcuts.map(({ to, label, count, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-card/50 p-3.5 xl:p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-card/80 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-gold shadow-xs transition group-hover:bg-gold/20">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 font-mono text-[10px] font-semibold text-gold">
                {count}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-foreground tracking-tight group-hover:text-gold transition">
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">{desc}</p>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold" />
            </div>
          </Link>
        ))}
      </section>

      {/* 3. GRID CENTRAL: CONTINUE ASSISTINDO (LIMPO & FOCADO) + AVISOS DA EQUIPE */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Card: Aula em Andamento — 100% Focado na Reprodução (SEM CAIXAS PRETAS DE MÉTRICAS AMASSADAS) */}
        <section className="rounded-2xl border border-white/10 bg-card/50 p-5 md:p-6 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {isCompletedAll ? "Academia Concluída" : "Continue assistindo"}
              </h2>
              <Link to="/aulas" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                <span>Ver todas</span>
                <span>→</span>
              </Link>
            </div>

            {nextLesson ? (
              <Link
                to="/aulas/$id"
                params={{ id: nextLesson.id }}
                className="group mt-4 flex flex-col gap-4 sm:flex-row items-center"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl sm:w-56 shrink-0 bg-muted border border-white/10 shadow-xs">
                  <img
                    src={nextLesson.module.cover}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-[1px] transition group-hover:bg-black/25">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-gold/40 bg-card/90 text-gold shadow-gold backdrop-blur-md transition group-hover:scale-110">
                      {isCompletedAll ? <CheckCircle className="h-4 w-4 text-gold" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gold">
                    {nextLesson.module.title}
                  </span>
                  <p className="mt-0.5 font-display text-base sm:text-lg font-bold text-foreground leading-snug group-hover:text-gold transition truncate sm:whitespace-normal">
                    {nextLesson.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground font-medium">{nextLesson.duration} min de aula</p>
                  {isCompletedAll ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
                      <Sparkles className="h-3 w-3" /> Trilha 100% finalizada
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold group-hover:underline">
                      Assistir agora →
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-border/40 p-5 text-center text-xs text-muted-foreground">
                Nenhuma aula pendente no momento.
              </div>
            )}
          </div>
        </section>

        {/* Card: Avisos da Equipe — Editorial & Refinado */}
        <section className="rounded-2xl border border-white/10 bg-card/50 p-5 md:p-6 backdrop-blur-sm shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">Avisos da Equipe</h2>
              {(featureSettings.communityEnabled || isAdmin) && (
                <Link to="/comunidade" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                  <span>Ver todos</span>
                  <span>→</span>
                </Link>
              )}
            </div>
            {announcements.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhum aviso publicado pela equipe no momento.
              </div>
            ) : (
              <ul className="mt-1 divide-y divide-border/30">
                {announcements.slice(0, 3).map((a) => (
                  <li key={a.id} className="py-2.5 group">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase text-gold">
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-1.5 py-0.2 text-[8px] text-gold">
                          <Pin className="h-2 w-2 text-gold" /> Fixado
                        </span>
                      )}
                      {a.pinned && <span className="text-foreground/30 text-[9px]">·</span>}
                      <span className="text-muted-foreground/80">{a.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-foreground leading-snug group-hover:text-gold transition">
                      {a.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-foreground/70 font-normal leading-relaxed">
                      {a.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* 4. SEÇÃO: MATERIAIS RECENTES — MINIMALISTA E SEM CÍRCULOS BERRANTES */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">Materiais recentes</h2>
          <Link to="/materiais" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
            <span>Ver todos</span>
            <span>→</span>
          </Link>
        </div>
        {materialsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/40 p-6 text-center text-xs text-muted-foreground bg-card/30">
            Nenhum material publicado no momento.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {materialsList.slice(0, 3).map((m) => (
              <Link
                key={m.id || m.title}
                to="/materiais"
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-card/50 p-3.5 backdrop-blur-sm hover:border-gold/30 hover:bg-card/80 transition-all shadow-xs"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold/10 border border-gold/20 text-[10px] font-mono font-bold text-gold transition group-hover:bg-gold/20">
                  {m.kind}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-gold transition">
                    {m.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-medium">{m.size}</span>
                    <span className="text-foreground/20 text-[10px]">·</span>
                    <span className="text-[10px] font-bold text-gold">Baixar</span>
                  </div>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 transition group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

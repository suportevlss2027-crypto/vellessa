import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpRight, BookOpen, CheckCircle, CheckCircle2, Image, Link2, Pin, Play, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { ProgressBar } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/painel")({
  head: () => ({
    meta: [
      { title: "Início — Vellessa Afiliados" },
      { name: "description", content: "Seu painel de afiliado Vellessa: progresso, avisos e novidades." },
      { property: "og:title", content: "Início — Vellessa Afiliados" },
      { property: "og:description", content: "Seu painel de afiliado Vellessa." },
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
      {/* 1. HERO BANNER PRINCIPAL — CINEMATOGRÁFICO, ATMOSFÉRICO & TRANSLÚCIDO (QUIET LUXURY) */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-card/95 via-card/85 to-card/60 p-6 md:p-8 backdrop-blur-xl shadow-xs">
        {/* Glows Dourado e Esmeralda de Fundo Suave */}
        <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Layout Flex: Conteúdo (Esquerda) e Vitrine de Vídeo Cinematográfico (Direita) */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          {/* Coluna Esquerda: Boas-vindas, Progresso e Ação */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-gold shadow-xs">
              <Sparkles className="h-2.5 w-2.5 text-gold" />
              <span>{profile.level || "Afiliado Oficial"}</span>
            </div>

            <h1 className="mt-2.5 font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-foreground">
              Olá, <span className="italic text-gold-gradient">{profile.first || "Afiliado"}</span>.
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-foreground/80 font-normal leading-relaxed max-w-md">
              {totalLessonsCount === 0
                ? "Boas-vindas à sua área de membros Vellessa. Aqui você encontra aulas, materiais de apoio e criativos para suas vendas."
                : isCompletedAll
                ? "Parabéns! Você concluiu 100% da Academia Vellessa e está no ponto ideal para escalar suas vendas com autoridade."
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
          </div>

          {/* Coluna Direita: Vitrine Cinematográfica em Vídeo HD (16:9) + Pílula Flutuante Logzz */}
          <div className="relative shrink-0 flex flex-col items-center lg:items-end justify-center w-full lg:w-[46%] xl:w-[48%] max-w-[460px] mx-auto lg:mx-0">
            <div className="group relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 shadow-2xl transition duration-500 hover:border-gold/30">
              {/* Glow áureo de fundo */}
              <div className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.80_0.12_82/0.20)_0%,oklch(0.65_0.15_150/0.12)_45%,transparent_70%)] blur-xl" />

              {/* Vídeo HTML5 Cinematográfico com Autoplay Suave */}
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              >
                <source src="/videos/vellessa-painel-hero.mp4" type="video/mp4" />
              </video>

              {/* Vinheta suave nos cantos para fusão orgânica */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* Pílula Glassmorphism Flutuante Logzz Oficial */}
              <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-zinc-950/85 p-2.5 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-emerald-400/60 hover:bg-zinc-950/95">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white shadow-xs">
                    <span className="font-display text-[8px] font-black tracking-tighter text-emerald-900">
                      LQZZ
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-bold text-white tracking-tight truncate">Parceria Oficial Logzz COD</p>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    </div>
                    <p className="text-[9px] text-emerald-400 font-medium truncate">Até 60% de comissão via Pix</p>
                  </div>
                </div>
                <a
                  href="https://app.logzz.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 transition shrink-0"
                >
                  <span>Painel Logzz</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState, useEffect } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Play, ExternalLink, Link2, File, AlignLeft } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { VideoPlayer } from "@/components/VideoPlayer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/aulas/$id")({
  loader: () => ({}),
  head: () => ({
    meta: [
      { title: "Aula — Vellessa Afiliados" },
      { name: "description", content: "Assista à aula na Academia Vellessa." },
      { property: "og:title", content: "Aula — Vellessa Afiliados" },
      { property: "og:description", content: "Assista à aula na Academia Vellessa." },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { id } = Route.useParams();
  const {
    isLessonDone,
    toggleLessonDone,
    markLessonDone,
    downloadAsset,
    allLessonsList,
    modulesList,
    updateLesson,
    syncModulesWithSupabase,
  } = useAffiliateStore();

  const [theaterMode, setTheaterMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("vellessa_theater_mode") === "true";
      } catch {
        return false;
      }
    }
    return false;
  });

  const toggleTheaterMode = useCallback(() => {
    setTheaterMode((prev) => {
      const nextVal = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("vellessa_theater_mode", String(nextVal));
        } catch {}
      }
      return nextVal;
    });
  }, []);

  const idx = allLessonsList.findIndex((l) => l.id === id);
  const lesson = allLessonsList[idx] ?? allLessonsList[0];
  const prev = idx > 0 ? allLessonsList[idx - 1] : undefined;
  const next = idx >= 0 && idx < allLessonsList.length - 1 ? allLessonsList[idx + 1] : undefined;

  // QA-Senior: Scroll suave ao topo e sincronização do título dinâmico da página ao alternar aulas
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (lesson?.title) {
      document.title = `${lesson.title} — Vellessa Afiliados`;
    }
    syncModulesWithSupabase(false);
  }, [id, lesson?.title, syncModulesWithSupabase]);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold">Aula não encontrada</p>
        <Link to="/aulas" className="text-sm text-gold hover:underline">
          ← Voltar para todas as aulas
        </Link>
      </div>
    );
  }

  const done = isLessonDone(lesson.id);

  const handleAutoComplete = useCallback(() => {
    if (lesson) {
      markLessonDone(lesson.id, lesson.title);
    }
  }, [lesson?.id, lesson?.title, markLessonDone]);

  const handleDurationDetected = useCallback(
    (detectedDur: string) => {
      if (detectedDur && lesson && detectedDur !== lesson.duration && lesson.module?.id) {
        updateLesson(lesson.module.id, lesson.id, { duration: detectedDur });
      }
    },
    [lesson?.id, lesson?.duration, lesson?.module?.id, updateLesson]
  );

  const isVideoLesson = Boolean(lesson.video_url);
  const contentType = lesson.contentType;
  const contentUrl = lesson.contentUrl;

  const playerComponent = isVideoLesson ? (
    <VideoPlayer
      cover={lesson.module.cover}
      title={lesson.title}
      duration={lesson.duration}
      videoUrl={lesson.video_url}
      theaterMode={theaterMode}
      onToggleTheater={toggleTheaterMode}
      onAutoComplete={handleAutoComplete}
      onDurationDetected={handleDurationDetected}
    />
  ) : contentType === "pdf" || (!contentType && contentUrl?.toLowerCase().includes(".pdf")) ? (
    /* ── Luxury PDF Card ── */
    <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-card to-card shadow-2xl">
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-14 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-lg">
          <File className="h-10 w-10 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400 mb-2">Documento / PDF</p>
          <h2 className="text-2xl font-bold text-foreground leading-tight">{lesson.title}</h2>
          {lesson.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-md">{lesson.description}</p>
          )}
        </div>
        {contentUrl && (
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-sm font-bold text-black shadow-lg hover:bg-amber-400 transition"
          >
            <File className="h-4 w-4" />
            Abrir / Baixar Documento PDF ↗
          </a>
        )}
      </div>
    </div>
  ) : contentType === "link" || (!contentType && contentUrl) ? (
    /* ── Luxury Link Card ── */
    <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-card to-card shadow-2xl">
      <div className="flex flex-col items-center justify-center gap-6 px-8 py-14 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 shadow-lg">
          <Link2 className="h-10 w-10 text-cyan-400" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400 mb-2">Link / Ferramenta</p>
          <h2 className="text-2xl font-bold text-foreground leading-tight">{lesson.title}</h2>
          {lesson.description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-md">{lesson.description}</p>
          )}
        </div>
        {contentUrl && (
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-3 text-sm font-bold text-black shadow-lg hover:bg-cyan-400 transition"
          >
            <Link2 className="h-4 w-4" />
            Acessar Ferramenta Externa ↗
          </a>
        )}
      </div>
    </div>
  ) : contentType === "text" ? (
    /* ── Luxury Reading Card ── */
    <div className="overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 via-card to-card shadow-2xl">
      <div className="px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 border border-violet-500/20">
            <AlignLeft className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">Material de Leitura</p>
            <p className="text-lg font-bold text-foreground">{lesson.title}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-background/50 p-6">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {contentUrl || lesson.description || "Nenhum conteúdo cadastrado."}
          </p>
        </div>
      </div>
    </div>
  ) : (
    /* ── Fallback: empty state ── */
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/30 bg-muted/10 py-16 text-center">
      <FileText className="h-10 w-10 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">Conteúdo desta aula não configurado ainda.</p>
    </div>
  );

  const lessonDetailsComponent = (
    <>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{lesson.module.title}</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-4xl">{lesson.title}</h1>
        </div>
        <button
          onClick={() => toggleLessonDone(lesson.id)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition shadow-sm",
            done
              ? "border-gold bg-gold/15 text-gold hover:bg-gold/25"
              : "hover:border-gold hover:text-gold hover:bg-card"
          )}
        >
          <CheckCircle2 className={cn("h-4 w-4", done && "text-gold fill-gold/20")} />
          {done ? "Aula Concluída" : "Marcar como concluída"}
        </button>
      </div>

      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {lesson.description ||
          "Nesta aula você vai entender, de forma prática, como aplicar este conteúdo na sua rotina de divulgação do Sérum Vellessa — com exemplos reais, scripts de alta conversão e os erros mais comuns para evitar."}
      </p>

      {/* Materiais Complementares Reais Cadastrados pelo Administrador (100% Condicional) */}
      {lesson.materials && lesson.materials.length > 0 && (
        <div className="mt-6 rounded-2xl border bg-card p-5 shadow-xs">
          <p className="font-semibold text-foreground text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-gold" />
            Materiais complementares da aula ({lesson.materials.length})
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {lesson.materials.map((mat) => (
              <a
                key={mat.id || mat.url}
                href={mat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm transition hover:bg-muted hover:text-gold border border-transparent hover:border-gold/30 group"
              >
                <span className="flex items-center gap-2.5 truncate pr-2">
                  <FileText className="h-4 w-4 text-gold shrink-0" />
                  <span className="truncate font-medium">{mat.title}</span>
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold shrink-0 transition" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between gap-3">
        {prev ? (
          <Link
            to="/aulas/$id"
            params={{ id: prev.id }}
            className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm hover:border-gold hover:text-gold transition"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Link>
        ) : (
          <span />
        )}

        {next && (
          <Link
            to="/aulas/$id"
            params={{ id: next.id }}
            className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            Próxima aula <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </>
  );

  const sidebarComponent = (
    <aside className="h-fit rounded-3xl border bg-card p-3 xl:sticky xl:top-24">
      {modulesList.map((m, mi) => (
        <div key={m.id} className="p-2">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Módulo {mi + 1} · {m.title}
          </p>
          {m.lessons.map((l) => {
            const lessonIsDone = isLessonDone(l.id);
            const isCurrent = l.id === id;
            return (
              <Link
                key={l.id}
                to="/aulas/$id"
                params={{ id: l.id }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  isCurrent
                    ? "bg-accent text-foreground font-medium shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {lessonIsDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                ) : (
                  <Play className={cn("h-4 w-4 shrink-0", isCurrent && "text-gold")} />
                )}
                <span className="flex-1 truncate">{l.title}</span>
                <span className="text-xs">{l.duration}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );

  return (
    <div className="space-y-4">
      <Link
        to="/aulas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition"
      >
        <ChevronLeft className="h-4 w-4" /> Todas as aulas
      </Link>

      {theaterMode ? (
        /* MODO TEATRO ATIVADO: Widescreen 16:9 expandido na tela inteira (perfeito para Notebooks) */
        <div className="space-y-6 animate-in fade-in">
          <div className="w-full">
            {playerComponent}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div>{lessonDetailsComponent}</div>
            {sidebarComponent}
          </div>
        </div>
      ) : (
        /* MODO PADRÃO: Grid lado a lado com a sidebar de aulas */
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            {playerComponent}
            {lessonDetailsComponent}
          </div>
          {sidebarComponent}
        </div>
      )}
    </div>
  );
}

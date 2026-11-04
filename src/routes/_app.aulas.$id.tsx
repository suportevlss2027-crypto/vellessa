import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Play } from "lucide-react";
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
  } = useAffiliateStore();

  const idx = allLessonsList.findIndex((l) => l.id === id);
  const lesson = allLessonsList[idx] ?? allLessonsList[0];
  const prev = idx > 0 ? allLessonsList[idx - 1] : undefined;
  const next = idx >= 0 && idx < allLessonsList.length - 1 ? allLessonsList[idx + 1] : undefined;

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

  const handleDownloadMaterial = (filename: string) => {
    const content = `=== VELESSA AFILIADOS - MATERIAL OFICIAL ===\n\nAula: ${lesson.title}\nMódulo: ${lesson.module.title}\nArquivo: ${filename}\nData: ${new Date().toLocaleDateString("pt-BR")}\n\nConteúdo prático recomendado para implementação e aumento de conversão no tráfego pago e orgânico.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    downloadAsset(url, filename.replace(".pdf", ".txt"));
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div>
        <Link
          to="/aulas"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition"
        >
          <ChevronLeft className="h-4 w-4" /> Todas as aulas
        </Link>

        {/* Reprodutor de Vídeo Interativo */}
        <VideoPlayer
          cover={lesson.module.cover}
          title={lesson.title}
          duration={lesson.duration}
          videoUrl={lesson.video_url}
          onAutoComplete={() => markLessonDone(lesson.id)}
          onDurationDetected={(detectedDur) => {
            if (detectedDur && detectedDur !== lesson.duration && lesson.module?.id) {
              updateLesson(lesson.module.id, lesson.id, { duration: detectedDur });
            }
          }}
        />

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

        <div className="mt-6 rounded-2xl border bg-card p-5">
          <p className="font-semibold text-foreground">Materiais complementares da aula</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {["Resumo da aula.pdf", "Checklist prático.pdf"].map((f) => (
              <button
                key={f}
                onClick={() => handleDownloadMaterial(f)}
                className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3 text-sm transition hover:bg-muted hover:text-gold border border-transparent hover:border-gold/30"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gold" />
                  {f}
                </span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

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
      </div>

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
    </div>
  );
}

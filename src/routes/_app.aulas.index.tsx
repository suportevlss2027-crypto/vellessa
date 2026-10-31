import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { PageHeader, ProgressBar } from "@/components/AppShell";
import { modules } from "@/data/content";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/aulas/")({
  head: () => ({
    meta: [
      { title: "Aulas — Vellessa Afiliados" },
      { name: "description", content: "Módulos de vídeo aulas para afiliados Vellessa venderem mais." },
      { property: "og:title", content: "Aulas — Vellessa Afiliados" },
      { property: "og:description", content: "Módulos de vídeo aulas para afiliados Vellessa." },
    ],
  }),
  component: Aulas,
});

function Aulas() {
  const { isLessonDone } = useAffiliateStore();

  return (
    <>
      <PageHeader
        eyebrow="Academia Vellessa"
        title="Vídeo aulas"
        description="Do primeiro passo à escala: módulos pensados para você vender com elegância e consistência."
      />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((m, i) => {
          const done = m.lessons.filter((l) => isLessonDone(l.id)).length;
          const pct = Math.round((done / m.lessons.length) * 100);
          const first = m.lessons.find((l) => !isLessonDone(l.id)) ?? m.lessons[0]!;
          return (
            <Link
              key={m.id}
              to="/aulas/$id"
              params={{ id: first.id }}
              className="group overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1 hover:border-gold hover:shadow-soft"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                <img
                  src={m.cover}
                  alt={m.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-overlay via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-card/85 px-3 py-1 text-xs font-semibold backdrop-blur">
                  Módulo {String(i + 1).padStart(2, "0")}
                </span>
                <PlayCircle className="absolute bottom-4 right-4 h-10 w-10 text-overlay-foreground opacity-0 transition group-hover:opacity-100" />
                <div className="absolute bottom-4 left-4 right-16 text-overlay-foreground">
                  <h3 className="text-2xl font-semibold leading-tight">{m.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm text-muted-foreground">{m.subtitle}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{m.lessons.length} aulas</span>
                  <span className="font-semibold text-gold">{pct}%</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={pct} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

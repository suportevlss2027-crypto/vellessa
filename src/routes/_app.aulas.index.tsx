import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, PlayCircle } from "lucide-react";
import { PageHeader, ProgressBar } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
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
  const { isLessonDone, modulesList } = useAffiliateStore();

  return (
    <>
      <PageHeader
        eyebrow="Academia Vellessa"
        title="Vídeo aulas"
        description="Do primeiro passo à escala: módulos pensados para você vender com elegância e consistência."
      />
      {modulesList.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhuma aula cadastrada"
          description="A equipe Vellessa está preparando a sua trilha oficial de capacitação. Em breve os módulos estarão disponíveis aqui."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {modulesList.map((m, i) => {
            const done = m.lessons.filter((l) => isLessonDone(l.id)).length;
            const pct = m.lessons.length > 0 ? Math.round((done / m.lessons.length) * 100) : 0;
            const first = m.lessons.find((l) => !isLessonDone(l.id)) ?? m.lessons[0];

            if (!first) return null;

            return (
              <Link
                key={m.id}
                to="/aulas/$id"
                params={{ id: first.id }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-gold/40 shadow-xs"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  {m.cover ? (
                    <img
                      src={m.cover}
                      alt={m.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-card to-background flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-gold/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-card/85 px-2.5 py-0.5 text-[10px] font-mono font-bold text-gold border border-white/10 backdrop-blur-md">
                    Módulo {String(i + 1).padStart(2, "0")}
                  </span>
                  <PlayCircle className="absolute bottom-3 right-3 h-8 w-8 text-gold opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3 right-12 text-white">
                    <h3 className="font-display text-lg font-bold leading-tight">{m.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.subtitle}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{m.lessons.length} aulas</span>
                    <span className="font-mono font-bold text-gold">{pct}%</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={pct} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, MessageCircle, Pin, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/comunidade")({
  head: () => ({
    meta: [
      { title: "Comunidade — Vellessa Afiliados" },
      { name: "description", content: "Avisos da equipe e conversas entre afiliadas Vellessa." },
      { property: "og:title", content: "Comunidade — Vellessa Afiliados" },
      { property: "og:description", content: "Avisos da equipe e conversas entre afiliadas." },
    ],
  }),
  component: Comunidade,
});

function Comunidade() {
  const { announcements, posts, addPost, toggleLikePost, profile } = useAffiliateStore();
  const [newPostText, setNewPostText] = useState("");

  const initials = profile.name
    ? profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("")
    : (profile.first ? profile.first[0]?.toUpperCase() : "AF");

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    addPost(newPostText);
    setNewPostText("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Juntas vamos mais longe"
        title="Comunidade"
        description="Avisos oficiais da gerência de afiliados e troca de experiências, conquistas e dúvidas entre afiliadas."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">Avisos da equipe</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Oficial</span>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-card/40 p-6 text-center text-xs text-muted-foreground backdrop-blur-sm">
              Nenhum aviso publicado pela equipe no momento.
            </div>
          ) : (
            announcements.map((a) => (
              <article
                key={a.id}
                className={
                  a.pinned
                    ? "rounded-2xl border border-gold/30 bg-hero-gradient p-4.5 shadow-soft"
                    : "rounded-2xl border border-white/10 bg-card/60 p-4.5 shadow-xs backdrop-blur-sm"
                }
              >
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold border border-gold/30">
                      <Pin className="h-2.5 w-2.5" /> Fixado
                    </span>
                  )}
                  <span>
                    {a.author} · {a.time}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base sm:text-lg font-bold text-foreground">{a.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/80">{a.body}</p>
              </article>
            ))
          )}
        </section>

        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-foreground">Mural de Afiliadas</h2>
            <span className="text-xs text-muted-foreground font-medium">Compartilhe sua jornada</span>
          </div>

          <form onSubmit={handlePublish} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-card/60 p-2 pl-3.5 shadow-xs backdrop-blur-sm">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground shadow-xs">
              {initials}
            </span>
            <input
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Compartilhe uma conquista, dica ou dúvida com a comunidade…"
              className="flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!newPostText.trim()}
              aria-label="Publicar mensagem"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold hover:brightness-105 transition disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-card/40 p-6 text-center text-xs text-muted-foreground backdrop-blur-sm">
                Nenhuma publicação no mural ainda. Seja a primeira a compartilhar uma mensagem!
              </div>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded-2xl border border-white/10 bg-card/60 p-4.5 shadow-xs transition hover:border-gold/30 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-gold">
                        {p.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{p.author}</p>
                        <p className="text-xs text-muted-foreground">há {p.time}</p>
                      </div>
                    </div>
                    {p.userLiked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold">
                        <Sparkles className="h-3 w-3" /> Você curtiu
                      </span>
                    )}
                  </div>

                  <p className="mt-4 leading-relaxed text-foreground">{p.body}</p>

                  <div className="mt-4 flex gap-5 border-t pt-4 text-sm text-muted-foreground">
                    <button
                      onClick={() => toggleLikePost(p.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 transition hover:text-gold",
                        p.userLiked && "text-gold font-semibold"
                      )}
                    >
                      <Heart className={cn("h-4 w-4 transition", p.userLiked && "fill-current text-gold scale-110")} />
                      {p.likes}
                    </button>
                    <button
                      onClick={() => toast.info("Comentários temporariamente em moderação de comunidade.")}
                      className="inline-flex items-center gap-1.5 transition hover:text-gold"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {p.replies}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

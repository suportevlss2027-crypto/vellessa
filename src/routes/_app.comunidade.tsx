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
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "MC";

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

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Avisos da equipe</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">Oficial</span>
          </div>

          {announcements.map((a) => (
            <article
              key={a.id}
              className={
                a.pinned
                  ? "rounded-3xl bg-hero-gradient p-6 gold-hairline shadow-soft"
                  : "rounded-3xl border bg-card p-6 shadow-xs"
              }
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-0.5 font-semibold text-gold border border-gold/30">
                    <Pin className="h-3 w-3" /> Fixado
                  </span>
                )}
                <span>
                  {a.author} · {a.time}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-foreground">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </article>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Mural de Afiliadas</h2>
            <span className="text-xs text-muted-foreground">Compartilhe sua jornada</span>
          </div>

          <form onSubmit={handlePublish} className="flex items-center gap-3 rounded-3xl border bg-card p-2.5 pl-4 shadow-xs">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground shadow-xs">
              {initials}
            </span>
            <input
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Compartilhe uma conquista, dica ou dúvida com a comunidade…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={!newPostText.trim()}
              aria-label="Publicar mensagem"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold hover:brightness-105 transition disabled:opacity-40 disabled:hover:brightness-100"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="space-y-4">
            {posts.map((p) => (
              <article key={p.id} className="rounded-3xl border bg-card p-6 shadow-xs transition hover:border-gold/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-semibold text-gold">
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
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

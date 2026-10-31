import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, FileText, Image, Link2, Search, Users, Video, X } from "lucide-react";
import { allLessons, creatives, links, materials } from "@/data/content";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Handle Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const normalized = query.toLowerCase().trim();

  const filteredLessons = allLessons.filter(
    (l) => l.title.toLowerCase().includes(normalized) || l.module.title.toLowerCase().includes(normalized)
  );

  const filteredCreatives = creatives.filter(
    (c) => c.title.toLowerCase().includes(normalized) || c.type.toLowerCase().includes(normalized)
  );

  const filteredLinks = links.filter(
    (l) => l.label.toLowerCase().includes(normalized) || l.note.toLowerCase().includes(normalized)
  );

  const filteredMaterials = materials.filter(
    (m) => m.title.toLowerCase().includes(normalized) || m.kind.toLowerCase().includes(normalized)
  );

  const hasResults =
    filteredLessons.length > 0 ||
    filteredCreatives.length > 0 ||
    filteredLinks.length > 0 ||
    filteredMaterials.length > 0;

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
    setQuery("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/60 p-4 pt-16 backdrop-blur-sm sm:pt-24 animate-in fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aulas, criativos, materiais ou links..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar busca"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!hasResults && query && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado para &quot;{query}&quot;.
            </div>
          )}

          {/* Atalhos Rápidos */}
          {!query && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navegação rápida
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: "Aulas", to: "/aulas", icon: BookOpen },
                  { label: "Criativos", to: "/criativos", icon: Image },
                  { label: "Materiais", to: "/materiais", icon: Link2 },
                  { label: "Comunidade", to: "/comunidade", icon: Users },
                ].map(({ label, to, icon: Icon }) => (
                  <button
                    key={to}
                    onClick={() => handleSelect(() => navigate({ to }))}
                    className="flex items-center gap-2.5 rounded-xl border bg-background/50 p-2.5 text-sm font-medium hover:border-gold hover:text-gold transition"
                  >
                    <Icon className="h-4 w-4 text-gold" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aulas */}
          {filteredLessons.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aulas ({filteredLessons.length})
              </p>
              <div className="space-y-1">
                {filteredLessons.slice(0, 5).map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() =>
                      handleSelect(() =>
                        navigate({ to: "/aulas/$id", params: { id: lesson.id } })
                      )
                    }
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                        <Video className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.module.title}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Criativos */}
          {filteredCreatives.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Criativos ({filteredCreatives.length})
              </p>
              <div className="space-y-1">
                {filteredCreatives.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(() => navigate({ to: "/criativos" }))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                        <Image className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{c.type} · {c.format}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gold">Abrir</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Links e Materiais */}
          {filteredLinks.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Links de Afiliada ({filteredLinks.length})
              </p>
              <div className="space-y-1">
                {filteredLinks.map((link) => (
                  <button
                    key={link.url}
                    onClick={() => handleSelect(() => navigate({ to: "/materiais" }))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.note}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gold">Ver link</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredMaterials.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Arquivos e Manuais ({filteredMaterials.length})
              </p>
              <div className="space-y-1">
                {filteredMaterials.map((mat) => (
                  <button
                    key={mat.title}
                    onClick={() => handleSelect(() => navigate({ to: "/materiais" }))}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold/15 text-gold">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{mat.title}</p>
                        <p className="text-xs text-muted-foreground">{mat.kind} · {mat.size}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gold">Baixar</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
          <span>Pressione <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">ESC</kbd> para fechar</span>
          <span>Dica: Use <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono">Ctrl+K</kbd> a qualquer momento</span>
        </div>
      </div>
    </div>
  );
}

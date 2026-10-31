import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FolderPlus, Plus, Play, Trash2, Video, Clock, CheckCircle } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_admin/admin/aulas")({
  head: () => ({
    meta: [{ title: "Gestão de Aulas — Vellessa CMS" }],
  }),
  component: AdminAulasPage,
});

function AdminAulasPage() {
  const { modulesList, createModule, deleteModule, createLesson, deleteLesson } = useAffiliateStore();

  // Modal / Form state for Module
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modSubtitle, setModSubtitle] = useState("");

  // Modal / Form state for Lesson
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("10:00");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) return;
    await createModule({
      title: modTitle.trim(),
      subtitle: modSubtitle.trim(),
    });
    setModTitle("");
    setModSubtitle("");
    setShowModuleModal(false);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedModuleId) return;
    await createLesson({
      moduleId: selectedModuleId,
      title: lessonTitle.trim(),
      duration: lessonDuration.trim(),
      videoUrl: lessonVideoUrl.trim(),
      description: lessonDescription.trim(),
    });
    setLessonTitle("");
    setLessonDuration("10:00");
    setLessonVideoUrl("");
    setLessonDescription("");
    setShowLessonModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold">Gestão de Cursos e Aulas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie novos módulos, adicione links de vídeo e organize a trilha de aprendizado dos seus afiliados.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModuleModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-xs font-semibold hover:border-gold hover:text-gold transition"
          >
            <FolderPlus className="h-4 w-4" /> Novo Módulo
          </button>
        </div>
      </div>

      {/* Lista de Módulos e Aulas */}
      <div className="space-y-6">
        {modulesList.map((m, mIdx) => (
          <div key={m.id} className="rounded-3xl border bg-card p-6 shadow-xs">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Módulo {String(mIdx + 1).padStart(2, "0")}
                </span>
                <h2 className="text-xl font-semibold text-foreground">{m.title}</h2>
                <p className="text-xs text-muted-foreground">{m.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedModuleId(m.id);
                    setShowLessonModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Aula
                </button>
                <button
                  onClick={() => deleteModule(m.id)}
                  title="Excluir Módulo"
                  className="grid h-8 w-8 place-items-center rounded-lg border text-muted-foreground hover:border-red-500 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Aulas do Módulo */}
            <div className="mt-4 divide-y">
              {m.lessons.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl my-2">
                  Nenhuma aula cadastrada neste módulo. Clique em &quot;Adicionar Aula&quot;.
                </div>
              ) : (
                m.lessons.map((lesson, lIdx) => (
                  <div key={lesson.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-gold text-xs font-bold">
                        {lIdx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" /> {lesson.duration}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      title="Excluir aula"
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar Módulo */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateModule}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <h3 className="text-xl font-semibold">Novo Módulo de Treinamento</h3>
            <label className="block">
              <span className="text-xs font-medium">Título do Módulo</span>
              <input
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                placeholder="Ex: Tráfego Pago no TikTok"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium">Subtítulo / Descrição Rápida</span>
              <input
                value={modSubtitle}
                onChange={(e) => setModSubtitle(e.target.value)}
                placeholder="Ex: Como estruturar campanhas de alta conversão"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Salvar Módulo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Criar Aula */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateLesson}
            className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <h3 className="text-xl font-semibold">Cadastrar Nova Aula</h3>
            <label className="block">
              <span className="text-xs font-medium">Título da Aula</span>
              <input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Ex: Estrutura de Campanha Vencedora"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                required
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium">Duração Estimada</span>
                <input
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="Ex: 12:40"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Link do Vídeo (Embed)</span>
                <input
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, Panda Video ou MP4"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium">Descrição da Aula</span>
              <textarea
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                rows={3}
                placeholder="Explique o objetivo prático desta aula..."
                className="mt-1 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Salvar Aula
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

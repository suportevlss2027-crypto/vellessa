import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  FolderPlus,
  Plus,
  Play,
  Trash2,
  Video,
  Clock,
  Pencil,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useAffiliateStore, type DynamicModule } from "@/lib/affiliate-store";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { VideoPlayer } from "@/components/VideoPlayer";
import { type Lesson } from "@/data/content";
import { detectVideoDuration } from "@/lib/video-duration";

export const Route = createFileRoute("/_admin/admin/aulas")({
  head: () => ({
    meta: [{ title: "Gestão de Aulas — Vellessa CMS" }],
  }),
  component: AdminAulasPage,
});

function getVideoBadge(url?: string) {
  if (!url) {
    return { label: "Sem vídeo", color: "bg-muted text-muted-foreground border-border/40" };
  }
  const low = url.toLowerCase();
  if (low.includes("youtube") || low.includes("youtu.be")) {
    return { label: "YouTube", color: "bg-red-500/10 text-red-400 border-red-500/30" };
  }
  if (low.includes("pandavideo") || low.includes("vturb")) {
    return { label: "Panda / VTurb", color: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
  }
  if (low.includes("vimeo")) {
    return { label: "Vimeo", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
  }
  if (low.includes(".mp4") || low.includes(".webm")) {
    return { label: "MP4 Direto", color: "bg-gold/10 text-gold border-gold/30" };
  }
  return { label: "Vídeo Externo", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
}

function AdminAulasPage() {
  const {
    modulesList,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
  } = useAffiliateStore();

  // Modal / Form state for Creating Module
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [modTitle, setModTitle] = useState("");
  const [modSubtitle, setModSubtitle] = useState("");
  const [modCover, setModCover] = useState("");

  // Modal / Form state for Editing Module
  const [editingModule, setEditingModule] = useState<DynamicModule | null>(null);
  const [editModTitle, setEditModTitle] = useState("");
  const [editModSubtitle, setEditModSubtitle] = useState("");
  const [editModCover, setEditModCover] = useState("");

  // Modal / Form state for Creating Lesson
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [isDetectingNew, setIsDetectingNew] = useState(false);
  const [showManualNew, setShowManualNew] = useState(false);

  // Modal / Form state for Editing Lesson
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonDescription, setEditLessonDescription] = useState("");
  const [isDetectingEdit, setIsDetectingEdit] = useState(false);
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Modal state for Previewing Video in Admin
  const [previewLesson, setPreviewLesson] = useState<{
    title: string;
    videoUrl?: string;
    duration: string;
    cover: string;
  } | null>(null);

  // Handlers for Module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim()) return;
    await createModule({
      title: modTitle.trim(),
      subtitle: modSubtitle.trim(),
      cover: modCover.trim(),
    });
    setModTitle("");
    setModSubtitle("");
    setModCover("");
    setShowModuleModal(false);
  };

  const handleOpenEditModule = (m: DynamicModule) => {
    setEditingModule(m);
    setEditModTitle(m.title);
    setEditModSubtitle(m.subtitle || "");
    setEditModCover(m.cover || "");
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModTitle.trim()) return;
    await updateModule(editingModule.id, {
      title: editModTitle.trim(),
      subtitle: editModSubtitle.trim(),
      cover: editModCover.trim(),
    });
    setEditingModule(null);
  };

  // Video Duration Auto-Detection Handlers
  const handleNewVideoUrlChange = (url: string) => {
    setLessonVideoUrl(url);
    if (!url.trim()) return;
    setIsDetectingNew(true);
    detectVideoDuration(url)
      .then((res) => {
        setIsDetectingNew(false);
        if (res.duration) {
          setLessonDuration(res.duration);
        }
      })
      .catch(() => setIsDetectingNew(false));
  };

  const handleEditVideoUrlChange = (url: string) => {
    setEditLessonVideoUrl(url);
    if (!url.trim()) return;
    setIsDetectingEdit(true);
    detectVideoDuration(url)
      .then((res) => {
        setIsDetectingEdit(false);
        if (res.duration) {
          setEditLessonDuration(res.duration);
        }
      })
      .catch(() => setIsDetectingEdit(false));
  };

  const recheckEditDuration = () => {
    if (!editLessonVideoUrl.trim()) return;
    setIsDetectingEdit(true);
    detectVideoDuration(editLessonVideoUrl)
      .then((res) => {
        setIsDetectingEdit(false);
        if (res.duration) {
          setEditLessonDuration(res.duration);
        }
      })
      .catch(() => setIsDetectingEdit(false));
  };

  // Handlers for Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedModuleId) return;
    await createLesson({
      moduleId: selectedModuleId,
      title: lessonTitle.trim(),
      duration: lessonDuration.trim() || "10:00",
      videoUrl: lessonVideoUrl.trim(),
      description: lessonDescription.trim(),
    });
    setLessonTitle("");
    setLessonDuration("");
    setLessonVideoUrl("");
    setLessonDescription("");
    setIsDetectingNew(false);
    setShowManualNew(false);
    setShowLessonModal(false);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    setEditingLesson({ moduleId, lesson });
    setEditLessonTitle(lesson.title);
    setEditLessonDuration(lesson.duration || "");
    setEditLessonVideoUrl(lesson.video_url || "");
    setEditLessonDescription(lesson.description || "");
    setIsDetectingEdit(false);
    setShowManualEdit(false);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim()) return;
    await updateLesson(editingLesson.moduleId, editingLesson.lesson.id, {
      title: editLessonTitle.trim(),
      duration: editLessonDuration.trim() || "10:00",
      videoUrl: editLessonVideoUrl.trim(),
      description: editLessonDescription.trim(),
    });
    setEditingLesson(null);
  };

  return (
    <div className="space-y-6">
      {/* Header com Ação Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Gestão de Cursos e Aulas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie novos módulos com capa personalizada, configure links de vídeo e organize a trilha de capacitação das afiliadas.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowModuleModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <FolderPlus className="h-4 w-4" /> Novo Módulo
          </button>
        </div>
      </div>

      {/* Lista de Módulos e Aulas */}
      <div className="space-y-6">
        {modulesList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/40 p-12 text-center bg-card/20">
            <FolderPlus className="h-10 w-10 text-gold/40 mx-auto" />
            <h3 className="mt-4 font-semibold text-foreground text-base">Nenhum módulo criado ainda</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Clique em &quot;Novo Módulo&quot; para criar o primeiro módulo de treinamento com capa, aulas e vídeos.
            </p>
            <button
              onClick={() => setShowModuleModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
            >
              <Plus className="h-4 w-4" /> Criar Primeiro Módulo
            </button>
          </div>
        ) : (
          modulesList.map((m, mIdx) => (
            <div key={m.id} className="rounded-3xl border border-white/10 bg-card p-6 shadow-xs space-y-4">
              {/* Cabeçalho do Módulo com Foto de Capa Visível */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div className="flex items-center gap-4">
                  {/* Miniatura da Capa no Admin */}
                  <div className="relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted">
                    {m.cover ? (
                      <img
                        src={m.cover}
                        alt={m.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center bg-zinc-900 text-muted-foreground">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                        <span className="text-[9px] mt-0.5">Sem Capa</span>
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 rounded-md bg-black/80 px-1.5 py-0.5 text-[8px] font-mono text-gold backdrop-blur-xs">
                      {m.lessons.length} {m.lessons.length === 1 ? "aula" : "aulas"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                      Módulo {String(mIdx + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight">{m.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.subtitle || "Sem descrição rápida."}</p>
                  </div>
                </div>

                {/* Ações do Módulo */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleOpenEditModule(m)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs font-semibold hover:border-gold hover:text-gold transition shadow-xs"
                    title="Editar informações ou trocar foto de capa do módulo"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar Módulo
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModuleId(m.id);
                      setShowLessonModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Aula
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o módulo "${m.title}" e todas as suas aulas?`)) {
                        deleteModule(m.id);
                      }
                    }}
                    title="Excluir Módulo"
                    aria-label="Excluir Módulo"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border/50 text-muted-foreground hover:border-red-500 hover:text-red-500 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Aulas do Módulo */}
              <div className="divide-y divide-border/30">
                {m.lessons.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border/30 rounded-2xl my-2 bg-muted/10">
                    Nenhuma aula cadastrada neste módulo. Clique em &quot;Adicionar Aula&quot; para publicar o primeiro vídeo.
                  </div>
                ) : (
                  m.lessons.map((lesson, lIdx) => {
                    const badge = getVideoBadge(lesson.video_url);
                    return (
                      <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-accent/20 px-2 rounded-xl transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold text-xs font-mono font-bold border border-gold/20">
                            {lIdx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" /> {lesson.duration}
                              </span>
                              <span className="text-border">·</span>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[9px] font-semibold border ${badge.color}`}>
                                <Video className="h-2.5 w-2.5" /> {badge.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ações da Aula */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          {lesson.video_url && (
                            <button
                              onClick={() =>
                                setPreviewLesson({
                                  title: lesson.title,
                                  videoUrl: lesson.video_url,
                                  duration: lesson.duration,
                                  cover: m.cover,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/40 transition"
                              title="Testar player de vídeo"
                            >
                              <Eye className="h-3 w-3" /> Testar Player
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditLesson(m.id, lesson)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card px-2.5 py-1 text-xs font-semibold hover:border-gold hover:text-gold transition"
                            title="Editar aula"
                          >
                            <Pencil className="h-3 w-3" /> Editar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir a aula "${lesson.title}"?`)) {
                                deleteLesson(lesson.id);
                              }
                            }}
                            title="Excluir aula"
                            aria-label="Excluir aula"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-border/40 text-muted-foreground hover:border-red-500 hover:text-red-500 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: CRIAR NOVO MÓDULO (COM UPLOAD DE CAPA COMPLETO) */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleCreateModule}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold text-foreground">Novo Módulo de Treinamento</h3>
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Título do Módulo</span>
              <input
                value={modTitle}
                onChange={(e) => setModTitle(e.target.value)}
                placeholder="Ex: Tráfego Pago no TikTok e Meta Ads"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Subtítulo / Descrição Rápida</span>
              <input
                value={modSubtitle}
                onChange={(e) => setModSubtitle(e.target.value)}
                placeholder="Ex: Como estruturar campanhas de alta conversão para o Sérum"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
              />
            </label>

            {/* Upload de Capa */}
            <MediaUploadField
              label="Foto de Capa do Módulo"
              description="Envie uma imagem do seu computador, selecione uma arte oficial da Vellessa ou cole uma URL."
              value={modCover}
              onChange={setModCover}
              aspectRatio="portrait"
            />

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Módulo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: EDITAR MÓDULO EXISTENTE */}
      {editingModule && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleUpdateModule}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold text-foreground">Editar Módulo</h3>
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Título do Módulo</span>
              <input
                value={editModTitle}
                onChange={(e) => setEditModTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Subtítulo / Descrição Rápida</span>
              <input
                value={editModSubtitle}
                onChange={(e) => setEditModSubtitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
              />
            </label>

            {/* Upload de Capa */}
            <MediaUploadField
              label="Foto de Capa do Módulo"
              description="Envie uma imagem do seu computador, selecione uma arte oficial da Vellessa ou cole uma URL."
              value={editModCover}
              onChange={setEditModCover}
              aspectRatio="portrait"
            />

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingModule(null)}
                className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: CADASTRAR NOVA AULA */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleCreateLesson}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold text-foreground">Cadastrar Nova Aula</h3>
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Título da Aula</span>
              <input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Ex: Como Configurar o Pixel da Logzz"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
                required
              />
            </label>

            {/* Link do Vídeo - Largura Total com Detecção Automática */}
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Link do Vídeo (YouTube, Panda ou MP4)</span>
                <input
                  value={lessonVideoUrl}
                  onChange={(e) => handleNewVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                />
              </label>

              {/* Status Dinâmico de Duração */}
              {isDetectingNew ? (
                <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-2 text-xs text-gold animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                  <span>Calculando duração exata do vídeo no YouTube...</span>
                </div>
              ) : lessonDuration ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Duração calculada automaticamente: <strong className="font-mono text-emerald-200">{lessonDuration}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualNew(!showManualNew)}
                    className="text-[11px] text-muted-foreground hover:text-gold transition underline shrink-0 ml-2"
                  >
                    {showManualNew ? "Ocultar" : "Ajustar"}
                  </button>
                </div>
              ) : null}

              {/* Ajuste manual opcional (fallback) */}
              {showManualNew && (
                <div className="pt-1 animate-in fade-in">
                  <label className="block">
                    <span className="text-[11px] font-medium text-muted-foreground">Minutagem Manual (MM:SS)</span>
                    <input
                      value={lessonDuration}
                      onChange={(e) => setLessonDuration(e.target.value)}
                      placeholder="Ex: 14:20"
                      className="mt-1 h-9 w-36 rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Dica de Vídeo:
              </p>
              <p className="text-emerald-300/80 leading-relaxed">
                Recomendamos hospedar a aula como <strong>Não Listado no YouTube</strong>. O sistema calcula a duração real automaticamente ao colar o link!
              </p>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Descrição / Objetivos da Aula</span>
              <textarea
                value={lessonDescription}
                onChange={(e) => setLessonDescription(e.target.value)}
                rows={3}
                placeholder="Explique o que a aluna vai aprender e o passo a passo..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
              />
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowLessonModal(false)}
                className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Aula
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: EDITAR AULA EXISTENTE */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <form
            onSubmit={handleUpdateLesson}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-xl font-bold text-foreground">Editar Aula</h3>
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Título da Aula</span>
              <input
                value={editLessonTitle}
                onChange={(e) => setEditLessonTitle(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
                required
              />
            </label>

            {/* Link do Vídeo - Largura Total com Detecção Automática */}
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Link do Vídeo</span>
                <input
                  value={editLessonVideoUrl}
                  onChange={(e) => handleEditVideoUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                />
              </label>

              {/* Status de Duração Automática */}
              {isDetectingEdit ? (
                <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-2 text-xs text-gold animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                  <span>Calculando duração no YouTube...</span>
                </div>
              ) : editLessonDuration ? (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Duração: <strong className="font-mono text-emerald-200">{editLessonDuration}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={recheckEditDuration}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition"
                      title="Recalcular duração pelo YouTube"
                    >
                      <RefreshCw className="h-3 w-3" /> Recalcular
                    </button>
                    <span className="text-muted-foreground/40">·</span>
                    <button
                      type="button"
                      onClick={() => setShowManualEdit(!showManualEdit)}
                      className="text-[11px] text-muted-foreground hover:text-gold transition underline"
                    >
                      {showManualEdit ? "Ocultar" : "Ajustar"}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Ajuste manual opcional */}
              {showManualEdit && (
                <div className="pt-1 animate-in fade-in">
                  <label className="block">
                    <span className="text-[11px] font-medium text-muted-foreground">Minutagem Manual (MM:SS)</span>
                    <input
                      value={editLessonDuration}
                      onChange={(e) => setEditLessonDuration(e.target.value)}
                      placeholder="Ex: 14:20"
                      className="mt-1 h-9 w-36 rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono"
                    />
                  </label>
                </div>
              )}
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-foreground">Descrição / Objetivos da Aula</span>
              <textarea
                value={editLessonDescription}
                onChange={(e) => setEditLessonDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
              />
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingLesson(null)}
                className="rounded-xl border border-border/50 px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-5 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: TESTAR / PREVIEW DO PLAYER DE VÍDEO NO ADMIN */}
      {previewLesson && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewLesson(null)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Teste do Player — Visão da Afiliada
                </span>
                <h3 className="text-lg font-bold text-foreground">{previewLesson.title}</h3>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-accent transition"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
              <VideoPlayer
                title={previewLesson.title}
                videoUrl={previewLesson.videoUrl}
                duration={previewLesson.duration}
                cover={previewLesson.cover}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Link testado: <span className="font-mono text-foreground break-all">{previewLesson.videoUrl}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

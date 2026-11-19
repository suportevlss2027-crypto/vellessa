import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FolderPlus,
  Plus,
  Trash2,
  Video,
  Clock,
  Pencil,
  Image as ImageIcon,
  Eye,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  FileText,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Link2,
  File,
  AlignLeft,
} from "lucide-react";
import { useAffiliateStore, type DynamicModule } from "@/lib/affiliate-store";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { VideoPlayer } from "@/components/VideoPlayer";
import { type Lesson, type LessonMaterial } from "@/data/content";
import { detectVideoDuration } from "@/lib/video-duration";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/aulas")({
  head: () => ({
    meta: [{ title: "Gestão de Aulas — Vellessa CMS" }],
  }),
  component: AdminAulasPage,
});

function isDriveFolderUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes("/drive/folders/") || url.includes("/folders/");
}

type ContentType = "video" | "pdf" | "link" | "text";

function getLessonBadge(lesson: { video_url?: string; contentType?: ContentType; contentUrl?: string }) {
  const ct = lesson.contentType;
  if (ct === "pdf") return { label: "Documento PDF", color: "bg-amber-500/10 text-amber-400 border-amber-500/30", Icon: File };
  if (ct === "link") return { label: "Link / Ferramenta", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", Icon: Link2 };
  if (ct === "text") return { label: "Material de Leitura", color: "bg-violet-500/10 text-violet-400 border-violet-500/30", Icon: AlignLeft };

  // fallback: detectar pela URL do vídeo
  const url = lesson.video_url || "";
  if (!url) return { label: "Sem conteúdo", color: "bg-muted text-muted-foreground border-border/40", Icon: Video };
  const low = url.toLowerCase();
  if (low.includes("drive.google.com")) return { label: "Google Drive (0 MB)", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Icon: Video };
  if (low.includes("youtube") || low.includes("youtu.be")) return { label: "YouTube", color: "bg-red-500/10 text-red-400 border-red-500/30", Icon: Video };
  if (low.includes("pandavideo") || low.includes("vturb")) return { label: "Panda / VTurb", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", Icon: Video };
  if (low.includes("vimeo")) return { label: "Vimeo", color: "bg-blue-500/10 text-blue-400 border-blue-500/30", Icon: Video };
  if (low.includes(".mp4") || low.includes(".webm")) return { label: "MP4 Direto", color: "bg-gold/10 text-gold border-gold/30", Icon: Video };
  return { label: "Vídeo Externo", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", Icon: Video };
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
    forceSyncAllData,
    reorderModules,
    reorderLessons,
    syncModulesWithSupabase,
  } = useAffiliateStore();

  const [isSyncing, setIsSyncing] = useState(false);

  // Garante que o Admin sempre visualize a lista mais recente do Supabase ao abrir a página
  useEffect(() => {
    syncModulesWithSupabase(true);
  }, [syncModulesWithSupabase]);

  // ── Drag & Drop state ──────────────────────────────────────────────────────
  const [draggedModuleIdx, setDraggedModuleIdx] = useState<number | null>(null);
  const [dragOverModuleIdx, setDragOverModuleIdx] = useState<number | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<{ moduleId: string; index: number } | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<{ moduleId: string; index: number } | null>(null);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncAllData();
    } finally {
      setIsSyncing(false);
    }
  };

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
  const [lessonContentType, setLessonContentType] = useState<ContentType>("video");
  const [lessonContentUrl, setLessonContentUrl] = useState("");
  const [hasMaterialsNew, setHasMaterialsNew] = useState(false);
  const [materialsNew, setMaterialsNew] = useState<LessonMaterial[]>([]);
  const [isDetectingNew, setIsDetectingNew] = useState(false);
  const [showManualNew, setShowManualNew] = useState(false);

  // Modal / Form state for Editing Lesson
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonDescription, setEditLessonDescription] = useState("");
  const [editLessonContentType, setEditLessonContentType] = useState<ContentType>("video");
  const [editLessonContentUrl, setEditLessonContentUrl] = useState("");
  const [hasMaterialsEdit, setHasMaterialsEdit] = useState(false);
  const [materialsEdit, setMaterialsEdit] = useState<LessonMaterial[]>([]);
  const [isDetectingEdit, setIsDetectingEdit] = useState(false);
  const [showManualEdit, setShowManualEdit] = useState(false);

  // Modal state for Previewing Video in Admin
  const [previewLesson, setPreviewLesson] = useState<{
    title: string;
    videoUrl?: string;
    duration: string;
    cover: string;
  } | null>(null);

  // Body scroll lock — bloqueia rolagem da página enquanto qualquer modal estiver aberto
  const anyModalOpen =
    showModuleModal ||
    !!editingModule ||
    showLessonModal ||
    !!editingLesson ||
    !!previewLesson;

  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

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

  // ── Reorder Helpers ──────────────────────────────────────────────────────
  const handleMoveModule = (index: number, direction: "up" | "down") => {
    const newList = [...modulesList];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;
    [newList[index], newList[targetIdx]] = [newList[targetIdx], newList[index]];
    reorderModules(newList);
  };

  const handleMoveLesson = (moduleId: string, lessonIndex: number, direction: "up" | "down") => {
    const mod = modulesList.find((m) => m.id === moduleId);
    if (!mod) return;
    const newLessons = [...mod.lessons];
    const targetIdx = direction === "up" ? lessonIndex - 1 : lessonIndex + 1;
    if (targetIdx < 0 || targetIdx >= newLessons.length) return;
    [newLessons[lessonIndex], newLessons[targetIdx]] = [newLessons[targetIdx], newLessons[lessonIndex]];
    reorderLessons(moduleId, newLessons);
  };

  // ── Module Drag & Drop ───────────────────────────────────────────────────
  const handleModuleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedModuleIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleModuleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverModuleIdx(index);
  };
  const handleModuleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedModuleIdx === null || draggedModuleIdx === targetIdx) {
      setDraggedModuleIdx(null);
      setDragOverModuleIdx(null);
      return;
    }
    const newList = [...modulesList];
    const [removed] = newList.splice(draggedModuleIdx, 1);
    newList.splice(targetIdx, 0, removed);
    reorderModules(newList);
    setDraggedModuleIdx(null);
    setDragOverModuleIdx(null);
  };

  // ── Lesson Drag & Drop ───────────────────────────────────────────────────
  const handleLessonDragStart = (e: React.DragEvent, moduleId: string, index: number) => {
    e.stopPropagation();
    setDraggedLesson({ moduleId, index });
    e.dataTransfer.effectAllowed = "move";
  };
  const handleLessonDragOver = (e: React.DragEvent, moduleId: string, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverLesson({ moduleId, index });
  };
  const handleLessonDrop = (e: React.DragEvent, targetModuleId: string, targetIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedLesson || draggedLesson.moduleId !== targetModuleId || draggedLesson.index === targetIdx) {
      setDraggedLesson(null);
      setDragOverLesson(null);
      return;
    }
    const mod = modulesList.find((m) => m.id === targetModuleId);
    if (!mod) return;
    const newLessons = [...mod.lessons];
    const [removed] = newLessons.splice(draggedLesson.index, 1);
    newLessons.splice(targetIdx, 0, removed);
    reorderLessons(targetModuleId, newLessons);
    setDraggedLesson(null);
    setDragOverLesson(null);
  };

  // Video Duration Auto-Detection Handlers
  const handleNewVideoUrlChange = (url: string) => {
    setLessonVideoUrl(url);
    if (!url.trim()) return;

    if (url.includes("drive.google.com")) {
      setIsDetectingNew(false);
      setShowManualNew(true);
      // Não pré-preenche "10:00" falso: o admin deve informar o tempo real do vídeo
      return;
    }

    setIsDetectingNew(true);
    detectVideoDuration(url)
      .then((res) => {
        setIsDetectingNew(false);
        if (res.duration) {
          setLessonDuration(res.duration);
        } else {
          setShowManualNew(true);
        }
      })
      .catch(() => {
        setIsDetectingNew(false);
        setShowManualNew(true);
      });
  };

  const handleEditVideoUrlChange = (url: string) => {
    setEditLessonVideoUrl(url);
    if (!url.trim()) return;

    if (url.includes("drive.google.com")) {
      setIsDetectingEdit(false);
      setShowManualEdit(true);
      // Não pré-preenche "10:00" falso: o admin deve informar o tempo real do vídeo
      return;
    }

    setIsDetectingEdit(true);
    detectVideoDuration(url)
      .then((res) => {
        setIsDetectingEdit(false);
        if (res.duration) {
          setEditLessonDuration(res.duration);
        } else {
          setShowManualEdit(true);
        }
      })
      .catch(() => {
        setIsDetectingEdit(false);
        setShowManualEdit(true);
      });
  };

  const recheckEditDuration = () => {
    if (!editLessonVideoUrl.trim()) return;
    if (editLessonVideoUrl.includes("drive.google.com")) {
      setIsDetectingEdit(false);
      setShowManualEdit(true);
      return;
    }
    setIsDetectingEdit(true);
    detectVideoDuration(editLessonVideoUrl)
      .then((res) => {
        setIsDetectingEdit(false);
        if (res.duration) {
          setEditLessonDuration(res.duration);
        } else {
          setShowManualEdit(true);
        }
      })
      .catch(() => {
        setIsDetectingEdit(false);
        setShowManualEdit(true);
      });
  };

  // Handlers de Materiais Complementares - Nova Aula
  const handleAddMaterialNew = () => {
    setMaterialsNew((prev) => [...prev, { id: `mat-${Date.now()}-${prev.length}`, title: "", url: "" }]);
  };
  const handleUpdateMaterialNew = (idx: number, field: "title" | "url", value: string) => {
    setMaterialsNew((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };
  const handleRemoveMaterialNew = (idx: number) => {
    setMaterialsNew((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handlers de Materiais Complementares - Editar Aula
  const handleAddMaterialEdit = () => {
    setMaterialsEdit((prev) => [...prev, { id: `mat-${Date.now()}-${prev.length}`, title: "", url: "" }]);
  };
  const handleUpdateMaterialEdit = (idx: number, field: "title" | "url", value: string) => {
    setMaterialsEdit((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };
  const handleRemoveMaterialEdit = (idx: number) => {
    setMaterialsEdit((prev) => prev.filter((_, i) => i !== idx));
  };

  // Handlers for Lesson
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitle.trim() || !selectedModuleId) return;

    const filteredMaterials = hasMaterialsNew
      ? materialsNew
          .filter((m) => m.title.trim() && m.url.trim())
          .map((m) => ({ id: m.id || `mat-${Date.now()}`, title: m.title.trim(), url: m.url.trim() }))
      : [];

    await createLesson({
      moduleId: selectedModuleId,
      title: lessonTitle.trim(),
      duration: lessonDuration.trim() || "",
      videoUrl: lessonContentType === "video" ? lessonVideoUrl.trim() : "",
      description: lessonDescription.trim(),
      materials: filteredMaterials,
      contentType: lessonContentType,
      contentUrl: lessonContentType !== "video" ? lessonContentUrl.trim() : undefined,
    });
    setLessonTitle("");
    setLessonDuration("");
    setLessonVideoUrl("");
    setLessonDescription("");
    setLessonContentType("video");
    setLessonContentUrl("");
    setHasMaterialsNew(false);
    setMaterialsNew([]);
    setIsDetectingNew(false);
    setShowManualNew(false);
    setShowLessonModal(false);
  };

  const handleOpenEditLesson = (moduleId: string, lesson: Lesson) => {
    const existingMats = (lesson.materials || []).map((m) => ({ ...m }));
    setEditingLesson({ moduleId, lesson });
    setEditLessonTitle(lesson.title);
    setEditLessonDuration(lesson.duration || "");
    setEditLessonVideoUrl(lesson.video_url || "");
    setEditLessonDescription(lesson.description || "");
    setEditLessonContentType((lesson.contentType as ContentType) || "video");
    setEditLessonContentUrl(lesson.contentUrl || "");
    setHasMaterialsEdit(existingMats.length > 0);
    setMaterialsEdit(existingMats);
    setIsDetectingEdit(false);
    setShowManualEdit(false);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim()) return;

    const filteredMaterials = hasMaterialsEdit
      ? materialsEdit
          .filter((m) => m.title.trim() && m.url.trim())
          .map((m) => ({ id: m.id || `mat-${Date.now()}`, title: m.title.trim(), url: m.url.trim() }))
      : [];

    await updateLesson(editingLesson.moduleId, editingLesson.lesson.id, {
      title: editLessonTitle.trim(),
      duration: editLessonDuration.trim() || "",
      videoUrl: editLessonContentType === "video" ? editLessonVideoUrl.trim() : "",
      description: editLessonDescription.trim(),
      materials: filteredMaterials,
      contentType: editLessonContentType,
      contentUrl: editLessonContentType !== "video" ? editLessonContentUrl.trim() : undefined,
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
            Crie novos módulos com capa personalizada, configure links de vídeo e organize a trilha de capacitação dos afiliados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-card/60 px-4 py-2.5 text-xs font-semibold text-foreground hover:border-gold/40 hover:text-gold transition disabled:opacity-50"
            title="Garante que todas as aulas estejam salvas na nuvem para visualização de todos os afiliados do Brasil"
          >
            <RefreshCw className={cn("h-4 w-4 text-gold", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Sincronizando..." : "Sincronizar com a Nuvem"}</span>
          </button>
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
            <div
              key={m.id}
              draggable
              onDragStart={(e) => handleModuleDragStart(e, mIdx)}
              onDragOver={(e) => handleModuleDragOver(e, mIdx)}
              onDrop={(e) => handleModuleDrop(e, mIdx)}
              onDragEnd={() => { setDraggedModuleIdx(null); setDragOverModuleIdx(null); }}
              className={cn(
                "rounded-3xl border bg-card p-6 shadow-xs space-y-4 transition-all duration-150",
                draggedModuleIdx === mIdx ? "opacity-40 scale-[0.98] border-gold/30" : "border-white/10",
                dragOverModuleIdx === mIdx && draggedModuleIdx !== mIdx ? "border-gold ring-1 ring-gold/30 bg-card/80" : ""
              )}
            >
              {/* Cabeçalho do Módulo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                <div className="flex items-center gap-4">
                  {/* Drag Handle + Reorder Arrows */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      title="Arrastar para reordenar"
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-gold transition"
                    >
                      <GripVertical className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      disabled={mIdx === 0}
                      onClick={() => handleMoveModule(mIdx, "up")}
                      title="Mover módulo para cima"
                      className="grid h-5 w-5 place-items-center rounded text-muted-foreground/50 hover:text-gold hover:bg-gold/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={mIdx === modulesList.length - 1}
                      onClick={() => handleMoveModule(mIdx, "down")}
                      title="Mover módulo para baixo"
                      className="grid h-5 w-5 place-items-center rounded text-muted-foreground/50 hover:text-gold hover:bg-gold/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

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
                    Nenhuma aula cadastrada neste módulo. Clique em &quot;Adicionar Aula&quot; para publicar o primeiro conteúdo.
                  </div>
                ) : (
                  m.lessons.map((lesson, lIdx) => {
                    const badge = getLessonBadge(lesson);
                    const BadgeIcon = badge.Icon;
                    const isDraggingThis = draggedLesson?.moduleId === m.id && draggedLesson?.index === lIdx;
                    const isDragOverThis = dragOverLesson?.moduleId === m.id && dragOverLesson?.index === lIdx;
                    return (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => handleLessonDragStart(e, m.id, lIdx)}
                        onDragOver={(e) => handleLessonDragOver(e, m.id, lIdx)}
                        onDrop={(e) => handleLessonDrop(e, m.id, lIdx)}
                        onDragEnd={(e) => {
                          e.stopPropagation();
                          setDraggedLesson(null);
                          setDragOverLesson(null);
                        }}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-xl transition",
                          isDraggingThis ? "opacity-40" : "hover:bg-accent/20",
                          isDragOverThis && !isDraggingThis ? "bg-gold/5 border border-gold/20" : ""
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Lesson reorder controls */}
                          <div className="flex flex-col items-center gap-0 shrink-0">
                            <button
                              type="button"
                              title="Arrastar para reordenar aula"
                              className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-gold/60 transition"
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={lIdx === 0}
                              onClick={() => handleMoveLesson(m.id, lIdx, "up")}
                              title="Subir aula"
                              className="grid h-4 w-4 place-items-center rounded text-muted-foreground/40 hover:text-gold hover:bg-gold/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              disabled={lIdx === m.lessons.length - 1}
                              onClick={() => handleMoveLesson(m.id, lIdx, "down")}
                              title="Descer aula"
                              className="grid h-4 w-4 place-items-center rounded text-muted-foreground/40 hover:text-gold hover:bg-gold/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold text-xs font-mono font-bold border border-gold/20">
                            {lIdx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.duration && (
                                <>
                                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                                    <Clock className="h-3 w-3" /> {lesson.duration}
                                  </span>
                                  <span className="text-border">·</span>
                                </>
                              )}
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold border ${badge.color}`}>
                                <BadgeIcon className="h-2.5 w-2.5" /> {badge.label}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateModule}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
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

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
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
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleUpdateModule}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
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

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
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
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateLesson}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
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

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
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

              {/* Tipo de Aula — Segmented Control */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">Tipo de Aula</span>
                <div className="mt-1 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-background p-1">
                  {([ ["video", "🎥", "Vídeo Aula"], ["pdf", "📄", "PDF / Doc"], ["link", "🔗", "Link"], ["text", "📝", "Texto"] ] as const).map(([ct, icon, label]) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => setLessonContentType(ct)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition",
                        lessonContentType === ct
                          ? "bg-gold text-black shadow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos condicionais por tipo */}
              {lessonContentType === "video" && (
                <>
                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-foreground">Link do Vídeo (Google Drive, YouTube, Panda ou MP4)</span>
                      <input
                        value={lessonVideoUrl}
                        onChange={(e) => handleNewVideoUrlChange(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... ou YouTube, Panda, MP4"
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                      />
                    </label>

                    {isDriveFolderUrl(lessonVideoUrl) && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200 animate-in fade-in">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold text-amber-300">Link de Pasta do Google Drive Detectado</strong>
                          <span className="leading-relaxed">
                            Para aulas individuais, abra a pasta no Google Drive, clique com o botão direito no arquivo de vídeo específico desta aula e selecione &quot;Compartilhar &gt; Copiar link&quot;.
                          </span>
                        </div>
                      </div>
                    )}

                    {lessonVideoUrl.includes("drive.google.com") && !isDriveFolderUrl(lessonVideoUrl) && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs text-emerald-300 animate-in fade-in">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Vídeo do <strong>Google Drive</strong> conectado com sucesso · <strong>0 MB consumidos no Supabase</strong></span>
                      </div>
                    )}

                    {/* Status Dinâmico de Duração */}
                    {isDetectingNew ? (
                      <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-2 text-xs text-gold animate-pulse">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                        <span>Identificando plataforma e duração do vídeo...</span>
                      </div>
                    ) : lessonDuration ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs">
                        <div className="flex items-center gap-2 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>Duração da aula: <strong className="font-mono text-emerald-200">{lessonDuration}</strong></span>
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

                    {/* Ajuste manual obrigatório para Google Drive */}
                    {showManualNew && (
                      <div className="pt-1 animate-in fade-in space-y-1.5">
                        <label className="block">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Minutagem da Aula (MM:SS)
                          </span>
                          <input
                            value={lessonDuration}
                            onChange={(e) => setLessonDuration(e.target.value)}
                            placeholder="Ex: 14:20"
                            autoFocus
                            className="mt-1 h-9 w-36 rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono"
                          />
                        </label>
                        {!lessonDuration.trim() && (
                          <p className="text-[11px] text-amber-400 flex items-center gap-1">
                            ⚠️ Informe o tempo real do vídeo (ex: 14:20) — o Google Drive não fornece duração automaticamente.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Dica de Hospedagem:
                    </p>
                    <p className="text-emerald-300/80 leading-relaxed">
                      Compatível com <strong>Google Drive</strong> (custo 0 de storage, certifique-se de que o acesso está como &quot;Qualquer pessoa com o link&quot;), <strong>YouTube</strong> (não listado), <strong>Panda Video</strong> e arquivos <strong>MP4</strong>.
                    </p>
                  </div>
                </>
              )}

              {/* Campos para PDF e Link */}
              {(lessonContentType === "pdf" || lessonContentType === "link") && (
                <label className="block animate-in fade-in">
                  <span className="text-xs font-semibold text-foreground">
                    {lessonContentType === "pdf" ? "URL do Documento / PDF" : "URL do Link / Ferramenta"}
                  </span>
                  <input
                    value={lessonContentUrl}
                    onChange={(e) => setLessonContentUrl(e.target.value)}
                    placeholder={lessonContentType === "pdf" ? "https://drive.google.com/file/d/... ou link direto do PDF" : "https://app.minha-ferramenta.com/..."}
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {lessonContentType === "pdf"
                      ? "Cole o link de compartilhamento do Google Drive ou uma URL pública do PDF."
                      : "Cole a URL da ferramenta, curso externo, ou recurso que o aluno vai acessar."}
                  </p>
                </label>
              )}

              {/* Campo de texto rico para aulas do tipo Texto */}
              {lessonContentType === "text" && (
                <label className="block animate-in fade-in">
                  <span className="text-xs font-semibold text-foreground">Conteúdo de Leitura</span>
                  <textarea
                    value={lessonContentUrl}
                    onChange={(e) => setLessonContentUrl(e.target.value)}
                    rows={6}
                    placeholder="Escreva o material de leitura desta aula aqui..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-foreground">Descrição / Objetivos da Aula</span>
                <textarea
                  value={lessonDescription}
                  onChange={(e) => setLessonDescription(e.target.value)}
                  rows={3}
                  placeholder="Explique o que o aluno vai aprender e o passo a passo..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
                />
              </label>

              {/* Seção Opcional de Materiais Complementares */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gold" />
                      Materiais Complementares da Aula
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Disponibilizar arquivos reais para download ou links do Google Drive/PDF.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMaterialsNew}
                      onChange={(e) => {
                        setHasMaterialsNew(e.target.checked);
                        if (e.target.checked && materialsNew.length === 0) {
                          setMaterialsNew([{ id: `mat-${Date.now()}`, title: "", url: "" }]);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>

                {hasMaterialsNew && (
                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-background/50 p-3.5 animate-in fade-in">
                    {materialsNew.map((mat, idx) => (
                      <div key={mat.id || idx} className="flex items-center gap-2">
                        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={mat.title}
                            onChange={(e) => handleUpdateMaterialNew(idx, "title", e.target.value)}
                            placeholder="Nome do arquivo (ex: Resumo da Aula.pdf)"
                            className="h-9 w-full rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition"
                          />
                          <input
                            value={mat.url}
                            onChange={(e) => handleUpdateMaterialNew(idx, "url", e.target.value)}
                            placeholder="Link do arquivo (Google Drive, PDF, etc.)"
                            className="h-9 w-full rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono text-[11px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialNew(idx)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/50 text-muted-foreground hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remover material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMaterialNew}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 py-1.5 text-xs text-muted-foreground hover:border-gold hover:text-gold transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Outro Material
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleUpdateLesson}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
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

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Título da Aula</span>
                <input
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition"
                  required
                />
              </label>

              {/* Tipo de Aula — Segmented Control */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">Tipo de Aula</span>
                <div className="mt-1 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-background p-1">
                  {([ ["video", "🎥", "Vídeo Aula"], ["pdf", "📄", "PDF / Doc"], ["link", "🔗", "Link"], ["text", "📝", "Texto"] ] as const).map(([ct, icon, label]) => (
                    <button
                      key={ct}
                      type="button"
                      onClick={() => setEditLessonContentType(ct)}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-semibold transition",
                        editLessonContentType === ct
                          ? "bg-gold text-black shadow"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos condicionais por tipo */}
              {editLessonContentType === "video" && (
                <div className="space-y-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-foreground">Link do Vídeo (Google Drive, YouTube, Panda ou MP4)</span>
                    <input
                      value={editLessonVideoUrl}
                      onChange={(e) => handleEditVideoUrlChange(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... ou YouTube, Panda, MP4"
                      className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                    />
                  </label>

                  {isDriveFolderUrl(editLessonVideoUrl) && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200 animate-in fade-in">
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold text-amber-300">Link de Pasta do Google Drive Detectado</strong>
                        <span className="leading-relaxed">
                          Para aulas individuais, abra a pasta no Google Drive, clique com o botão direito no arquivo de vídeo específico desta aula e selecione &quot;Compartilhar &gt; Copiar link&quot;.
                        </span>
                      </div>
                    </div>
                  )}

                  {editLessonVideoUrl.includes("drive.google.com") && !isDriveFolderUrl(editLessonVideoUrl) && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2 text-xs text-emerald-300 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Vídeo do <strong>Google Drive</strong> conectado com sucesso · <strong>0 MB consumidos no Supabase</strong></span>
                    </div>
                  )}

                  {/* Status de Duração Automática */}
                  {isDetectingEdit ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 px-3.5 py-2 text-xs text-gold animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                      <span>Identificando plataforma e duração do vídeo...</span>
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
                          title="Recalcular duração pelo link"
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

                  {/* Ajuste manual obrigatório para Google Drive */}
                  {showManualEdit && (
                    <div className="pt-1 animate-in fade-in space-y-1.5">
                      <label className="block">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Minutagem da Aula (MM:SS)
                        </span>
                        <input
                          value={editLessonDuration}
                          onChange={(e) => setEditLessonDuration(e.target.value)}
                          placeholder="Ex: 14:20"
                          autoFocus
                          className="mt-1 h-9 w-36 rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono"
                        />
                      </label>
                      {!editLessonDuration.trim() && (
                        <p className="text-[11px] text-amber-400 flex items-center gap-1">
                          ⚠️ Informe o tempo real do vídeo (ex: 14:20) — o Google Drive não fornece duração automaticamente.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PDF / Link URL field */}
              {(editLessonContentType === "pdf" || editLessonContentType === "link") && (
                <label className="block animate-in fade-in">
                  <span className="text-xs font-semibold text-foreground">
                    {editLessonContentType === "pdf" ? "URL do Documento / PDF" : "URL do Link / Ferramenta"}
                  </span>
                  <input
                    value={editLessonContentUrl}
                    onChange={(e) => setEditLessonContentUrl(e.target.value)}
                    placeholder={editLessonContentType === "pdf" ? "https://drive.google.com/file/d/... ou link direto do PDF" : "https://app.minha-ferramenta.com/..."}
                    className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-background px-3 text-sm outline-none focus:border-gold transition font-mono text-xs"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {editLessonContentType === "pdf"
                      ? "Cole o link de compartilhamento do Google Drive ou uma URL pública do PDF."
                      : "Cole a URL da ferramenta, curso externo, ou recurso que o aluno vai acessar."}
                  </p>
                </label>
              )}

              {/* Texto de leitura */}
              {editLessonContentType === "text" && (
                <label className="block animate-in fade-in">
                  <span className="text-xs font-semibold text-foreground">Conteúdo de Leitura</span>
                  <textarea
                    value={editLessonContentUrl}
                    onChange={(e) => setEditLessonContentUrl(e.target.value)}
                    rows={6}
                    placeholder="Escreva o material de leitura desta aula aqui..."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
                  />
                </label>
              )}

              <label className="block">
                <span className="text-xs font-semibold text-foreground">Descrição / Objetivos da Aula</span>
                <textarea
                  value={editLessonDescription}
                  onChange={(e) => setEditLessonDescription(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-3 text-sm outline-none focus:border-gold transition"
                />
              </label>

              {/* Seção Opcional de Materiais Complementares */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gold" />
                      Materiais Complementares da Aula
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Disponibilizar arquivos reais para download ou links do Google Drive/PDF.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMaterialsEdit}
                      onChange={(e) => {
                        setHasMaterialsEdit(e.target.checked);
                        if (e.target.checked && materialsEdit.length === 0) {
                          setMaterialsEdit([{ id: `mat-${Date.now()}`, title: "", url: "" }]);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>

                {hasMaterialsEdit && (
                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-background/50 p-3.5 animate-in fade-in">
                    {materialsEdit.map((mat, idx) => (
                      <div key={mat.id || idx} className="flex items-center gap-2">
                        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            value={mat.title}
                            onChange={(e) => handleUpdateMaterialEdit(idx, "title", e.target.value)}
                            placeholder="Nome do arquivo (ex: Resumo da Aula.pdf)"
                            className="h-9 w-full rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition"
                          />
                          <input
                            value={mat.url}
                            onChange={(e) => handleUpdateMaterialEdit(idx, "url", e.target.value)}
                            placeholder="Link do arquivo (Google Drive, PDF, etc.)"
                            className="h-9 w-full rounded-xl border border-white/10 bg-background px-3 text-xs outline-none focus:border-gold transition font-mono text-[11px]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterialEdit(idx)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/50 text-muted-foreground hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remover material"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMaterialEdit}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 py-1.5 text-xs text-muted-foreground hover:border-gold hover:text-gold transition"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar Outro Material
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewLesson(null)}
        >
          <div
            className="relative w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                  Teste do Player — Visão do Afiliado
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

            {/* Conteúdo com scroll seguro */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black">
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
        </div>
      )}
    </div>
  );
}

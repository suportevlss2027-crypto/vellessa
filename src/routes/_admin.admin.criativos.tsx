import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  CornerDownRight,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  MoveRight,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAffiliateStore,
  type CreativeFolder,
} from "@/lib/affiliate-store";
import { type Creative } from "@/data/content";
import MediaUploadField from "@/components/admin/MediaUploadField";

export const Route = createFileRoute("/_admin/admin/criativos")({
  head: () => ({
    meta: [{ title: "Gestão de Criativos — Vellessa CMS" }],
  }),
  component: AdminCriativosPage,
});

type CreativeType = "Feed" | "Stories" | "Reels" | "Copy";

const FOLDER_COLORS = [
  { label: "Ouro", value: "gold" },
  { label: "Esmeralda", value: "emerald" },
  { label: "Rosa", value: "rose" },
  { label: "Violeta", value: "violet" },
  { label: "Céu", value: "sky" },
  { label: "Âmbar", value: "amber" },
];

const COLOR_MAP: Record<string, string> = {
  gold: "text-gold bg-gold/15 border-gold/30 hover:border-gold/60",
  emerald: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 hover:border-emerald-500/60",
  rose: "text-rose-400 bg-rose-500/15 border-rose-500/30 hover:border-rose-500/60",
  violet: "text-violet-400 bg-violet-500/15 border-violet-500/30 hover:border-violet-500/60",
  sky: "text-sky-400 bg-sky-500/15 border-sky-500/30 hover:border-sky-500/60",
  amber: "text-amber-400 bg-amber-500/15 border-amber-500/30 hover:border-amber-500/60",
};

const COLOR_DOT: Record<string, string> = {
  gold: "bg-gold",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
};

/**
 * Utilitário para detecção inteligente e instantânea de dimensões e duração
 */
async function detectCreativeMetadata(file: File): Promise<{
  detectedFormat: string;
  suggestedType: CreativeType;
}> {
  // Se for imagem
  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        URL.revokeObjectURL(objUrl);
        const ratio = w / h;

        let suggestedType: CreativeType = "Feed";
        if (ratio < 0.7) {
          suggestedType = "Stories";
        } else if (ratio >= 0.85 && ratio <= 1.15) {
          suggestedType = "Feed";
        } else {
          suggestedType = "Feed";
        }

        resolve({
          detectedFormat: `${w}×${h}`,
          suggestedType,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve({ detectedFormat: "1080×1080", suggestedType: "Feed" });
      };
      img.src = objUrl;
    });
  }

  // Se for vídeo
  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const objUrl = URL.createObjectURL(file);
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const w = video.videoWidth;
        const h = video.videoHeight;
        const dur = video.duration || 0;
        URL.revokeObjectURL(objUrl);

        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;

        const formatStr = w && h ? `${w}×${h} · ${durationStr}` : `Vídeo ${durationStr}`;
        const ratio = w && h ? w / h : 0.5625;

        const suggestedType: CreativeType = ratio < 0.75 ? "Reels" : "Reels";

        resolve({
          detectedFormat: formatStr,
          suggestedType,
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(objUrl);
        resolve({ detectedFormat: "Vídeo 0:30", suggestedType: "Reels" });
      };

      video.src = objUrl;
    });
  }

  return { detectedFormat: "Texto", suggestedType: "Copy" };
}

function AdminCriativosPage() {
  const {
    creativesList,
    creativeFoldersList,
    createCreative,
    updateCreative,
    deleteCreative,
    createCreativeFolder,
    updateCreativeFolder,
    deleteCreativeFolder,
    moveCreativesToFolder,
    deleteCreativesBatch,
    copyText,
  } = useAffiliateStore();

  // ── ESTADO DE NAVEGAÇÃO E VISUALIZAÇÃO ─────────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");

  // ── SELEÇÃO EM MASSA ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetMoveFolderId, setTargetMoveFolderId] = useState<string>("");
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  // ── MODAL PASTA ───────────────────────────────────────────────────────────
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("gold");

  // ── MODAL CRIAR CRIATIVO ──────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CreativeType>("Feed");
  const [format, setFormat] = useState("1080×1080");
  const [imageUrl, setImageUrl] = useState("");
  const [copyBody, setCopyBody] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // ── MODAL EDITAR CRIATIVO ─────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<CreativeType>("Feed");
  const [editFormat, setEditFormat] = useState("1080×1080");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCopyBody, setEditCopyBody] = useState("");
  const [editSelectedFolderId, setEditSelectedFolderId] = useState<string>("");

  // Scroll lock para evitar duplo scrollbar
  const anyModalOpen = showCreateModal || editId !== null || showFolderModal;
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

  // Limpa seleção ao mudar de pasta
  useEffect(() => {
    setSelectedIds(new Set());
    setShowMoveDropdown(false);
  }, [currentFolderId]);

  // ── PASTA ATUAL ───────────────────────────────────────────────────────────
  const currentFolder = useMemo(
    () => creativeFoldersList.find((f) => f.id === currentFolderId),
    [creativeFoldersList, currentFolderId]
  );

  // ── FILTRAGEM DE CRIATIVOS ────────────────────────────────────────────────
  const displayedCreatives = useMemo(() => {
    return creativesList.filter((c) => {
      // Filtro por tipo
      if (filterType !== "all" && c.type !== filterType) {
        return false;
      }

      // Filtro por busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.title.toLowerCase().includes(q) ||
          c.format.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          (c.text && c.text.toLowerCase().includes(q))
        );
      }

      // Navegação por pasta: se estiver dentro de uma pasta, exibe apenas os dela
      if (currentFolderId) {
        return c.folderId === currentFolderId;
      }

      // Na raiz: exibe apenas os avulsos (sem pasta atribuída)
      return !c.folderId;
    });
  }, [creativesList, currentFolderId, searchQuery, filterType]);

  // Contagem de itens por pasta
  const countByFolder = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of creativesList) {
      if (c.folderId) {
        map[c.folderId] = (map[c.folderId] || 0) + 1;
      }
    }
    return map;
  }, [creativesList]);

  // ── HANDLERS DE SELEÇÃO EM MASSA ──────────────────────────────────────────
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayedCreatives.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedCreatives.map((c) => c.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      window.confirm(
        `Tem certeza que deseja excluir os ${count} criativo(s) selecionado(s)? Esta ação não pode ser desfeita.`
      )
    ) {
      await deleteCreativesBatch(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBatchMove = async (targetId: string) => {
    if (selectedIds.size === 0) return;
    await moveCreativesToFolder(
      Array.from(selectedIds),
      targetId === "root" ? undefined : targetId
    );
    setSelectedIds(new Set());
    setShowMoveDropdown(false);
  };

  // ── DETECÇÃO AUTOMÁTICA DE FORMATO E TIPO ─────────────────────────────────
  const handleFileDetected = async (file: File) => {
    try {
      const { detectedFormat, suggestedType } = await detectCreativeMetadata(file);
      setFormat(detectedFormat);
      setType(suggestedType);
      setIsAutoDetected(true);
      toast.success(
        `Metadados detectados: ${detectedFormat} (${suggestedType})!`,
        { icon: "⚡" }
      );
    } catch {
      // Ignora silenciosamente mantendo valores atuais
    }
  };

  const handleEditFileDetected = async (file: File) => {
    try {
      const { detectedFormat, suggestedType } = await detectCreativeMetadata(file);
      setEditFormat(detectedFormat);
      setEditType(suggestedType);
      toast.success(`Formato atualizado: ${detectedFormat}!`, { icon: "⚡" });
    } catch {
      // Ignora silenciosamente
    }
  };

  const formatForType = (t: CreativeType) => {
    if (t === "Stories") return "1080×1920";
    if (t === "Feed") return "1080×1080";
    if (t === "Reels") return "1080×1920 · 0:30";
    return "Texto";
  };

  // ── MODAL PASTA HANDLERS ──────────────────────────────────────────────────
  const openNewFolderModal = () => {
    setEditFolderId(null);
    setFolderName("");
    setFolderDescription("");
    setFolderColor("gold");
    setShowFolderModal(true);
  };

  const openEditFolderModal = (f: CreativeFolder) => {
    setEditFolderId(f.id);
    setFolderName(f.name);
    setFolderDescription(f.description || "");
    setFolderColor(f.color || "gold");
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    if (editFolderId) {
      await updateCreativeFolder(editFolderId, {
        name: folderName,
        description: folderDescription,
        color: folderColor,
      });
    } else {
      await createCreativeFolder({
        name: folderName,
        description: folderDescription,
        color: folderColor,
      });
    }
    setShowFolderModal(false);
  };

  const handleDeleteFolder = (id: string, name: string) => {
    if (
      window.confirm(
        `Excluir a pasta "${name}"? Os criativos dentro dela não serão apagados, apenas movidos para a raiz geral.`
      )
    ) {
      deleteCreativeFolder(id);
      if (currentFolderId === id) setCurrentFolderId(null);
    }
  };

  // ── MODAL CRIATIVO HANDLERS ───────────────────────────────────────────────
  const openCreateModal = () => {
    setTitle("");
    setType("Feed");
    setFormat("1080×1080");
    setImageUrl("");
    setCopyBody("");
    setSelectedFolderId(currentFolderId || "");
    setIsAutoDetected(false);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createCreative({
      title: title.trim(),
      type,
      format: format.trim(),
      image: imageUrl || undefined,
      text: copyBody.trim() || undefined,
      folderId: selectedFolderId || undefined,
    });

    setShowCreateModal(false);
  };

  const openEdit = (c: Creative) => {
    setEditId(c.id);
    setEditTitle(c.title);
    setEditType(c.type as CreativeType);
    setEditFormat(c.format);
    setEditImageUrl(c.image ?? "");
    setEditCopyBody(c.text ?? "");
    setEditSelectedFolderId(c.folderId || "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    await updateCreative(editId, {
      title: editTitle.trim(),
      type: editType,
      format: editFormat.trim(),
      image: editImageUrl || undefined,
      text: editCopyBody.trim() || undefined,
      folderId: editSelectedFolderId || undefined,
    });

    setEditId(null);
  };

  const handleDeleteOne = (id: string) => {
    if (window.confirm("Excluir este criativo definitivamente?")) {
      deleteCreative(id);
      if (selectedIds.has(id)) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    }
  };

  // ── TYPE BADGE COLOURS ────────────────────────────────────────────────────
  const typeBadge: Record<CreativeType, string> = {
    Feed: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Stories: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    Reels: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    Copy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
              Vellessa CMS
            </span>
            <span className="text-xs text-muted-foreground">
              {creativesList.length} peças cadastradas
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight">
            Central de Criativos de Anúncio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Cadastre e organize peças validadas para Feed, Stories, Reels e Copys persuasivas. Suporte completo a pastas, seleção em massa e detecção inteligente de formato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewFolderModal}
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted hover:border-gold/40 transition shadow-xs"
          >
            <FolderPlus className="h-4 w-4 text-gold" />
            <span>Nova Pasta</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Criativo</span>
          </button>
        </div>
      </div>

      {/* ── BREADCRUMB / CONTEXTO ESPACIAL ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 sm:px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition font-medium ${
              !currentFolderId
                ? "bg-gold/15 text-gold font-semibold border border-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Raiz Geral</span>
          </button>

          {currentFolder && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/15 text-gold font-semibold border border-gold/30">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>{currentFolder.name}</span>
                <span className="ml-1 text-[10px] opacity-75">
                  ({displayedCreatives.length})
                </span>
              </div>
            </>
          )}

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition"
              title="Voltar para a raiz"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar à raiz
            </button>
          )}
        </div>

        {/* Controles de Busca, Tipo e Grid/Lista */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar criativo..."
              className="h-8 w-full rounded-xl border border-border/60 bg-background/80 pl-8 pr-7 text-xs outline-none focus:border-gold transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filtro por Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-xl border border-border/60 bg-background/80 px-2.5 text-xs text-foreground outline-none focus:border-gold"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Feed">Feed (1:1)</option>
            <option value="Stories">Stories (9:16)</option>
            <option value="Reels">Reels / Vídeos</option>
            <option value="Copy">Copys</option>
          </select>

          {/* Toggle Grid / Lista */}
          <div className="flex items-center rounded-xl border border-border/60 bg-background/60 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list"
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Lista"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO DE PASTAS (EXIBIDA NA RAIZ OU QUANDO NÃO HÁ BUSCA FILTRADA) ── */}
      {!currentFolderId && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Folder className="h-4 w-4 text-gold" />
              <span>Pastas Organizadoras</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({creativeFoldersList.length})
              </span>
            </h2>
            <button
              onClick={openNewFolderModal}
              className="text-xs text-gold hover:underline font-medium inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Criar nova pasta
            </button>
          </div>

          {creativeFoldersList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center bg-card/20">
              <Folder className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-foreground">
                Nenhuma pasta de criativos criada ainda
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Organize seus criativos por campanha, público ou época do ano para facilitar para seus afiliados.
              </p>
              <button
                onClick={openNewFolderModal}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/20 transition"
              >
                <Plus className="h-3 w-3" /> Criar primeira pasta
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {creativeFoldersList.map((folder) => {
                const count = countByFolder[folder.id] || 0;
                const colorTheme = COLOR_MAP[folder.color || "gold"] || COLOR_MAP.gold;
                const dotColor = COLOR_DOT[folder.color || "gold"] || COLOR_DOT.gold;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="group relative cursor-pointer rounded-2xl border border-border/70 bg-card/60 p-3.5 transition-all hover:border-gold/50 hover:bg-card hover:shadow-gold flex flex-col justify-between backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-xl border transition ${colorTheme}`}
                        >
                          <Folder className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-gold transition">
                            {folder.name}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">
                            {count} {count === 1 ? "criativo" : "criativos"}
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openEditFolderModal(folder)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-gold hover:bg-muted transition"
                          title="Editar pasta"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder.id, folder.name)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition"
                          title="Excluir pasta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {folder.description && (
                      <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
                        {folder.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        <span>Abrir pasta</span>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BARRA DE AÇÕES DA SELEÇÃO ATUAL ─────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-medium"
          >
            <CheckSquare className="h-3.5 w-3.5 text-gold" />
            <span>
              {selectedIds.size === displayedCreatives.length && displayedCreatives.length > 0
                ? "Desmarcar todos"
                : "Selecionar todos nesta visualização"}
            </span>
          </button>

          {selectedIds.size > 0 && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
              {selectedIds.size} selecionado(s)
            </span>
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          Mostrando {displayedCreatives.length} de {creativesList.length} criativos
        </span>
      </div>

      {/* ── GRID / LISTA DE CRIATIVOS ──────────────────────────────────── */}
      {displayedCreatives.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-16 text-center bg-card/20">
          <Copy className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery
              ? "Nenhum criativo encontrado com este termo."
              : currentFolder
              ? `Esta pasta "${currentFolder.name}" ainda está vazia.`
              : "Nenhum criativo avulso cadastrado."}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? "Tente buscar por outro termo ou limpe o campo de busca."
              : "Adicione peças de alta conversão para seus afiliados usarem em suas campanhas."}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
          >
            <Plus className="h-4 w-4" /> Cadastrar Criativo
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* VISUALIZAÇÃO EM GRADE */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedCreatives.map((c) => {
            const isSelected = selectedIds.has(c.id);
            const folderOfItem = creativeFoldersList.find((f) => f.id === c.folderId);

            return (
              <div
                key={c.id}
                className={`group relative rounded-2xl border bg-card/70 shadow-xs flex flex-col overflow-hidden transition-all duration-200 backdrop-blur-sm ${
                  isSelected
                    ? "border-gold ring-2 ring-gold/40 shadow-gold"
                    : "border-border/70 hover:border-gold/40 hover:shadow-md"
                }`}
              >
                {/* CHECKBOX DE SELEÇÃO NO TOPO */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectOne(c.id);
                  }}
                  className={`absolute top-2.5 left-2.5 z-20 cursor-pointer grid h-6 w-6 place-items-center rounded-lg border transition ${
                    isSelected
                      ? "bg-gold text-primary-foreground border-gold shadow-xs"
                      : "bg-black/60 text-transparent border-white/30 backdrop-blur-md opacity-0 group-hover:opacity-100 hover:border-white"
                  }`}
                  title={isSelected ? "Desmarcar" : "Selecionar"}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>

                {/* IMAGEM OU PREVIEW */}
                {c.image ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted/60">
                    <img
                      src={c.image}
                      alt={c.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                    {/* Selo do Tipo */}
                    <span
                      className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${
                        typeBadge[c.type as CreativeType] || "bg-accent text-gold"
                      }`}
                    >
                      {c.type}
                    </span>

                    {/* Badge de Formato */}
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20 backdrop-blur-md">
                      {c.format}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 pt-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          typeBadge[c.type as CreativeType] || "bg-accent text-gold"
                        }`}
                      >
                        {c.type}
                      </span>
                      {folderOfItem && (
                        <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                          <Folder className="h-2.5 w-2.5" />
                          {folderOfItem.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{c.format}</span>
                  </div>
                )}

                {/* CORPO DO CARD */}
                <div className="flex flex-1 flex-col p-4 pt-3 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-gold transition">
                      {c.title}
                    </h3>
                  </div>

                  {c.text && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {c.text}
                    </p>
                  )}

                  {/* Informação de pasta se estiver buscando */}
                  {searchQuery && folderOfItem && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gold/80">
                      <Folder className="h-3 w-3" />
                      <span>Pasta: {folderOfItem.name}</span>
                    </div>
                  )}

                  {/* FOOTER DO CARD */}
                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                    <span className="text-[10px] text-muted-foreground">
                      Disponível para afiliados
                    </span>

                    <div className="flex items-center gap-1">
                      {c.text && (
                        <button
                          onClick={() => copyText(c.text || "", "Copy copiada!")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-muted transition"
                          title="Copiar texto da copy"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-gold hover:bg-muted transition"
                        title="Editar criativo"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteOne(c.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition"
                        title="Excluir criativo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM LISTA */
        <div className="rounded-2xl border border-border/70 bg-card/60 divide-y divide-border/60 overflow-hidden backdrop-blur-sm">
          {displayedCreatives.map((c) => {
            const isSelected = selectedIds.has(c.id);
            const folderOfItem = creativeFoldersList.find((f) => f.id === c.folderId);

            return (
              <div
                key={c.id}
                className={`group flex items-center justify-between p-3.5 transition-colors gap-3 ${
                  isSelected ? "bg-gold/10" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    onClick={() => toggleSelectOne(c.id)}
                    className={`cursor-pointer grid h-5 w-5 place-items-center rounded-md border transition ${
                      isSelected
                        ? "bg-gold text-primary-foreground border-gold"
                        : "border-border/80 bg-background text-transparent hover:border-gold"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </div>

                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.title}
                      className="h-10 w-10 rounded-lg object-cover border border-border/50 shrink-0"
                    />
                  ) : (
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground shrink-0 border border-border/50">
                      <FileText className="h-4 w-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:text-gold transition">
                      {c.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{c.format}</span>
                      <span>·</span>
                      {folderOfItem ? (
                        <span className="text-gold flex items-center gap-0.5">
                          <Folder className="h-2.5 w-2.5" /> {folderOfItem.name}
                        </span>
                      ) : (
                        <span>Raiz Geral</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      typeBadge[c.type as CreativeType] || "bg-accent text-gold"
                    }`}
                  >
                    {c.type}
                  </span>

                  <div className="flex items-center gap-1">
                    {c.text && (
                      <button
                        onClick={() => copyText(c.text || "", "Copy copiada!")}
                        className="p-1 rounded-lg text-muted-foreground hover:text-gold hover:bg-muted transition"
                        title="Copiar texto"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-gold hover:bg-muted transition"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOne(c.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-muted transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BARRA FLUTUANTE DE AÇÕES EM MASSA (FLOATING BULK BAR) ──────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-5">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-zinc-950/90 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-xl w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-primary-foreground shadow-xs">
                {selectedIds.size}
              </span>
              <span className="text-xs font-semibold text-white">
                criativo(s) selecionado(s)
              </span>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Dropdown Mover para Pasta */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
                >
                  <FolderInput className="h-3.5 w-3.5 text-gold" />
                  <span>Mover para Pasta</span>
                </button>

                {showMoveDropdown && (
                  <div className="absolute bottom-full mb-2 right-0 w-52 rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-2xl z-50 text-xs space-y-1">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                      Escolha o destino:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBatchMove("root")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2 transition"
                    >
                      <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Raiz Geral (Sem Pasta)</span>
                    </button>

                    {creativeFoldersList.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleBatchMove(f.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2 transition"
                      >
                        <Folder className="h-3.5 w-3.5 text-gold" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Excluir em massa */}
              <button
                type="button"
                onClick={handleBatchDelete}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir</span>
              </button>

              {/* Fechar seleção */}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Desmarcar seleção"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOVA / EDITAR PASTA ──────────────────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveFolder}
            className="w-full max-w-md flex flex-col rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-semibold text-foreground">
                  {editFolderId ? "Editar Pasta de Criativos" : "Nova Pasta de Criativos"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Nome da Pasta</span>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Campanha Dia das Mães, Reels Validados..."
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold transition"
                  required
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-foreground">
                  Descrição (Opcional)
                </span>
                <input
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Ex: Criativos com gancho direto para checkout COD"
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold transition"
                />
              </label>

              <div>
                <span className="text-xs font-semibold text-foreground block mb-2">
                  Cor de Destaque
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColor(c.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                        folderColor === c.value
                          ? "border-gold bg-gold/15 text-gold font-bold shadow-xs"
                          : "border-border/60 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[c.value]}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-muted/20 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                {editFolderId ? "Salvar Alterações" : "Criar Pasta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL CRIAR CRIATIVO ────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-gold" />
                <h3 className="text-xl font-semibold">Novo Criativo Publicitário</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                ✕
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              {/* Pasta de Destino */}
              <label className="block">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-gold" />
                  <span>Pasta Organizadora</span>
                </span>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                >
                  <option value="">Raiz Geral (Sem pasta)</option>
                  {creativeFoldersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Tipo e Formato / Duração */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-foreground">Tipo de Criativo</span>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as CreativeType;
                      setType(t);
                      if (!isAutoDetected) {
                        setFormat(formatForType(t));
                      }
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="Feed">Feed (1:1)</option>
                    <option value="Stories">Stories (9:16)</option>
                    <option value="Reels">Reels / TikTok</option>
                    <option value="Copy">Texto / Copy Persuasiva</option>
                  </select>
                </label>

                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">Formato / Duração</span>
                    {isAutoDetected && (
                      <span className="text-[10px] text-gold font-semibold flex items-center gap-0.5">
                        <Zap className="h-3 w-3 fill-gold" /> Auto
                      </span>
                    )}
                  </div>
                  <input
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value);
                      setIsAutoDetected(false);
                    }}
                    placeholder="1080×1080 ou 0:30"
                    className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold font-mono"
                    required
                  />
                </label>
              </div>

              {/* Título da Peça */}
              <label className="block">
                <span className="text-xs font-medium text-foreground">Título da Peça</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ritual de Pele Dourada — Gancho Rápido"
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              {/* Upload de Mídia com Auto Detecção */}
              {type !== "Copy" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground block">
                      Mídia / Capa da Peça
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ⚡ Detecta resolução e formato automaticamente
                    </span>
                  </div>
                  <MediaUploadField
                    value={imageUrl}
                    onChange={setImageUrl}
                    onFileSelect={handleFileDetected}
                    acceptVideo={true}
                    aspectRatio={type === "Stories" || type === "Reels" ? "portrait" : "square"}
                  />
                </div>
              )}

              {/* Copy Sugerida */}
              <label className="block">
                <span className="text-xs font-medium text-foreground">Texto da Copy Sugerida</span>
                <textarea
                  value={copyBody}
                  onChange={(e) => setCopyBody(e.target.value)}
                  rows={3}
                  placeholder="Texto persuasivo para a legenda ou locução do anúncio..."
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background p-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Publicar Criativo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDITAR CRIATIVO ────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEdit}
            className="w-full max-w-lg flex flex-col max-h-[90vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-gold" />
                <h3 className="text-xl font-semibold">Editar Criativo</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                ✕
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              {/* Pasta de Destino */}
              <label className="block">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-gold" />
                  <span>Pasta Organizadora</span>
                </span>
                <select
                  value={editSelectedFolderId}
                  onChange={(e) => setEditSelectedFolderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                >
                  <option value="">Raiz Geral (Sem pasta)</option>
                  {creativeFoldersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Tipo e Formato */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-foreground">Tipo de Criativo</span>
                  <select
                    value={editType}
                    onChange={(e) => {
                      const t = e.target.value as CreativeType;
                      setEditType(t);
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="Feed">Feed (1:1)</option>
                    <option value="Stories">Stories (9:16)</option>
                    <option value="Reels">Reels / TikTok</option>
                    <option value="Copy">Texto / Copy Persuasiva</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-foreground">Formato / Duração</span>
                  <input
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold font-mono"
                    required
                  />
                </label>
              </div>

              {/* Título da Peça */}
              <label className="block">
                <span className="text-xs font-medium text-foreground">Título da Peça</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              {/* Upload de Mídia com Auto Detecção */}
              {editType !== "Copy" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground block">
                      Mídia / Capa da Peça
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ⚡ Detecta resolução e formato automaticamente
                    </span>
                  </div>
                  <MediaUploadField
                    value={editImageUrl}
                    onChange={setEditImageUrl}
                    onFileSelect={handleEditFileDetected}
                    acceptVideo={true}
                    aspectRatio={editType === "Stories" || editType === "Reels" ? "portrait" : "square"}
                  />
                </div>
              )}

              {/* Copy Sugerida */}
              <label className="block">
                <span className="text-xs font-medium text-foreground">Texto da Copy Sugerida</span>
                <textarea
                  value={editCopyBody}
                  onChange={(e) => setEditCopyBody(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-background p-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

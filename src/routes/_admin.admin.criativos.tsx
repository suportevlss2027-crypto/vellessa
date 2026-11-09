import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronRight,
  Copy,
  ExternalLink,
  FileArchive,
  FileText,
  Film,
  Folder,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  Link2,
  List,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
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
import {
  uploadCreativeFile,
  processCreativeThumbnail,
  resolveCreativeDownload,
} from "@/lib/creative-storage";

export const Route = createFileRoute("/_admin/admin/criativos")({
  head: () => ({
    meta: [{ title: "Gestão de Criativos — Vellessa CMS" }],
  }),
  component: AdminCriativosPage,
});

type CreativeType = "Feed" | "Stories" | "Reels" | "Copy";

const FOLDER_COLORS = [
  { label: "Ouro Real", value: "gold" },
  { label: "Esmeralda", value: "emerald" },
  { label: "Rosa Nobre", value: "rose" },
  { label: "Violeta Luxo", value: "violet" },
  { label: "Céu Noturno", value: "sky" },
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

const COLOR_GRADIENT: Record<string, string> = {
  gold: "from-amber-950/60 via-zinc-900 to-black border-gold/40",
  emerald: "from-emerald-950/60 via-zinc-900 to-black border-emerald-500/40",
  rose: "from-rose-950/60 via-zinc-900 to-black border-rose-500/40",
  violet: "from-purple-950/60 via-zinc-900 to-black border-violet-500/40",
  sky: "from-sky-950/60 via-zinc-900 to-black border-sky-500/40",
  amber: "from-amber-900/60 via-zinc-900 to-black border-amber-500/40",
};

const COLOR_DOT: Record<string, string> = {
  gold: "bg-gold",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  amber: "bg-amber-500",
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Utilitário para detecção inteligente de dimensões e duração via Browser API
 */
async function detectCreativeMetadata(file: File): Promise<{
  detectedFormat: string;
  suggestedType: CreativeType;
  thumbnailUrl?: string;
}> {
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

  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const objUrl = URL.createObjectURL(file);
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const w = video.videoWidth;
        const h = video.videoHeight;
        const dur = video.duration || 0;
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;
        const formatStr = w && h ? `${w}×${h} · ${durationStr}` : `Vídeo ${durationStr}`;
        const ratio = w && h ? w / h : 0.5625;
        const suggestedType: CreativeType = ratio < 0.75 ? "Reels" : "Reels";

        URL.revokeObjectURL(objUrl);
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

  return { detectedFormat: "Arquivo de Apoio", suggestedType: "Copy" };
}

function AdminCriativosPage() {
  const {
    creativesList,
    creativeFoldersList,
    createCreative,
    createCreativesBatch,
    updateCreative,
    deleteCreative,
    createCreativeFolder,
    updateCreativeFolder,
    deleteCreativeFolder,
    moveCreativesToFolder,
    deleteCreativesBatch,
    copyText,
    forceSyncAllData,
  } = useAffiliateStore();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncAllData();
    } finally {
      setIsSyncing(false);
    }
  };

  // ── NAVEGAÇÃO E VISUALIZAÇÃO ──────────────────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");

  // ── SELEÇÃO EM MASSA ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  // ── MODAL DE GRUPO (ESTILO KIWIFY) ────────────────────────────────────────
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("gold");
  const [folderCoverImage, setFolderCoverImage] = useState("");

  // ── MODAL DE CRIATIVO ─────────────────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CreativeType>("Feed");
  const [format, setFormat] = useState("1080×1080");
  const [imageUrl, setImageUrl] = useState("");
  const [copyBody, setCopyBody] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [fileUrl, setFileUrl] = useState("");
  const [externalDownloadUrl, setExternalDownloadUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── UPLOAD EM LOTE (Escopo C) ─────────────────────────────────────────────
  interface BatchFile {
    file: File;
    title: string;
    type: CreativeType;
    format: string;
    fileType: string;
    fileSize: string;
    thumbnailUrl: string;
    isDetected: boolean;
  }
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isBatchPublishing, setIsBatchPublishing] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  // ── MODAL EDITAR CRIATIVO ─────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<CreativeType>("Feed");
  const [editFormat, setEditFormat] = useState("1080×1080");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCopyBody, setEditCopyBody] = useState("");
  const [editSelectedFolderId, setEditSelectedFolderId] = useState<string>("");
  const [editFileUrl, setEditFileUrl] = useState("");
  const [editExternalDownloadUrl, setEditExternalDownloadUrl] = useState("");
  const [editFileType, setEditFileType] = useState("");
  const [editFileSize, setEditFileSize] = useState("");
  const [editFileName, setEditFileName] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Scroll lock
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
    setSelectionMode(false);
  }, [currentFolderId]);

  // Pasta/Grupo atual
  const currentFolder = useMemo(
    () => creativeFoldersList.find((f) => f.id === currentFolderId),
    [creativeFoldersList, currentFolderId]
  );

  // Contagem de peças por grupo (com fallback de legados para o primeiro grupo)
  const countByFolder = useMemo(() => {
    const map: Record<string, number> = {};
    const firstFolderId = creativeFoldersList[0]?.id;
    for (const c of creativesList) {
      const fId = c.folderId || firstFolderId;
      if (fId) {
        map[fId] = (map[fId] || 0) + 1;
      }
    }
    return map;
  }, [creativesList, creativeFoldersList]);

  // Criativos exibidos (apenas se dentro de pasta ou em busca ativa)
  const displayedCreatives = useMemo(() => {
    return creativesList.filter((c) => {
      if (filterType !== "all" && c.type !== filterType) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.title.toLowerCase().includes(q) ||
          c.format.toLowerCase().includes(q) ||
          c.type.toLowerCase().includes(q) ||
          (c.text && c.text.toLowerCase().includes(q))
        );
      }

      if (currentFolderId) {
        const isFirstFolder = creativeFoldersList[0]?.id === currentFolderId;
        return c.folderId === currentFolderId || (isFirstFolder && !c.folderId);
      }

      return false; // Na raiz, exibimos apenas as coleções
    });
  }, [creativesList, currentFolderId, searchQuery, filterType, creativeFoldersList]);

  // ── SELEÇÃO EM MASSA HANDLERS ─────────────────────────────────────────────
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
    setSelectionMode(false);
    toast.success(
      `${selectedIds.size} criativo(s) movidos com sucesso!`,
      { icon: "📁" }
    );
  };

  // ── UPLOAD EM LOTE — processa múltiplos arquivos com streaming e thumbnails leves ──────────
  const handleBatchFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const oversized = files.filter((f) => f.size > 500 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`${oversized.length} arquivo(s) excedem 500MB e foram ignorados.`);
    }

    const valid = files.filter((f) => f.size <= 500 * 1024 * 1024);
    if (valid.length === 0) return;

    // Processamento em lotes de 10 para não sobrecarregar a memória do navegador
    const chunkSize = 10;
    const processed: BatchFile[] = [];

    for (let i = 0; i < valid.length; i += chunkSize) {
      const chunk = valid.slice(i, i + chunkSize);
      const currentCount = Math.min(i + chunkSize, valid.length);
      toast.loading(`Gerando prévias: ${currentCount} de ${valid.length} arquivo(s)...`, { id: "batch-load" });

      const chunkResults = await Promise.all(
        chunk.map(async (file, cIdx) => {
          const globalIdx = i + cIdx;
          const sizeStr = formatFileSize(file.size);
          const mime = file.type || "application/octet-stream";
          const baseName = file.name.replace(/\.[^.]+$/, "");
          const tempId = `temp-${Date.now()}-${globalIdx}`;

          let detectedFormat = "Arquivo de Apoio";
          let suggestedType: CreativeType = "Copy";
          let thumbnailUrl = "";

          try {
            const meta = await detectCreativeMetadata(file);
            detectedFormat = meta.detectedFormat;
            suggestedType = meta.suggestedType;
            thumbnailUrl = await processCreativeThumbnail(tempId, file);
            if (!thumbnailUrl && meta.thumbnailUrl) {
              thumbnailUrl = meta.thumbnailUrl;
            }
          } catch {}

          return {
            file,
            title: baseName,
            type: suggestedType,
            format: detectedFormat,
            fileType: mime,
            fileSize: sizeStr,
            thumbnailUrl,
            isDetected: true,
          };
        })
      );

      processed.push(...chunkResults);
    }

    toast.dismiss("batch-load");
    toast.success(`${processed.length} arquivo(s) prontos para publicar!`, { icon: "⚡" });
    setBatchFiles(processed);
    if (batchInputRef.current) batchInputRef.current.value = "";
  };

  const updateBatchItem = (idx: number, patch: Partial<BatchFile>) => {
    setBatchFiles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const removeBatchItem = (idx: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePublishBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchFiles.length === 0) return;
    setIsBatchPublishing(true);

    const total = batchFiles.length;
    const collectedToInsert: {
      id: string;
      title: string;
      type: CreativeType;
      format: string;
      image?: string;
      folderId?: string;
      fileUrl?: string;
      storageType?: "supabase" | "indexeddb" | "external";
      storagePath?: string;
      fileType?: string;
      fileSize?: string;
    }[] = [];

    // Fila com concorrência controlada (3 uploads simultâneos) para máxima estabilidade
    const concurrency = 3;
    let completed = 0;

    for (let i = 0; i < total; i += concurrency) {
      const slice = batchFiles.slice(i, i + concurrency);

      await Promise.all(
        slice.map(async (item, sliceIdx) => {
          const index = i + sliceIdx;
          const creativeId = `c-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
          try {
            const uploadRes = await uploadCreativeFile(creativeId, item.file);
            collectedToInsert.push({
              id: creativeId,
              title: item.title.trim() || `Criativo ${index + 1}`,
              type: item.type,
              format: item.format,
              image: item.thumbnailUrl || undefined,
              folderId: selectedFolderId || currentFolderId || creativeFoldersList[0]?.id || undefined,
              fileUrl: uploadRes.fileUrl,
              storageType: uploadRes.storageType,
              storagePath: uploadRes.storagePath,
              fileType: item.fileType || undefined,
              fileSize: item.fileSize || undefined,
            });
          } catch (err) {
            console.error("Erro ao subir arquivo em lote:", err);
          } finally {
            completed++;
            const pct = Math.round((completed / total) * 100);
            toast.loading(`Enviando arquivos: ${completed}/${total} (${pct}%)…`, { id: "pub-batch" });
          }
        })
      );
    }

    // 💥 INSERÇÃO ATÔMICA EM LOTE: Publica TODOS os criativos de uma só vez sem sobrescrita
    if (collectedToInsert.length > 0) {
      await createCreativesBatch(collectedToInsert);
    }

    toast.dismiss("pub-batch");
    toast.success(
      `${collectedToInsert.length} de ${total} criativo(s) publicados com sucesso!`,
      { icon: "🎉" }
    );
    setBatchFiles([]);
    setIsBatchPublishing(false);
    setShowCreateModal(false);
  };

  // ── UPLOAD DE ARQUIVO REAL DA PEÇA (VÍDEO, PNG, PDF, ZIP) ────────────────
  const handlePrimaryFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast.error("O arquivo excede o limite máximo de 500MB.");
      return;
    }

    const sizeStr = formatFileSize(file.size);
    const mime = file.type || "application/octet-stream";
    const name = file.name;
    const tempId = `temp-${Date.now()}`;

    if (!isEdit) {
      setSelectedFile(file);
      setFileName(name);
      setFileSize(sizeStr);
      setFileType(mime);
    } else {
      setEditSelectedFile(file);
      setEditFileName(name);
      setEditFileSize(sizeStr);
      setEditFileType(mime);
    }

    // Detecção automática de metadados e thumbnail leve
    try {
      const meta = await detectCreativeMetadata(file);
      const thumb = await processCreativeThumbnail(tempId, file);
      const finalThumb = thumb || meta.thumbnailUrl || "";

      if (!isEdit) {
        setFormat(meta.detectedFormat);
        setType(meta.suggestedType);
        setIsAutoDetected(true);
        if (finalThumb && !imageUrl) {
          setImageUrl(finalThumb);
        }
      } else {
        setEditFormat(meta.detectedFormat);
        setEditType(meta.suggestedType);
        if (finalThumb && !editImageUrl) {
          setEditImageUrl(finalThumb);
        }
      }
      toast.success(
        `Arquivo "${name}" pronto (${meta.detectedFormat})!`,
        { icon: "⚡" }
      );
    } catch {
      toast.success(`Arquivo "${name}" carregado com sucesso!`);
    }
  };

  const getRecommendedCoverResolution = (t: CreativeType) => {
    if (t === "Feed") return "1080 × 1080 px (1:1 Quadrado)";
    if (t === "Stories" || t === "Reels") return "1080 × 1920 px (9:16 Vertical)";
    return "1920 × 1080 px (16:9 Widescreen)";
  };

  // ── MODAL GRUPO HANDLERS ──────────────────────────────────────────────────
  const openNewFolderModal = () => {
    setEditFolderId(null);
    setFolderName("");
    setFolderDescription("");
    setFolderColor("gold");
    setFolderCoverImage("");
    setShowFolderModal(true);
  };

  const openEditFolderModal = (f: CreativeFolder) => {
    setEditFolderId(f.id);
    setFolderName(f.name);
    setFolderDescription(f.description || "");
    setFolderColor(f.color || "gold");
    setFolderCoverImage(f.coverImage || "");
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
        coverImage: folderCoverImage,
      });
    } else {
      const createdId = await createCreativeFolder({
        name: folderName,
        description: folderDescription,
        color: folderColor,
        coverImage: folderCoverImage,
      });
      if (createdId) {
        setCurrentFolderId(createdId);
      }
    }
    setShowFolderModal(false);
  };

  const handleDeleteFolder = (id: string, name: string) => {
    if (
      window.confirm(
        `Excluir o grupo "${name}"? Os criativos dentro dele não serão apagados, apenas movidos para a raiz geral.`
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
    setSelectedFolderId(currentFolderId || creativeFoldersList[0]?.id || "");
    setFileUrl("");
    setExternalDownloadUrl("");
    setFileType("");
    setFileSize("");
    setFileName("");
    setSelectedFile(null);
    setIsUploading(false);
    setIsAutoDetected(false);
    setBatchFiles([]);
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    const creativeId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    let finalFileUrl = fileUrl || undefined;
    let finalStorageType: "supabase" | "indexeddb" | "external" | undefined = undefined;
    let finalStoragePath: string | undefined = undefined;

    if (selectedFile) {
      toast.loading("Enviando arquivo com alta performance...", { id: "single-up" });
      try {
        const uploadRes = await uploadCreativeFile(creativeId, selectedFile);
        finalFileUrl = uploadRes.fileUrl;
        finalStorageType = uploadRes.storageType;
        finalStoragePath = uploadRes.storagePath;
        toast.dismiss("single-up");
        toast.success(
          uploadRes.isCloud
            ? "Arquivo salvo na Nuvem (Supabase)!"
            : "Arquivo salvo com sucesso no Armazenamento Local!",
          { icon: "⚡" }
        );
      } catch (err) {
        toast.dismiss("single-up");
        toast.error("Erro ao processar arquivo. Tente novamente.");
        setIsUploading(false);
        return;
      }
    } else if (externalDownloadUrl) {
      finalStorageType = "external";
    }

    await createCreative({
      id: creativeId,
      title: title.trim(),
      type,
      format: format.trim(),
      image: imageUrl || undefined,
      text: copyBody.trim() || undefined,
      folderId: selectedFolderId || currentFolderId || creativeFoldersList[0]?.id || undefined,
      fileUrl: finalFileUrl,
      externalDownloadUrl: externalDownloadUrl.trim() || undefined,
      fileType: fileType || undefined,
      fileSize: fileSize || undefined,
      storageType: finalStorageType,
      storagePath: finalStoragePath,
    });

    setIsUploading(false);
    setSelectedFile(null);
    setShowCreateModal(false);
  };

  const openEdit = (c: Creative) => {
    setEditId(c.id);
    setEditTitle(c.title);
    setEditType(c.type as CreativeType);
    setEditFormat(c.format);
    setEditImageUrl(c.image ?? "");
    setEditCopyBody(c.text ?? "");
    setEditSelectedFolderId(c.folderId || creativeFoldersList[0]?.id || "");
    setEditFileUrl(c.fileUrl || "");
    setEditExternalDownloadUrl(c.externalDownloadUrl || "");
    setEditFileType(c.fileType || "");
    setEditFileSize(c.fileSize || "");
    setEditFileName(c.fileUrl ? "Arquivo Anexado" : "");
    setEditSelectedFile(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;

    let finalFileUrl = editFileUrl || undefined;
    let finalStorageType: "supabase" | "indexeddb" | "external" | undefined = undefined;
    let finalStoragePath: string | undefined = undefined;

    if (editSelectedFile) {
      toast.loading("Enviando novo arquivo...", { id: "edit-up" });
      try {
        const uploadRes = await uploadCreativeFile(editId, editSelectedFile);
        finalFileUrl = uploadRes.fileUrl;
        finalStorageType = uploadRes.storageType;
        finalStoragePath = uploadRes.storagePath;
        toast.dismiss("edit-up");
      } catch (err) {
        toast.dismiss("edit-up");
        toast.error("Erro ao enviar novo arquivo.");
        return;
      }
    }

    await updateCreative(editId, {
      title: editTitle.trim(),
      type: editType,
      format: editFormat.trim(),
      image: editImageUrl || undefined,
      text: editCopyBody.trim() || undefined,
      folderId: editSelectedFolderId || currentFolderId || creativeFoldersList[0]?.id || undefined,
      fileUrl: finalFileUrl,
      externalDownloadUrl: editExternalDownloadUrl.trim() || undefined,
      fileType: editFileType || undefined,
      fileSize: editFileSize || undefined,
      ...(finalStorageType ? { storageType: finalStorageType, storagePath: finalStoragePath } : {}),
    });

    setEditId(null);
    setEditSelectedFile(null);
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

  const typeBadge: Record<CreativeType, string> = {
    Feed: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    Stories: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
    Reels: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    Copy: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  };

  return (
    <div className="space-y-6 pb-24">
      {/* ── HEADER PRINCIPAL UNIFICADO ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
              Vellessa CMS
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {creativesList.length} peças cadastradas · {creativeFoldersList.length} grupos
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Central de Criativos de Anúncio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Cadastre peças publicitárias completas em vídeo (MP4), imagens (PNG/JPG), roteiros em PDF e links de nuvem organizados em grupos estilo Kiwify.
          </p>
        </div>

        {/* BOTÕES DE AÇÃO LADO A LADO NA MESMA ÁREA */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            title="Força sincronização de todos os criativos e grupos com o Supabase. Use para garantir que todos os afiliados vejam suas peças na nuvem."
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 text-gold ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Sincronizando..." : "Sincronizar Nuvem"}</span>
          </button>

          <button
            onClick={openNewFolderModal}
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/60 px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-gold/40 transition shadow-xs cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-gold" />
            <span>Novo Grupo (Kiwify)</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Criativo</span>
          </button>
        </div>
      </div>

      {/* ── TOOLBAR DE NAVEGAÇÃO & FILTROS ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 sm:px-4 backdrop-blur-sm">
        {/* Breadcrumb sutil */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition font-medium ${
              !currentFolderId
                ? "bg-gold/15 text-gold font-semibold border border-gold/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            <span>Todos os Criativos</span>
          </button>

          {currentFolder && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/15 text-gold font-semibold border border-gold/30">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>{currentFolder.name}</span>
                <span className="ml-1 text-[10px] opacity-75">
                  ({displayedCreatives.length} peças)
                </span>
              </div>
            </>
          )}

          {currentFolderId && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-gold transition font-medium"
              title="Voltar para a visão geral"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar para todos os grupos
            </button>
          )}
        </div>

        {/* Busca, Filtro de Tipo e Grid/Lista */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar criativo por título ou formato..."
              className="h-8.5 w-full rounded-xl border border-border/60 bg-background/80 pl-8 pr-7 text-xs outline-none focus:border-gold transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filtro por Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8.5 rounded-xl border border-border/60 bg-background/80 px-2.5 text-xs text-foreground outline-none focus:border-gold"
          >
            <option value="all">Todos os Formatos</option>
            <option value="Feed">Feed (1:1)</option>
            <option value="Stories">Stories (9:16)</option>
            <option value="Reels">Reels / TikTok (9:16)</option>
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

          {/* ── BOTÃO MODO SELEÇÃO (Escopo A) ── */}
          <button
            onClick={() => {
              const next = !selectionMode;
              setSelectionMode(next);
              if (!next) setSelectedIds(new Set());
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              selectionMode
                ? "border-gold bg-gold/15 text-gold"
                : "border-border/60 bg-background/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
            }`}
            title={selectionMode ? "Desativar seleção múltipla" : "Ativar seleção múltipla"}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {selectionMode ? "Cancelar Seleção" : "Selecionar"}
            </span>
          </button>
        </div>
      </div>

      {/* ── SEÇÃO DE GRUPOS ESTILO KIWIFY (NA RAIZ) ── */}
      {!currentFolderId && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <span>Coleções de Criativos (Estilo Kiwify)</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({creativeFoldersList.length})
              </span>
            </h2>
            <button
              onClick={openNewFolderModal}
              className="text-xs text-gold hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Criar nova coleção
            </button>
          </div>

          {creativeFoldersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-16 text-center bg-card/30 p-6">
              <Folder className="mx-auto h-12 w-12 text-gold/40 mb-3" />
              <h3 className="text-base font-semibold text-foreground">
                Nenhuma coleção de criativos cadastrada.
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Crie coleções (ex: &quot;Feed&quot;, &quot;Reels Virais&quot;, &quot;Stories&quot;) para organizar os criativos com capas 16:9 de alto impacto.
              </p>
              <button
                onClick={openNewFolderModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Criar Primeira Coleção
              </button>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
              {creativeFoldersList.map((folder) => {
                const count = countByFolder[folder.id] || 0;
                const gradientTheme = COLOR_GRADIENT[folder.color || "gold"] || COLOR_GRADIENT.gold;
                const dotColor = COLOR_DOT[folder.color || "gold"] || COLOR_DOT.gold;
                const isDropTarget = selectedIds.size > 0;

                return (
                  <div
                    key={folder.id}
                    onClick={() => {
                      if (isDropTarget) {
                        handleBatchMove(folder.id);
                      } else {
                        setCurrentFolderId(folder.id);
                      }
                    }}
                    className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-card/70 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm ${
                      isDropTarget
                        ? "border-gold/80 shadow-gold ring-2 ring-gold/30 scale-[1.01]"
                        : "border-border/70 hover:border-gold/60 hover:shadow-gold"
                    }`}
                  >
                    {/* Capa 9:16 Vertical Nativa */}
                    <div className="relative aspect-[9/16] w-full overflow-hidden bg-black/80">
                      {folder.coverImage ? (
                        <img
                          src={folder.coverImage}
                          alt={folder.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${gradientTheme} flex flex-col items-center justify-center p-4 text-center`}
                        >
                          <Folder className="h-10 w-10 text-gold mb-1 opacity-80" />
                          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                            Coleção Oficial
                          </span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* ── DROP-ZONE OVERLAY (Escopo B) ── aparece quando criativos estão selecionados */}
                      {isDropTarget && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 animate-in fade-in">
                          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-gold bg-gold/20 shadow-gold">
                            <FolderInput className="h-6 w-6 text-gold" />
                          </div>
                          <p className="text-sm font-bold text-gold drop-shadow-lg text-center px-2">
                            Mover {selectedIds.size} criativo{selectedIds.size !== 1 ? "s" : ""} aqui
                          </p>
                          <p className="text-[11px] text-white/70 text-center px-3 leading-tight">
                            {folder.name}
                          </p>
                        </div>
                      )}

                      {/* Badge de Contagem */}
                      {!isDropTarget && (
                        <span className="absolute top-3 left-3 rounded-full bg-black/85 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/40 shadow-xs">
                          {count} {count === 1 ? "criativo" : "criativos"}
                        </span>
                      )}

                      {/* Ações Rápidas no Hover (apenas quando NÃO está em modo seleção) */}
                      {!isDropTarget && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEditFolderModal(folder)}
                            className="p-1.5 rounded-lg bg-black/80 text-white/80 hover:text-gold border border-white/20 transition backdrop-blur-md cursor-pointer"
                            title="Editar grupo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id, folder.name)}
                            className="p-1.5 rounded-lg bg-black/80 text-white/80 hover:text-red-400 border border-white/20 transition backdrop-blur-md cursor-pointer"
                            title="Excluir grupo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Título sobreposto na base da imagem */}
                      {!isDropTarget && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="font-display text-base font-bold text-white tracking-tight drop-shadow-md truncate group-hover:text-gold transition">
                            {folder.name}
                          </h3>
                          {folder.description && (
                            <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                              {folder.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card */}
                    <div className="flex items-center justify-between p-3 border-t border-border/40 bg-card/60 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        <span>{isDropTarget ? "Clique para mover aqui" : "Acessar Coleção"}</span>
                      </div>
                      <span className={`text-[11px] font-medium flex items-center gap-0.5 transition ${isDropTarget ? "text-gold" : "text-gold group-hover:translate-x-0.5"}`}>
                        {isDropTarget ? (
                          <><FolderInput className="h-3 w-3" /> Mover</>
                        ) : (
                          <>Explorar <ChevronRight className="h-3 w-3" /></>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── BARRA DE SELEÇÃO & CONTAGEM (APENAS DENTRO DE UMA COLEÇÃO OU EM BUSCA) ── */}
      {(currentFolderId || searchQuery.trim()) && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {selectionMode && (
              <button
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition font-medium cursor-pointer"
              >
                <CheckSquare className="h-3.5 w-3.5 text-gold" />
                <span>
                  {selectedIds.size === displayedCreatives.length && displayedCreatives.length > 0
                    ? "Desmarcar todos"
                    : "Selecionar todos"}
                </span>
              </button>
            )}

            {selectedIds.size > 0 && (
              <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold text-gold border border-gold/30">
                {selectedIds.size} selecionado(s)
              </span>
            )}

            {selectionMode && selectedIds.size === 0 && (
              <span className="text-xs text-muted-foreground">
                Clique nos criativos para selecionar
              </span>
            )}
          </div>

          <span className="text-xs text-muted-foreground font-mono">
            {displayedCreatives.length} {displayedCreatives.length === 1 ? "criativo" : "criativos"}
          </span>
        </div>
      )}

      {/* ── GRID / LISTA DE CRIATIVOS (APENAS DENTRO DE UMA COLEÇÃO OU EM BUSCA) ── */}
      {(currentFolderId || searchQuery.trim()) && (
        displayedCreatives.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 py-16 text-center bg-card/30 p-6">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery
                ? "Nenhum criativo encontrado para esta busca."
                : currentFolder
                ? `A coleção "${currentFolder.name}" ainda não possui criativos cadastrados.`
                : "Nenhum criativo cadastrado."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              {searchQuery
                ? "Tente buscar por outro termo ou limpe o campo de busca."
                : "Adicione peças em vídeo (MP4), imagens (PNG/JPG), roteiros em PDF ou copys persuasivas para seus afiliados."}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Cadastrar Primeiro Criativo
            </button>
          </div>
        ) : viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {displayedCreatives.map((c) => {
            const isSelected = selectedIds.has(c.id);
            const folderOfItem = creativeFoldersList.find((f) => f.id === c.folderId);
            const hasDownloadFile = !!c.fileUrl || !!c.externalDownloadUrl;

            return (
              <div
                key={c.id}
                className={`group relative rounded-2xl border bg-card shadow-xs flex flex-col overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? "border-gold ring-2 ring-gold/40 shadow-gold"
                    : "border-border/70 hover:border-gold/40 hover:shadow-md"
                }`}
              >
                {/* Checkbox de Seleção */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectOne(c.id);
                  }}
                  className={`absolute top-2.5 left-2.5 z-20 cursor-pointer grid h-6 w-6 place-items-center rounded-lg border transition ${
                    isSelected
                      ? "bg-gold text-primary-foreground border-gold shadow-xs"
                      : selectionMode
                      ? "bg-black/85 text-transparent border-white/50 hover:border-white"
                      : "bg-black/85 text-transparent border-white/30 opacity-0 group-hover:opacity-100 hover:border-white"
                  }`}
                  title={isSelected ? "Desmarcar" : "Selecionar"}
                >
                  <Check className="h-3.5 w-3.5" />
                </div>

                {/* Capa / Imagem da Peça em 9:16 Vertical */}
                {c.image ? (
                  <div className="relative aspect-[9/16] w-full overflow-hidden bg-muted/60">
                    <img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />

                    {/* Selo do Tipo */}
                    <span
                      className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs ${
                        typeBadge[c.type as CreativeType] || "bg-accent text-gold"
                      }`}
                    >
                      {c.type}
                    </span>

                    {/* Badge de Formato / Duração */}
                    <span className="absolute bottom-2 left-2 rounded-lg bg-black/85 px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20 font-mono">
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

                {/* Corpo do Card */}
                <div className="flex flex-1 flex-col p-4 pt-3 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-gold transition">
                      {c.title}
                    </h3>
                  </div>

                  {/* Detalhes de Arquivo ou Nuvem */}
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                    {c.fileUrl && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <UploadCloud className="h-3 w-3" /> Arquivo Original {c.fileSize ? `(${c.fileSize})` : ""}
                      </span>
                    )}
                    {c.externalDownloadUrl && (
                      <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                        <ExternalLink className="h-3 w-3" /> Link de Nuvem
                      </span>
                    )}
                    {!c.fileUrl && !c.externalDownloadUrl && c.type !== "Copy" && (
                      <span className="text-amber-400/80 text-[10px]">
                        Arquivo direto não anexado
                      </span>
                    )}
                  </div>

                  {c.text && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground mt-0.5">
                      {c.text}
                    </p>
                  )}

                  {/* Informação do grupo se estiver buscando */}
                  {searchQuery && folderOfItem && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gold/80">
                      <Folder className="h-3 w-3" />
                      <span>Grupo: {folderOfItem.name}</span>
                    </div>
                  )}

                  {/* Footer do Card */}
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
                        <span>Sem grupo</span>
                      )}
                      {c.fileUrl && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400">Arquivo MP4/PNG</span>
                        </>
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
      ))}

      {/* ── BARRA FLUTUANTE DE SELEÇÃO EM MASSA ──────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 animate-in slide-in-from-bottom-5">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/40 bg-zinc-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-xl w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-xs font-bold text-primary-foreground shadow-xs">
                {selectedIds.size}
              </span>
              <span className="text-xs font-semibold text-white">
                criativo(s) selecionado(s)
              </span>
            </div>

            <div className="flex items-center gap-2 relative">
              {/* Dropdown Mover para Grupo */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition"
                >
                  <FolderInput className="h-3.5 w-3.5 text-gold" />
                  <span>Mover para Grupo</span>
                </button>

                {showMoveDropdown && (
                  <div className="absolute bottom-full mb-2 right-0 w-56 rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-2xl z-50 text-xs space-y-1">
                    <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                      Escolha o destino:
                    </p>
                    <button
                      type="button"
                      onClick={() => handleBatchMove("root")}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2 transition"
                    >
                      <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Raiz Geral (Sem grupo)</span>
                    </button>

                    {creativeFoldersList.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleBatchMove(f.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-white flex items-center gap-2 transition"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-gold" />
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

      {/* ── MODAL NOVO / EDITAR GRUPO ESTILO KIWIFY ────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveFolder}
            className="w-full max-w-lg flex flex-col rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95 max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-gold" />
                <h3 className="text-lg font-semibold text-foreground">
                  {editFolderId ? "Editar Grupo de Criativos" : "Novo Grupo de Criativos (Kiwify)"}
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

            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <label className="block">
                <span className="text-xs font-semibold text-foreground">Nome do Grupo</span>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Campanha Tráfego Direto — Sérum Anti-idade"
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold transition"
                  required
                  autoFocus
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-foreground">
                  Descrição da Estratégia (Opcional)
                </span>
                <input
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Ex: Peças validadas para topo de funil com gancho rápido de 3 segundos"
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold transition"
                />
              </label>

              {/* Upload de Capa Estilo Kiwify */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Capa do Grupo (Estilo Kiwify)
                  </span>
                  <span className="text-[10px] text-gold font-mono font-semibold flex items-center gap-1">
                    <Info className="h-3 w-3" /> Recomendado: 1920 × 1080 px (16:9)
                  </span>
                </div>
                <MediaUploadField
                  value={folderCoverImage}
                  onChange={setFolderCoverImage}
                  aspectRatio="video"
                  description="Esta imagem será a capa da coleção que o afiliado verá na área de membros."
                />
              </div>

              {/* Cor de realce caso não tenha capa */}
              <div>
                <span className="text-xs font-semibold text-foreground block mb-2">
                  Cor de Destaque / Tema
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
                {editFolderId ? "Salvar Alterações" : "Criar Grupo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL CRIAR CRIATIVO ────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={batchFiles.length > 0 ? handlePublishBatch : handleCreate}
            className="w-full max-w-xl flex flex-col max-h-[92vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-gold" />
                <h3 className="text-xl font-semibold text-foreground">
                  {batchFiles.length > 1
                    ? `Publicar ${batchFiles.length} Criativos em Lote`
                    : "Novo Criativo Publicitário"}
                </h3>
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

              {/* Grupo Organizador — SEMPRE visível, aplica-se a todos */}
              <label className="block">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-gold" />
                  <span>Grupo / Coleção de Destino (Kiwify)</span>
                </span>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                >
                  {creativeFoldersList.length === 0 && (
                    <option value="">Nenhuma coleção cadastrada</option>
                  )}
                  {creativeFoldersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      ✨ {f.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* ── SEÇÃO UPLOAD EM LOTE (Escopo C) ───────────────────────── */}
              <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-gold font-semibold text-xs">
                    <UploadCloud className="h-4 w-4" />
                    <span>
                      {batchFiles.length > 0
                        ? `${batchFiles.length} arquivo(s) prontos para publicar`
                        : "Selecionar Arquivo(s) — Upload em Lote"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    MP4, PNG, JPG, PDF, ZIP (máx. 100MB cada)
                  </span>
                </div>

                {/* Input oculto para múltiplos arquivos */}
                <input
                  type="file"
                  ref={batchInputRef}
                  onChange={handleBatchFileSelect}
                  accept="video/*,image/*,application/pdf,application/zip"
                  multiple
                  className="hidden"
                />

                {batchFiles.length === 0 ? (
                  /* Zona de drop / clique */
                  <div
                    onClick={() => batchInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-gold/40 hover:border-gold rounded-xl p-5 text-center transition group bg-card/60 hover:bg-card/90"
                  >
                    <Upload className="mx-auto h-7 w-7 text-gold group-hover:scale-110 transition mb-2" />
                    <p className="text-xs font-semibold text-foreground">
                      Clique para selecionar um ou mais arquivos
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Segure <kbd className="rounded bg-muted px-1 font-mono">Ctrl</kbd> para selecionar múltiplos · Formato e duração detectados automaticamente
                    </p>
                  </div>
                ) : (
                  /* Lista de arquivos em lote */
                  <div className="space-y-2">
                    {batchFiles.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/70 p-2.5"
                      >
                        {/* Thumbnail */}
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/60 flex items-center justify-center">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                          ) : item.fileType.startsWith("video/") ? (
                            <Film className="h-5 w-5 text-muted-foreground/60" />
                          ) : item.fileType === "application/pdf" ? (
                            <FileText className="h-5 w-5 text-muted-foreground/60" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>

                        {/* Título (editável) */}
                        <div className="flex-1 min-w-0">
                          <input
                            value={item.title}
                            onChange={(e) => updateBatchItem(idx, { title: e.target.value })}
                            className="w-full rounded-lg border border-border/60 bg-background px-2 py-1 text-xs font-medium outline-none focus:border-gold transition"
                            placeholder="Título do criativo"
                          />
                          <div className="flex items-center gap-2 mt-1">
                            <select
                              value={item.type}
                              onChange={(e) =>
                                updateBatchItem(idx, { type: e.target.value as CreativeType })
                              }
                              className="rounded-lg border border-border/60 bg-background px-1.5 py-0.5 text-[10px] outline-none focus:border-gold"
                            >
                              <option value="Feed">Feed</option>
                              <option value="Stories">Stories</option>
                              <option value="Reels">Reels</option>
                              <option value="Copy">Copy</option>
                            </select>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {item.format} · {item.fileSize}
                            </span>
                            {item.isDetected && (
                              <span className="text-[10px] text-gold flex items-center gap-0.5">
                                <Zap className="h-2.5 w-2.5 fill-gold" /> Auto
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Remover */}
                        <button
                          type="button"
                          onClick={() => removeBatchItem(idx)}
                          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Remover este arquivo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {/* Adicionar mais arquivos */}
                    <button
                      type="button"
                      onClick={() => batchInputRef.current?.click()}
                      className="w-full rounded-xl border border-dashed border-border/60 py-2 text-xs text-muted-foreground hover:border-gold/50 hover:text-gold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar mais arquivos
                    </button>
                  </div>
                )}

                {/* Link Externo — só exibe se for criativo único */}
                {batchFiles.length <= 1 && (
                  <label className="block pt-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3 text-gold" />
                      <span>Ou adicione Link Externo de Nuvem (Google Drive, Dropbox, Canva, Mega)</span>
                    </span>
                    <input
                      type="url"
                      value={externalDownloadUrl}
                      onChange={(e) => setExternalDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="mt-1 h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs outline-none focus:border-gold font-mono"
                    />
                  </label>
                )}
              </div>

              {/* ── CAMPOS INDIVIDUAIS (só aparecem se criativo único) ───── */}
              {batchFiles.length <= 1 && (
                <>
                  {/* Tipo e Formato */}
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-xs font-medium text-foreground">Tipo de Peça</span>
                      <select
                        value={type}
                        onChange={(e) => {
                          const t = e.target.value as CreativeType;
                          setType(t);
                          if (!isAutoDetected) {
                            setFormat(
                              t === "Stories"
                                ? "1080×1920"
                                : t === "Reels"
                                ? "1080×1920 · 0:30"
                                : t === "Feed"
                                ? "1080×1080"
                                : "Texto"
                            );
                          }
                        }}
                        className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                      >
                        <option value="Feed">Feed (1:1 Quadrado)</option>
                        <option value="Stories">Stories (9:16 Vertical)</option>
                        <option value="Reels">Reels / TikTok (9:16 Vídeo)</option>
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
                      placeholder="Ex: Vídeo Gancho Dourado — Pele Perfeita em 30 Dias"
                      className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                      required={batchFiles.length === 0}
                    />
                  </label>

                  {/* Capa / Prévia Visual */}
                  {type !== "Copy" && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground block">
                          Capa / Prévia Visual da Peça
                        </span>
                        <span className="text-[10px] text-gold font-mono font-semibold">
                          📐 {getRecommendedCoverResolution(type)}
                        </span>
                      </div>
                      <MediaUploadField
                        value={imageUrl}
                        onChange={setImageUrl}
                        aspectRatio={type === "Stories" || type === "Reels" ? "portrait" : "square"}
                        description={`Miniatura visual que o afiliado verá na galeria. Dimensão recomendada: ${getRecommendedCoverResolution(type)}.`}
                      />
                    </div>
                  )}

                  {/* Copy Sugerida */}
                  <label className="block">
                    <span className="text-xs font-medium text-foreground">Texto da Copy Sugerida (Legenda do Anúncio)</span>
                    <textarea
                      value={copyBody}
                      onChange={(e) => setCopyBody(e.target.value)}
                      rows={3}
                      placeholder="Texto persuasivo para a legenda ou locução do anúncio pronto para o afiliado copiar..."
                      className="mt-1 w-full rounded-xl border border-border/80 bg-background p-3 text-sm outline-none focus:border-gold"
                    />
                  </label>
                </>
              )}
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
                disabled={isBatchPublishing || isUploading}
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
                    <span>Enviando arquivo…</span>
                  </>
                ) : isBatchPublishing ? (
                  <>
                    <UploadCloud className="h-3.5 w-3.5 animate-pulse" />
                    <span>Publicando em lote…</span>
                  </>
                ) : batchFiles.length > 1 ? (
                  `Publicar ${batchFiles.length} Criativos`
                ) : (
                  "Publicar Criativo"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDITAR CRIATIVO ────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEdit}
            className="w-full max-w-xl flex flex-col max-h-[92vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Pencil className="h-5 w-5 text-gold" />
                <h3 className="text-xl font-semibold text-foreground">Editar Criativo</h3>
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
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4.5 custom-scrollbar overscroll-contain">
              {/* Grupo Organizador */}
              <label className="block">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-gold" />
                  <span>Grupo / Coleção de Destino (Kiwify)</span>
                </span>
                <select
                  value={editSelectedFolderId}
                  onChange={(e) => setEditSelectedFolderId(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                >
                  {creativeFoldersList.length === 0 && (
                    <option value="">Nenhuma coleção cadastrada</option>
                  )}
                  {creativeFoldersList.map((f) => (
                    <option key={f.id} value={f.id}>
                      ✨ {f.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Tipo e Formato */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-foreground">Tipo de Peça</span>
                  <select
                    value={editType}
                    onChange={(e) => {
                      const t = e.target.value as CreativeType;
                      setEditType(t);
                    }}
                    className="mt-1 h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="Feed">Feed (1:1 Quadrado)</option>
                    <option value="Stories">Stories (9:16 Vertical)</option>
                    <option value="Reels">Reels / TikTok (9:16 Vídeo)</option>
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

              {/* Arquivo da Peça */}
              {editType !== "Copy" && (
                <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gold font-semibold text-xs">
                      <UploadCloud className="h-4 w-4" />
                      <span>Arquivo Original da Peça (Para Download)</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      MP4, PNG, JPG, PDF, ZIP
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={editFileInputRef}
                    onChange={(e) => handlePrimaryFileUpload(e, true)}
                    accept="video/*,image/*,application/pdf,application/zip"
                    className="hidden"
                  />

                  {editFileUrl ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-emerald-400 truncate">
                            {editFileName || "Arquivo anexado pronto para download"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {editFileSize || "Pronto para download"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="text-xs text-gold hover:underline shrink-0 ml-2"
                      >
                        Trocar Arquivo
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-gold/40 hover:border-gold rounded-xl p-4 text-center transition group bg-card/60 hover:bg-card/90"
                    >
                      <Upload className="mx-auto h-6 w-6 text-gold group-hover:scale-110 transition mb-1" />
                      <p className="text-xs font-semibold text-foreground">
                        Clique para anexar o Vídeo (MP4), Imagem (PNG/JPG), Roteiro (PDF) ou ZIP
                      </p>
                    </div>
                  )}

                  {/* Link Externo de Nuvem */}
                  <label className="block pt-1">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3 text-gold" />
                      <span>Link Externo de Nuvem (Google Drive, Canva, Dropbox)</span>
                    </span>
                    <input
                      type="url"
                      value={editExternalDownloadUrl}
                      onChange={(e) => setEditExternalDownloadUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="mt-1 h-9 w-full rounded-xl border border-border/80 bg-background px-3 text-xs outline-none focus:border-gold font-mono"
                    />
                  </label>
                </div>
              )}

              {/* Capa / Prévia Visual */}
              {editType !== "Copy" && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground block">
                      Capa / Prévia Visual da Peça
                    </span>
                    <span className="text-[10px] text-gold font-mono font-semibold">
                      📐 {getRecommendedCoverResolution(editType)}
                    </span>
                  </div>
                  <MediaUploadField
                    value={editImageUrl}
                    onChange={setEditImageUrl}
                    aspectRatio={editType === "Stories" || editType === "Reels" ? "portrait" : "square"}
                    description={`Miniatura visual que o afiliado verá na galeria. Dimensão recomendada: ${getRecommendedCoverResolution(editType)}.`}
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

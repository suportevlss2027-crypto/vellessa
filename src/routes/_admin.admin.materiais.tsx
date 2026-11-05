import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FileUp,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  Link2,
  List,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAffiliateStore,
  type DynamicMaterial,
  type MaterialFileItem,
  type MaterialFolder,
} from "@/lib/affiliate-store";
import {
  formatBytes,
  getRawFile,
  generateImageThumbnail,
  generateVideoThumbnail,
} from "@/lib/file-storage";

export const Route = createFileRoute("/_admin/admin/materiais")({
  head: () => ({
    meta: [{ title: "Links e Materiais — Vellessa CMS" }],
  }),
  component: AdminMateriaisPage,
});

// ── Lightbox Apple ───────────────────────────────────────────────────────────
interface LightboxProps {
  files: MaterialFileItem[];
  startIndex: number;
  onClose: () => void;
}

function Lightbox({ files, startIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(startIndex);
  const current = files[index];

  const prev = () => setIndex((i) => (i > 0 ? i - 1 : files.length - 1));
  const next = () => setIndex((i) => (i < files.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, files.length]);

  const isImage = current.mimeType?.startsWith("image/") || current.thumbnailUrl;
  const isVideo = current.mimeType?.startsWith("video/");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full h-full max-w-5xl max-h-[90vh] px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
          title="Fechar (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {files.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
            title="Anterior (←)"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="flex-1 flex items-center justify-center w-full overflow-hidden rounded-2xl">
          {isImage && current.thumbnailUrl ? (
            <img
              src={current.thumbnailUrl}
              alt={current.name}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95"
            />
          ) : isVideo ? (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white/10">
                <Files className="h-10 w-10" />
              </div>
              <p className="text-sm font-medium">{current.name}</p>
              <p className="text-xs text-white/40">Prévia de vídeo não disponível nesta resolução</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-white/60">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gold/20 border border-gold/30">
                <span className="text-xl font-bold text-gold">{current.kind}</span>
              </div>
              <p className="text-sm font-medium text-white">{current.name}</p>
              <p className="text-xs text-white/40">{current.size}</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-white/70 text-xs">
          <span className="font-medium text-white">{current.name}</span>
          <span>·</span>
          <span>{current.size}</span>
          {files.length > 1 && (
            <>
              <span>·</span>
              <span>
                {index + 1} de {files.length}
              </span>
            </>
          )}
        </div>

        {files.length > 1 && (
          <button
            onClick={next}
            className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm"
            title="Próximo (→)"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {files.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {files.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página Principal do Admin ─────────────────────────────────────────────────
function AdminMateriaisPage() {
  const {
    linksList,
    materialsList,
    foldersList,
    createAffiliateLink,
    updateAffiliateLink,
    deleteAffiliateLink,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useAffiliateStore();

  const ESTIMATED_SIZES: Record<string, string> = {
    PDF: "2,5 MB",
    PNG: "1,8 MB",
    ZIP: "15,0 MB",
    VIDEO: "45,0 MB",
    XLS: "650 KB",
    DOC: "1,2 MB",
  };

  // ── ESTADO DE NAVEGAÇÃO ESPACIAL (FINDER / GOOGLE DRIVE) ────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── ESTADO DO LIGHTBOX ─────────────────────────────────────────────────────
  const [lightboxFiles, setLightboxFiles] = useState<MaterialFileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openLightbox = (files: MaterialFileItem[], idx = 0) => {
    setLightboxFiles(files);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxFiles([]);

  // ── MODAL DE PASTA (NOVA OU EDITAR) ────────────────────────────────────────
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("gold");

  const FOLDER_COLORS = [
    { label: "Ouro", value: "gold" },
    { label: "Esmeralda", value: "emerald" },
    { label: "Rosa", value: "rose" },
    { label: "Violeta", value: "violet" },
    { label: "Céu", value: "sky" },
    { label: "Âmbar", value: "amber" },
  ];

  const COLOR_MAP: Record<string, string> = {
    gold: "text-gold bg-gold/15 border-gold/30 group-hover:border-gold/60",
    emerald: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 group-hover:border-emerald-500/60",
    rose: "text-rose-400 bg-rose-500/15 border-rose-500/30 group-hover:border-rose-500/60",
    violet: "text-violet-400 bg-violet-500/15 border-violet-500/30 group-hover:border-violet-500/60",
    sky: "text-sky-400 bg-sky-500/15 border-sky-500/30 group-hover:border-sky-500/60",
    amber: "text-amber-400 bg-amber-500/15 border-amber-500/30 group-hover:border-amber-500/60",
  };

  const COLOR_DOT: Record<string, string> = {
    gold: "bg-gold",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
  };

  const openNewFolderModal = () => {
    setEditFolderId(null);
    setFolderName("");
    setFolderDescription("");
    setFolderColor("gold");
    setShowFolderModal(true);
  };

  const openEditFolderModal = (f: MaterialFolder) => {
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
      await updateFolder(editFolderId, {
        name: folderName,
        description: folderDescription,
        color: folderColor,
      });
    } else {
      await createFolder({
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
        `Excluir a pasta "${name}"? Os arquivos dentro dela não serão apagados, apenas movidos para a raiz geral.`
      )
    ) {
      deleteFolder(id);
      if (currentFolderId === id) setCurrentFolderId(null);
    }
  };

  // ── MODAL NOVO LINK ────────────────────────────────────────────────────────
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");

  // ── MODAL EDITAR LINK ──────────────────────────────────────────────────────
  const [editLinkId, setEditLinkId] = useState<string | null>(null);
  const [editLinkLabel, setEditLinkLabel] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkNote, setEditLinkNote] = useState("");

  // ── MODAL NOVO MATERIAL ────────────────────────────────────────────────────
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matSize, setMatSize] = useState("");
  const [matFileUrl, setMatFileUrl] = useState("");
  const [matSourceType, setMatSourceType] = useState<"upload" | "link">("upload");
  const [matRawFile, setMatRawFile] = useState<File | null>(null);
  const [matRawFileName, setMatRawFileName] = useState("");
  const [matFiles, setMatFiles] = useState<MaterialFileItem[]>([]);
  const [matFolderId, setMatFolderId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── MODAL EDITAR MATERIAL ──────────────────────────────────────────────────
  const [editMatId, setEditMatId] = useState<string | null>(null);
  const [editMatTitle, setEditMatTitle] = useState("");
  const [editMatKind, setEditMatKind] = useState("PDF");
  const [editMatSize, setEditMatSize] = useState("");
  const [editMatFileUrl, setEditMatFileUrl] = useState("");
  const [editMatSourceType, setEditMatSourceType] = useState<"upload" | "link">("upload");
  const [editMatRawFile, setEditMatRawFile] = useState<File | null>(null);
  const [editMatRawFileName, setEditMatRawFileName] = useState("");
  const [editMatFiles, setEditMatFiles] = useState<MaterialFileItem[]>([]);
  const [editMatFolderId, setEditMatFolderId] = useState<string>("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleKindChange = (newKind: string, isEdit = false) => {
    if (isEdit) {
      setEditMatKind(newKind);
      if (!editMatRawFile && editMatFiles.length === 0) {
        setEditMatSize(ESTIMATED_SIZES[newKind] || "2,5 MB");
      }
    } else {
      setMatKind(newKind);
      if (!matRawFile && matFiles.length === 0) {
        if (matSourceType === "link") {
          setMatSize(ESTIMATED_SIZES[newKind] || "2,5 MB");
        } else {
          setMatSize("");
        }
      }
    }
  };

  const handleSourceTypeChange = (newType: "upload" | "link", isEdit = false) => {
    if (isEdit) {
      setEditMatSourceType(newType);
      if (newType === "link" && !editMatSize && editMatFiles.length === 0) {
        setEditMatSize(ESTIMATED_SIZES[editMatKind] || "2,5 MB");
      } else if (newType === "upload" && !editMatRawFile && !editMatRawFileName && editMatFiles.length === 0) {
        setEditMatSize("");
      }
    } else {
      setMatSourceType(newType);
      if (newType === "link" && !matSize && matFiles.length === 0) {
        setMatSize(ESTIMATED_SIZES[matKind] || "2,5 MB");
      } else if (newType === "upload" && !matRawFile && matFiles.length === 0) {
        setMatSize("");
      }
    }
  };

  const openNewMaterialModal = (preselectedFolderId = "") => {
    setMatTitle("");
    setMatKind("PDF");
    setMatSize("");
    setMatFileUrl("");
    setMatRawFile(null);
    setMatRawFileName("");
    setMatFiles([]);
    setMatSourceType("upload");
    setMatFolderId(preselectedFolderId || currentFolderId || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowMaterialModal(true);
  };

  const enrichWithThumbnail = async (file: File, item: MaterialFileItem): Promise<MaterialFileItem> => {
    try {
      if (file.type.startsWith("image/")) {
        const thumb = await generateImageThumbnail(file);
        return { ...item, thumbnailUrl: thumb };
      } else if (file.type.startsWith("video/")) {
        const thumb = await generateVideoThumbnail(file);
        return { ...item, thumbnailUrl: thumb || undefined };
      }
    } catch {}
    return item;
  };

  const handleSelectMultipleFiles = async (fileList: FileList | File[], isEdit = false) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const rawItems: MaterialFileItem[] = filesArray.map((file, i) => {
      const rawExt = file.name.split(".").pop()?.toUpperCase() || "DOC";
      let mappedKind = rawExt;
      if (rawExt === "JPG" || rawExt === "JPEG") mappedKind = "PNG";
      else if (rawExt === "DOCX") mappedKind = "DOC";
      else if (rawExt === "XLSX") mappedKind = "XLS";
      else if (rawExt === "MP4") mappedKind = "VIDEO";

      return {
        id: `file_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        kind: mappedKind,
        size: formatBytes(file.size),
        bytes: file.size,
        sourceType: "upload",
        mimeType: file.type,
        rawFile: file,
      };
    });

    const enrichedItems = await Promise.all(
      rawItems.map((item, i) => enrichWithThumbnail(filesArray[i], item))
    );

    if (isEdit) {
      const combined = [...editMatFiles, ...enrichedItems];
      setEditMatFiles(combined);
      const totalBytes = combined.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setEditMatSize(formatBytes(totalBytes));
      if (combined.length > 1) setEditMatKind("PACOTE");
      else if (combined.length === 1) setEditMatKind(combined[0].kind);
      if (!editMatTitle.trim() && combined.length > 0) {
        setEditMatTitle(combined[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } else {
      const combined = [...matFiles, ...enrichedItems];
      setMatFiles(combined);
      const totalBytes = combined.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setMatSize(formatBytes(totalBytes));
      if (combined.length > 1) setMatKind("PACOTE");
      else if (combined.length === 1) setMatKind(combined[0].kind);
      if (!matTitle.trim() && combined.length > 0) {
        setMatTitle(combined[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    }
  };

  const handleRemoveFileItem = (index: number, isEdit = false) => {
    if (isEdit) {
      const updated = editMatFiles.filter((_, i) => i !== index);
      setEditMatFiles(updated);
      const totalBytes = updated.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setEditMatSize(updated.length > 0 ? formatBytes(totalBytes) : "");
      if (updated.length === 1) setEditMatKind(updated[0].kind);
      if (updated.length === 0 && editFileInputRef.current) editFileInputRef.current.value = "";
    } else {
      const updated = matFiles.filter((_, i) => i !== index);
      setMatFiles(updated);
      const totalBytes = updated.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setMatSize(updated.length > 0 ? formatBytes(totalBytes) : "");
      if (updated.length === 1) setMatKind(updated[0].kind);
      if (updated.length === 0 && fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const anyModalOpen =
    showLinkModal ||
    editLinkId !== null ||
    showMaterialModal ||
    editMatId !== null ||
    showFolderModal ||
    lightboxFiles.length > 0;

  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);

  // ── HANDLERS LINKS ─────────────────────────────────────────────────────────
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    await createAffiliateLink({
      label: linkLabel.trim(),
      url: linkUrl.trim(),
      note: linkNote.trim(),
    });
    setLinkLabel("");
    setLinkUrl("");
    setLinkNote("");
    setShowLinkModal(false);
  };

  const openEditLink = (link: (typeof linksList)[0]) => {
    setEditLinkId(link.id || link.url);
    setEditLinkLabel(link.label);
    setEditLinkUrl(link.url);
    setEditLinkNote(link.note || "");
  };

  const handleEditLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLinkId) return;
    await updateAffiliateLink(editLinkId, {
      label: editLinkLabel.trim(),
      url: editLinkUrl.trim(),
      note: editLinkNote.trim(),
    });
    setEditLinkId(null);
  };

  const handleDeleteLink = (idOrUrl: string) => {
    if (window.confirm("Excluir este link de apoio definitivamente?")) {
      deleteAffiliateLink(idOrUrl);
    }
  };

  // ── HANDLERS MATERIAIS ─────────────────────────────────────────────────────
  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    if (matSourceType === "upload" && matFiles.length === 0 && !matRawFile) {
      toast.error("Por favor, selecione ao menos um arquivo para o material.");
      return;
    }
    if (matSourceType === "link" && !matFileUrl.trim() && matFiles.length === 0) {
      toast.error("Por favor, informe a URL do arquivo ou anexe arquivos.");
      return;
    }

    const calculatedSize =
      matSize.trim() ||
      (matFiles.length > 0
        ? formatBytes(matFiles.reduce((acc, f) => acc + (f.bytes || 0), 0))
        : matRawFile
        ? formatBytes(matRawFile.size)
        : ESTIMATED_SIZES[matKind] || "1,0 MB");

    await createMaterial({
      title: matTitle.trim(),
      kind: matKind.trim(),
      size: calculatedSize,
      file_url: matSourceType === "link" ? matFileUrl.trim() : undefined,
      sourceType: matSourceType,
      rawFileName: matFiles.length === 1 ? matFiles[0].name : matRawFileName || matRawFile?.name,
      mimeType: matFiles.length === 1 ? matFiles[0].mimeType : matRawFile?.type,
      rawFile: matRawFile || undefined,
      files: matFiles.length > 0 ? matFiles : undefined,
      folderId: matFolderId || undefined,
    });

    setMatTitle("");
    setMatKind("PDF");
    setMatSize("");
    setMatFileUrl("");
    setMatRawFile(null);
    setMatRawFileName("");
    setMatFiles([]);
    setMatSourceType("upload");
    setMatFolderId("");
    setShowMaterialModal(false);
  };

  const openEditMaterial = (m: (typeof materialsList)[0]) => {
    setEditMatId(m.id || m.title);
    setEditMatTitle(m.title);
    setEditMatKind(m.kind);
    setEditMatSize(m.size);
    setEditMatFileUrl(m.file_url || "");
    setEditMatSourceType(m.sourceType || (m.file_url ? "link" : "upload"));
    setEditMatRawFile(null);
    setEditMatRawFileName(m.rawFileName || "");
    setEditMatFiles(m.files || []);
    setEditMatFolderId(m.folderId || "");
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatId) return;
    const calculatedSize =
      editMatSize.trim() ||
      (editMatFiles.length > 0
        ? formatBytes(editMatFiles.reduce((acc, f) => acc + (f.bytes || 0), 0))
        : editMatRawFile
        ? formatBytes(editMatRawFile.size)
        : ESTIMATED_SIZES[editMatKind] || "1,0 MB");

    await updateMaterial(editMatId, {
      title: editMatTitle.trim(),
      kind: editMatKind.trim(),
      size: calculatedSize,
      file_url: editMatSourceType === "link" ? editMatFileUrl.trim() : undefined,
      sourceType: editMatSourceType,
      rawFileName: editMatFiles.length === 1 ? editMatFiles[0].name : editMatRawFileName || editMatRawFile?.name,
      mimeType: editMatFiles.length === 1 ? editMatFiles[0].mimeType : editMatRawFile?.type,
      rawFile: editMatRawFile || undefined,
      files: editMatFiles.length > 0 ? editMatFiles : undefined,
      folderId: editMatFolderId || undefined,
    });

    setEditMatId(null);
    setEditMatRawFile(null);
    setEditMatRawFileName("");
    setEditMatFiles([]);
  };

  const handleTestDownload = async (m: DynamicMaterial) => {
    if (m.files && m.files.length > 0) {
      toast.info(`Baixando pacote com ${m.files.length} arquivos...`);
      for (let i = 0; i < m.files.length; i++) {
        const f = m.files[i];
        setTimeout(async () => {
          if (f.sourceType === "upload" || !f.file_url) {
            const blob = await getRawFile(f.id);
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = f.name;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              setTimeout(() => URL.revokeObjectURL(url), 30000);
            }
          } else if (f.file_url) {
            window.open(f.file_url, "_blank");
          }
        }, i * 350);
      }
      return;
    }
    if (m.sourceType === "upload" || m.rawFileName) {
      if (m.id) {
        const blob = await getRawFile(m.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const filename = m.rawFileName || `${m.title}.${m.kind.toLowerCase()}`;
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success(`Download de teste "${filename}" iniciado!`);
          setTimeout(() => URL.revokeObjectURL(url), 30000);
          return;
        }
      }
    }
    if (m.file_url) window.open(m.file_url, "_blank");
    else toast.info("Material sem arquivo ou link anexado.");
  };

  const handleDeleteMaterial = (idOrTitle: string) => {
    if (window.confirm("Excluir este material definitivamente?")) {
      deleteMaterial(idOrTitle);
    }
  };

  // ── FILTROS E CONTEXTO DE DIRETÓRIO ATUAL ──────────────────────────────────
  const currentFolder = foldersList.find((f) => f.id === currentFolderId);

  // Arquivos visíveis de acordo com a pasta atual ou busca
  const displayedMaterials = materialsList.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        m.title.toLowerCase().includes(q) ||
        m.kind.toLowerCase().includes(q) ||
        (m.rawFileName && m.rawFileName.toLowerCase().includes(q))
      );
    }
    if (currentFolderId) {
      return m.folderId === currentFolderId;
    }
    return !m.folderId; // Na raiz, somente arquivos avulsos
  });

  // ── RENDERIZADOR DE CARD DE MATERIAL (ESTILO APPLE HIG) ───────────────────
  const renderMaterialCard = (m: DynamicMaterial) => {
    const matKey = m.id || m.title;
    const previewFiles = m.files ? m.files.filter((f) => f.thumbnailUrl) : [];
    const hasThumb = previewFiles.length > 0;
    const singleThumb = hasThumb ? previewFiles[0].thumbnailUrl : null;

    return (
      <div
        key={matKey}
        className="group relative rounded-2xl border border-border/70 bg-card/70 p-4 shadow-xs hover:border-gold/40 hover:shadow-gold transition-all flex flex-col justify-between backdrop-blur-md"
      >
        <div>
          {/* Topo do Card: Prévia ou Ícone de Formato Nobre */}
          <div className="relative mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center">
            {singleThumb ? (
              <>
                <img
                  src={singleThumb}
                  alt={m.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => openLightbox(previewFiles, 0)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-semibold backdrop-blur-xs"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Prévia</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 text-gold">
                <span className="text-xl font-bold tracking-wider">{m.kind}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Arquivo de Apoio</span>
              </div>
            )}

            {/* Selo de Pacote ou Formato */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <span className="rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white border border-white/20 backdrop-blur-md">
                {m.kind}
              </span>
              {m.files && m.files.length > 1 && (
                <span className="rounded-lg bg-gold/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground border border-gold/40">
                  {m.files.length} arquivos
                </span>
              )}
            </div>
          </div>

          {/* Título e Metadados */}
          <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-gold transition">
            {m.title}
          </h4>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{m.size}</span>
            <span>·</span>
            {m.sourceType === "upload" || m.rawFileName ? (
              <span className="inline-flex items-center gap-0.5 text-gold text-[11px]">
                <FileUp className="h-3 w-3" /> Bruto
              </span>
            ) : m.file_url ? (
              <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[11px]">
                <ExternalLink className="h-3 w-3" /> Link
              </span>
            ) : null}
          </div>
        </div>

        {/* Rodapé de Ações do Card */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => handleTestDownload(m)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold py-1.5 px-3 text-xs font-semibold transition"
            title="Baixar ou abrir para teste"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Baixar</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openEditMaterial(m)}
              className="p-1.5 text-muted-foreground hover:text-gold transition rounded-lg hover:bg-muted"
              title="Editar material"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMaterial(matKey)}
              className="p-1.5 text-muted-foreground hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
              title="Excluir material"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── RENDERIZADOR DE LINHA (MODO LISTA COMPACTA) ───────────────────────────
  const renderMaterialRow = (m: DynamicMaterial) => {
    const matKey = m.id || m.title;
    const previewFiles = m.files ? m.files.filter((f) => f.thumbnailUrl) : [];

    return (
      <div
        key={matKey}
        className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition rounded-xl border border-border/50 bg-card/60"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          {previewFiles.length > 0 ? (
            <div
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted cursor-pointer group"
              onClick={() => openLightbox(previewFiles, 0)}
            >
              <img
                src={previewFiles[0].thumbnailUrl!}
                alt={m.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <Eye className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          ) : (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold font-bold text-xs">
              {m.kind}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{m.title}</p>
            <p className="text-xs text-muted-foreground">
              {m.kind} · {m.size}{" "}
              {m.files && m.files.length > 1 && `· Pacote com ${m.files.length} arquivos`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {previewFiles.length > 0 && (
            <button
              type="button"
              onClick={() => openLightbox(previewFiles, 0)}
              className="p-2 text-muted-foreground hover:text-gold transition rounded-lg hover:bg-gold/10"
              title="Ver prévia"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => handleTestDownload(m)}
            className="p-2 text-muted-foreground hover:text-foreground transition rounded-lg hover:bg-muted"
            title="Download de teste"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditMaterial(m)}
            className="p-2 text-muted-foreground hover:text-gold transition rounded-lg hover:bg-gold/10"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteMaterial(matKey)}
            className="p-2 text-muted-foreground hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
            title="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Lightbox Modal */}
      {lightboxFiles.length > 0 && (
        <Lightbox files={lightboxFiles} startIndex={lightboxIndex} onClose={closeLightbox} />
      )}

      {/* ── SEÇÃO 1: LINKS OFICIAIS & LOGZZ ────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Links Oficiais & Afiliação Logzz</h2>
            <p className="text-xs text-muted-foreground">
              Configure as páginas de demonstração oficiais e os links de acesso à Logzz disponibilizados para os afiliados.
            </p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Novo Link
          </button>
        </div>

        {linksList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
            <Link2 className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs font-medium text-muted-foreground">Nenhum link cadastrado ainda.</p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
            >
              <Plus className="h-3.5 w-3.5" /> Cadastrar Primeiro Link
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {linksList.map((link) => {
              const linkKey = link.id || link.url;
              return (
                <div
                  key={linkKey}
                  className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground text-sm">{link.label}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-gold transition p-1"
                        title="Abrir link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    {link.note && <p className="text-xs text-muted-foreground mt-1">{link.note}</p>}
                    <p className="mt-3 truncate rounded-lg bg-muted/60 p-2 font-mono text-xs text-muted-foreground">
                      {link.url}
                    </p>
                  </div>
                  <div className="mt-4 border-t pt-3 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Link oficial</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditLink(link)}
                        className="p-1.5 text-muted-foreground hover:text-gold transition"
                        title="Editar link"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLink(linkKey)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 transition"
                        title="Excluir link"
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
      </section>

      {/* ── SEÇÃO 2: COFRE DE MATERIAIS & PASTAS (VELLESSA VAULT) ──────────── */}
      <section className="space-y-5 pt-4">
        {/* Barra Superior de Controles e Ações */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Arquivos, PDFs e Manuais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize ativos em pastas temáticas ou compartilhe manuais avulsos de apoio.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={openNewFolderModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-card px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/10 transition shadow-xs"
            >
              <FolderPlus className="h-4 w-4" /> Nova Pasta
            </button>
            <button
              onClick={() => openNewMaterialModal(currentFolderId || "")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              <Plus className="h-4 w-4" /> Novo Material
            </button>
          </div>
        </div>

        {/* Barra de Filtro, Busca e Alternância de Visualização */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border/50 backdrop-blur-md">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar materiais por nome ou formato..."
              className="h-9 w-full rounded-xl bg-background/80 pl-9 pr-4 text-xs outline-none border border-border/60 focus:border-gold transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Alternador de Visualização (Grade vs Lista) */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-card text-gold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list" ? "bg-card text-gold shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── NAVEGAÇÃO POR BREADCRUMB (QUANDO DENTRO DE UMA PASTA) ─────────── */}
        {currentFolder && (
          <div className="flex items-center justify-between gap-3 bg-gold/10 border border-gold/30 p-4 rounded-2xl backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-gold/30 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15 transition shadow-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar à Raiz</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="hidden sm:inline">Materiais</span>
                <ChevronRight className="h-3.5 w-3.5 text-gold" />
                <span className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 text-gold" /> {currentFolder.name}
                </span>
                <span className="text-[11px] font-mono text-gold ml-1">
                  ({displayedMaterials.length} itens)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => openEditFolderModal(currentFolder)}
                className="p-1.5 text-muted-foreground hover:text-gold transition rounded-lg hover:bg-muted"
                title="Renomear / Editar Pasta"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(currentFolder.id, currentFolder.name)}
                className="p-1.5 text-muted-foreground hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                title="Excluir Pasta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── CONTEÚDO PRINCIPAL (RAIZ OU DENTRO DA PASTA) ───────────────────── */}
        {searchQuery ? (
          /* MODO BUSCA ATIVA */
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Resultados da Busca para "{searchQuery}" ({displayedMaterials.length})
            </p>
            {displayedMaterials.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                Nenhum material encontrado com esse nome ou formato.
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayedMaterials.map((m) => renderMaterialCard(m))}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedMaterials.map((m) => renderMaterialRow(m))}
              </div>
            )}
          </div>
        ) : currentFolder ? (
          /* MODO DENTRO DA PASTA SELECIONADA */
          <div>
            {displayedMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center bg-card/30">
                <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">Esta pasta está vazia</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione fotos, criativos ou PDFs diretamente para esta pasta temática.
                </p>
                <button
                  type="button"
                  onClick={() => openNewMaterialModal(currentFolder.id)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Primeiro Arquivo
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in">
                {displayedMaterials.map((m) => renderMaterialCard(m))}
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in">
                {displayedMaterials.map((m) => renderMaterialRow(m))}
              </div>
            )}
          </div>
        ) : (
          /* MODO RAIZ: PASTAS EM CARDS TÁTEIS + ARQUIVOS AVULSOS */
          <div className="space-y-8 animate-in fade-in">
            {/* 1. SEÇÃO DE PASTAS TEMÁTICAS EM CARDS TÁTEIS */}
            {foldersList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pastas Temáticas ({foldersList.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Clique no card para abrir o diretório
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {foldersList.map((folder) => {
                    const colorCls = COLOR_MAP[folder.color || "gold"] || COLOR_MAP.gold;
                    const folderItems = materialsList.filter((m) => m.folderId === folder.id);

                    return (
                      <div
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="group relative cursor-pointer rounded-2xl border border-border/70 bg-card/80 p-5 shadow-xs hover:border-gold/50 hover:shadow-gold transition-all duration-300 flex flex-col justify-between backdrop-blur-md"
                      >
                        <div>
                          {/* Topo do Card da Pasta */}
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`grid h-12 w-12 place-items-center rounded-2xl border ${colorCls} transition-transform duration-300 group-hover:scale-105 shadow-xs`}
                            >
                              <Folder className="h-6 w-6" />
                            </div>

                            {/* Ações da Pasta */}
                            <div
                              className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => openEditFolderModal(folder)}
                                className="p-1.5 text-muted-foreground hover:text-gold transition rounded-lg hover:bg-muted"
                                title="Editar Pasta"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFolder(folder.id, folder.name)}
                                className="p-1.5 text-muted-foreground hover:text-red-400 transition rounded-lg hover:bg-red-500/10"
                                title="Excluir Pasta"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Nome e Descrição */}
                          <h4 className="mt-3.5 font-bold text-base text-foreground group-hover:text-gold transition line-clamp-1">
                            {folder.name}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {folder.description || "Pasta temática de arquivos e ativos oficiais."}
                          </p>
                        </div>

                        {/* Rodapé com Contador e Botão de Abertura */}
                        <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {folderItems.length} {folderItems.length === 1 ? "arquivo" : "arquivos"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold group-hover:translate-x-1 transition-transform">
                            <span>Explorar</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. SEÇÃO DE ARQUIVOS AVULSOS DE ACESSO RÁPIDO */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gold" />
                  <span>Arquivos Gerais ({displayedMaterials.length})</span>
                </span>
                {foldersList.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Materiais avulsos sem pasta vinculada
                  </span>
                )}
              </div>

              {displayedMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center bg-card/20">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum arquivo avulso na raiz.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedMaterials.map((m) => renderMaterialCard(m))}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedMaterials.map((m) => renderMaterialRow(m))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── MODAL NOVA / EDITAR PASTA ─────────────────────────────────────── */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveFolder}
            className="w-full max-w-sm flex flex-col rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">
                {editFolderId ? "Editar Pasta Temática" : "Nova Pasta Temática"}
              </h3>
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium">Nome da Pasta</span>
                <input
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Antes e Depois, Criativos de Vídeo..."
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                  autoFocus
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Descrição (opcional)</span>
                <input
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                  placeholder="Ex: Provas sociais e fotos reais de clientes..."
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
              <div>
                <span className="text-xs font-medium block mb-2">Cor de Destaque</span>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColor(c.value)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        folderColor === c.value
                          ? "border-foreground bg-muted shadow-xs font-semibold"
                          : "border-border/40 hover:border-border text-muted-foreground"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${COLOR_DOT[c.value]}`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowFolderModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
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

      {/* ── MODAL NOVO LINK ──────────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateLink}
            className="w-full max-w-md flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Novo Link de Apoio ou Logzz</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              <label className="block">
                <span className="text-xs font-medium">Nome / Rótulo</span>
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Ex: Oferta Kit 3 Frascos (Demonstração)"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">URL de Destino</span>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://vellessa.com/kit3 ou https://app.logzz.com.br"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Dica / Nota</span>
                <input
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  placeholder="Ex: Maior comissão e melhor conversão"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Salvar Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDITAR LINK ────────────────────────────────────────────── */}
      {editLinkId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEditLink}
            className="w-full max-w-md flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Editar Link de Apoio</h3>
              <button
                type="button"
                onClick={() => setEditLinkId(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              <label className="block">
                <span className="text-xs font-medium">Nome / Rótulo</span>
                <input
                  value={editLinkLabel}
                  onChange={(e) => setEditLinkLabel(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">URL de Destino</span>
                <input
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium">Dica / Nota</span>
                <input
                  value={editLinkNote}
                  onChange={(e) => setEditLinkNote(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setEditLinkId(null)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
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

      {/* ── MODAL NOVO MATERIAL ──────────────────────────────────────────── */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateMaterial}
            className="w-full max-w-md flex flex-col max-h-[90vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Adicionar Arquivo de Apoio</h3>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              {/* Seletor de Pasta */}
              {foldersList.length > 0 && (
                <label className="block">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Folder className="h-3 w-3 text-gold" /> Salvar dentro da Pasta
                  </span>
                  <select
                    value={matFolderId}
                    onChange={(e) => setMatFolderId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="">Sem pasta (Arquivo Geral)</option>
                    {foldersList.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="text-xs font-medium">Título do Arquivo</span>
                <input
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  placeholder="Ex: Manual de Marca e Identidade"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium">Tipo de Arquivo</span>
                  <select
                    value={matKind}
                    onChange={(e) => handleKindChange(e.target.value, false)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="PACOTE">PACOTE (VÁRIOS ARQUIVOS)</option>
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="DOC">DOC</option>
                    <option value="VIDEO">VÍDEO</option>
                    <option value="XLS">PLANILHA</option>
                    <option value="PNG">IMAGEM</option>
                  </select>
                </label>
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Tamanho Estimado</span>
                    {matSourceType === "upload" && matFiles.length > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Total ({matFiles.length} arq.)
                      </span>
                    ) : matSourceType === "upload" && matRawFile ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Calculado
                      </span>
                    ) : matSourceType === "upload" ? (
                      <span className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Auto ao anexar
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Estimado ({matKind})
                      </span>
                    )}
                  </div>
                  <input
                    value={matSize}
                    onChange={(e) => setMatSize(e.target.value)}
                    placeholder={
                      matSourceType === "upload"
                        ? "Calculado ao selecionar..."
                        : `Ex: ${ESTIMATED_SIZES[matKind] || "2,5 MB"}`
                    }
                    className={`mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all focus:border-gold ${
                      matSourceType === "upload" && (matFiles.length > 0 || matRawFile)
                        ? "border-emerald-500/40 font-semibold text-foreground bg-emerald-500/5"
                        : ""
                    }`}
                  />
                </label>
              </div>

              {/* Fonte do Arquivo */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("upload", false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      matSourceType === "upload"
                        ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm"
                        : "hover:text-foreground"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("link", false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      matSourceType === "link"
                        ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm"
                        : "hover:text-foreground"
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              {matSourceType === "upload" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.mp4,.gif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleSelectMultipleFiles(e.target.files, false);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }
                    }}
                  />

                  {matFiles.length > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-gold/30 bg-gold/5 p-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-gold" />
                          Arquivos Inclusos ({matFiles.length})
                        </span>
                        <span className="text-gold font-mono text-[11px] font-bold">
                          {matSize} total
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {matFiles.map((f, idx) => (
                          <div
                            key={f.id || idx}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/90 p-2 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {f.thumbnailUrl ? (
                                <div
                                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 cursor-pointer group"
                                  onClick={() => openLightbox([f], 0)}
                                >
                                  <img
                                    src={f.thumbnailUrl}
                                    alt={f.name}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/10 border border-gold/20 text-[10px] font-bold text-gold">
                                  {f.kind}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  {f.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {f.size}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {f.thumbnailUrl && (
                                <button
                                  type="button"
                                  onClick={() => openLightbox([f], 0)}
                                  className="p-1 text-muted-foreground hover:text-gold transition rounded hover:bg-gold/10"
                                  title="Visualizar prévia"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFileItem(idx, false)}
                                className="p-1 text-muted-foreground hover:text-red-400 transition shrink-0 rounded hover:bg-red-500/10"
                                title="Remover este arquivo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gold/40 text-xs font-semibold text-gold hover:bg-gold/10 transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar Mais Arquivos ao Pacote
                      </button>
                    </div>
                  ) : matRawFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold font-bold text-xs shrink-0">
                          {matKind}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {matRawFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{matSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMatRawFile(null);
                          setMatRawFileName("");
                          setMatSize("");
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-400 transition shrink-0 rounded-lg hover:bg-red-500/10"
                        title="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-border/50 hover:border-gold/50 rounded-xl p-6 text-center transition-all group bg-card/30 hover:bg-card/60 space-y-2"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Clique para selecionar 1 ou vários arquivos
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, PDF, ZIP, MP4 e mais — você pode selecionar múltiplos juntos
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Link Field */}
              {matSourceType === "link" && (
                <label className="block">
                  <span className="text-xs font-medium">URL para Download</span>
                  <input
                    value={matFileUrl}
                    onChange={(e) => setMatFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... ou Dropbox, WeTransfer..."
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                    required={matSourceType === "link"}
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Google Drive, Dropbox, WeTransfer ou qualquer link direto de download.
                  </span>
                </label>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
              >
                Cadastrar Material
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL EDITAR MATERIAL ────────────────────────────────────────── */}
      {editMatId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEditMaterial}
            className="w-full max-w-md flex flex-col max-h-[90vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Editar Arquivo de Apoio</h3>
              <button
                type="button"
                onClick={() => setEditMatId(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              {/* Pasta */}
              {foldersList.length > 0 && (
                <label className="block">
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    <Folder className="h-3 w-3 text-gold" /> Salvar dentro da Pasta
                  </span>
                  <select
                    value={editMatFolderId}
                    onChange={(e) => setEditMatFolderId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="">Sem pasta (Arquivo Geral)</option>
                    {foldersList.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="text-xs font-medium">Título do Arquivo</span>
                <input
                  value={editMatTitle}
                  onChange={(e) => setEditMatTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium">Tipo de Arquivo</span>
                  <select
                    value={editMatKind}
                    onChange={(e) => handleKindChange(e.target.value, true)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="PACOTE">PACOTE (VÁRIOS ARQUIVOS)</option>
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="DOC">DOC</option>
                    <option value="VIDEO">VÍDEO</option>
                    <option value="XLS">PLANILHA</option>
                    <option value="PNG">IMAGEM</option>
                  </select>
                </label>
                <label className="block">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Tamanho Estimado</span>
                    {editMatSourceType === "upload" && editMatFiles.length > 0 ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Total ({editMatFiles.length} arq.)
                      </span>
                    ) : editMatSourceType === "upload" && (editMatRawFile || editMatRawFileName) ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Calculado
                      </span>
                    ) : editMatSourceType === "upload" ? (
                      <span className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Auto ao anexar
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        Estimado ({editMatKind})
                      </span>
                    )}
                  </div>
                  <input
                    value={editMatSize}
                    onChange={(e) => setEditMatSize(e.target.value)}
                    placeholder={
                      editMatSourceType === "upload"
                        ? "Calculado ao selecionar..."
                        : `Ex: ${ESTIMATED_SIZES[editMatKind] || "2,5 MB"}`
                    }
                    className={`mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition-all focus:border-gold ${
                      editMatSourceType === "upload" &&
                      (editMatFiles.length > 0 || editMatRawFile || editMatRawFileName)
                        ? "border-emerald-500/40 font-semibold text-foreground bg-emerald-500/5"
                        : ""
                    }`}
                  />
                </label>
              </div>

              {/* Segmented Control */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("upload", true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      editMatSourceType === "upload"
                        ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm"
                        : "hover:text-foreground"
                    }`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("link", true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
                      editMatSourceType === "link"
                        ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm"
                        : "hover:text-foreground"
                    }`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone (Edit) */}
              {editMatSourceType === "upload" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={editFileInputRef}
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.mp4,.gif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleSelectMultipleFiles(e.target.files, true);
                        if (editFileInputRef.current) editFileInputRef.current.value = "";
                      }
                    }}
                  />

                  {editMatFiles.length > 0 ? (
                    <div className="space-y-2 rounded-2xl border border-gold/30 bg-gold/5 p-3.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span className="flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-gold" />
                          Arquivos Inclusos ({editMatFiles.length})
                        </span>
                        <span className="text-gold font-mono text-[11px] font-bold">
                          {editMatSize} total
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {editMatFiles.map((f, idx) => (
                          <div
                            key={f.id || idx}
                            className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/90 p-2 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {f.thumbnailUrl ? (
                                <div
                                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/60 cursor-pointer group"
                                  onClick={() => openLightbox([f], 0)}
                                >
                                  <img
                                    src={f.thumbnailUrl}
                                    alt={f.name}
                                    className="h-full w-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <Eye className="h-3.5 w-3.5 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/10 border border-gold/20 text-[10px] font-bold text-gold">
                                  {f.kind}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="block truncate font-medium text-foreground">
                                  {f.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {f.size}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {f.thumbnailUrl && (
                                <button
                                  type="button"
                                  onClick={() => openLightbox([f], 0)}
                                  className="p-1 text-muted-foreground hover:text-gold transition rounded hover:bg-gold/10"
                                  title="Visualizar prévia"
                                >
                                  <ZoomIn className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFileItem(idx, true)}
                                className="p-1 text-muted-foreground hover:text-red-400 transition shrink-0 rounded hover:bg-red-500/10"
                                title="Remover este arquivo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-gold/40 text-xs font-semibold text-gold hover:bg-gold/10 transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> Adicionar Mais Arquivos ao Pacote
                      </button>
                    </div>
                  ) : editMatRawFile || editMatRawFileName ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold font-bold text-xs shrink-0">
                          {editMatKind}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {editMatRawFile ? editMatRawFile.name : editMatRawFileName}
                          </p>
                          <p className="text-xs text-muted-foreground">{editMatSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMatRawFile(null);
                          setEditMatRawFileName("");
                          setEditMatSize("");
                          if (editFileInputRef.current) editFileInputRef.current.value = "";
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-400 transition shrink-0 rounded-lg hover:bg-red-500/10"
                        title="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      className="cursor-pointer border-2 border-dashed border-border/50 hover:border-gold/50 rounded-xl p-6 text-center transition-all group bg-card/30 hover:bg-card/60 space-y-2"
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold mx-auto group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-foreground">
                        Clique para selecionar 1 ou vários arquivos
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        PNG, PDF, ZIP, MP4 e mais — você pode selecionar múltiplos juntos
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Link Field (Edit) */}
              {editMatSourceType === "link" && (
                <label className="block">
                  <span className="text-xs font-medium">URL para Download</span>
                  <input
                    value={editMatFileUrl}
                    onChange={(e) => setEditMatFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... ou Dropbox, WeTransfer..."
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                    required={editMatSourceType === "link"}
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    Google Drive, Dropbox, WeTransfer ou qualquer link direto de download.
                  </span>
                </label>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setEditMatId(null)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
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

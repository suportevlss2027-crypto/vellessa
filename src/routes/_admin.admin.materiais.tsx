import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Files,
  FolderArchive,
  Link2,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAffiliateStore, type DynamicMaterial, type MaterialFileItem } from "@/lib/affiliate-store";
import { formatBytes, getRawFile } from "@/lib/file-storage";

export const Route = createFileRoute("/_admin/admin/materiais")({
  head: () => ({
    meta: [{ title: "Links e Materiais — Vellessa CMS" }],
  }),
  component: AdminMateriaisPage,
});

function AdminMateriaisPage() {
  const {
    linksList,
    materialsList,
    createAffiliateLink,
    updateAffiliateLink,
    deleteAffiliateLink,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useAffiliateStore();

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

  // Estimativas inteligentes por tipo de arquivo (para links externos ou antes do upload)
  const ESTIMATED_SIZES: Record<string, string> = {
    PDF: "2,5 MB",
    PNG: "1,8 MB",
    ZIP: "15,0 MB",
    VIDEO: "45,0 MB",
    XLS: "650 KB",
    DOC: "1,2 MB",
  };

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
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Recalcula dinamicamente ao trocar o tipo de arquivo
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

  // Ajusta o tamanho ao alternar entre upload e link externo
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

  const openNewMaterialModal = () => {
    setMatTitle("");
    setMatKind("PDF");
    setMatSize("");
    setMatFileUrl("");
    setMatRawFile(null);
    setMatRawFileName("");
    setMatFiles([]);
    setMatSourceType("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowMaterialModal(true);
  };

  // Upload múltiplo de arquivos com cálculo dinâmico da soma total
  const handleSelectMultipleFiles = (fileList: FileList | File[], isEdit = false) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    const newItems: MaterialFileItem[] = filesArray.map((file, i) => {
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

    if (isEdit) {
      const combined = [...editMatFiles, ...newItems];
      setEditMatFiles(combined);
      const totalBytes = combined.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setEditMatSize(formatBytes(totalBytes));

      // Auto-classificação: se todos iguais e só 1, usa o formato; se múltiplos, "PACOTE"
      const kinds = new Set(combined.map((f) => f.kind));
      if (combined.length > 1) {
        setEditMatKind("PACOTE");
      } else if (combined.length === 1) {
        setEditMatKind(combined[0].kind);
      }

      if (!editMatTitle.trim() && combined.length > 0) {
        setEditMatTitle(combined[0].name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } else {
      const combined = [...matFiles, ...newItems];
      setMatFiles(combined);
      const totalBytes = combined.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setMatSize(formatBytes(totalBytes));

      const kinds = new Set(combined.map((f) => f.kind));
      if (combined.length > 1) {
        setMatKind("PACOTE");
      } else if (combined.length === 1) {
        setMatKind(combined[0].kind);
      }

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
      if (updated.length === 1) {
        setEditMatKind(updated[0].kind);
      }
      if (updated.length === 0 && editFileInputRef.current) editFileInputRef.current.value = "";
    } else {
      const updated = matFiles.filter((_, i) => i !== index);
      setMatFiles(updated);
      const totalBytes = updated.reduce((acc, f) => acc + (f.bytes || 0), 0);
      setMatSize(updated.length > 0 ? formatBytes(totalBytes) : "");
      if (updated.length === 1) {
        setMatKind(updated[0].kind);
      }
      if (updated.length === 0 && fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectRawFile = (file: File, isEdit = false) => {
    handleSelectMultipleFiles([file], isEdit);
  };

  // Scroll lock para evitar duplo scrollbar
  const anyModalOpen =
    showLinkModal ||
    editLinkId !== null ||
    showMaterialModal ||
    editMatId !== null;

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
    });

    setMatTitle("");
    setMatKind("PDF");
    setMatSize("");
    setMatFileUrl("");
    setMatRawFile(null);
    setMatRawFileName("");
    setMatFiles([]);
    setMatSourceType("upload");
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
    if (m.file_url) {
      window.open(m.file_url, "_blank");
    } else {
      toast.info("Material sem arquivo ou link anexado.");
    }
  };

  const handleDeleteMaterial = (idOrTitle: string) => {
    if (window.confirm("Excluir este material para download definitivamente?")) {
      deleteMaterial(idOrTitle);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── SEÇÃO 1: LINKS OFICIAIS & LOGZZ ────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Links Oficiais & Afiliação Logzz</h2>
            <p className="text-xs text-muted-foreground">
              Configure as páginas de demonstração oficiais e os links de acesso à Logzz disponibilizados para as afiliadas.
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
                    {link.note && (
                      <p className="text-xs text-muted-foreground mt-1">{link.note}</p>
                    )}
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

      {/* ── SEÇÃO 2: MATERIAIS PARA DOWNLOAD ──────────────────────────────── */}
      <section className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Arquivos, PDFs e Manuais</h2>
            <p className="text-xs text-muted-foreground">
              Materiais de apoio oficiais liberados para download na aba de Materiais dos afiliados (com link direto para Google Drive, Dropbox, PDF).
            </p>
          </div>
          <button
            onClick={openNewMaterialModal}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-xs font-semibold hover:border-gold hover:text-gold transition self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Novo Material
          </button>
        </div>

        {materialsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
            <FolderArchive className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-xs font-medium text-muted-foreground">Nenhum material cadastrado ainda.</p>
            <button
              onClick={openNewMaterialModal}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-xs font-semibold hover:border-gold hover:text-gold transition"
            >
              <Plus className="h-3.5 w-3.5" /> Cadastrar Primeiro Material
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card divide-y">
            {materialsList.map((m) => {
              const matKey = m.id || m.title;
              return (
                <div key={matKey} className="flex items-center justify-between p-4 hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-xs font-bold text-gold">
                      {m.kind}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-foreground truncate">{m.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        <span>{m.kind}</span>
                        <span>·</span>
                        <span>{m.size}</span>
                        {m.files && m.files.length > 1 ? (
                          <>
                            <span>·</span>
                            <span className="text-gold text-[11px] font-medium inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 border border-gold/20">
                              <Package className="h-3 w-3" /> Pacote com {m.files.length} arquivos
                            </span>
                          </>
                        ) : m.sourceType === "upload" || m.rawFileName ? (
                          <>
                            <span>·</span>
                            <span className="text-gold text-[11px] font-medium inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 border border-gold/20">
                              <FileUp className="h-3 w-3" /> Arquivo Bruto: {m.rawFileName || "Upload Local"}
                            </span>
                          </>
                        ) : m.file_url ? (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 text-[11px] font-medium inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                              <ExternalLink className="h-3 w-3" /> Link Externo
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTestDownload(m)}
                      className="p-2 text-muted-foreground hover:text-foreground transition"
                      title="Testar Download / Abrir"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditMaterial(m)}
                      className="p-2 text-muted-foreground hover:text-gold transition"
                      title="Editar material"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMaterial(matKey)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition"
                      title="Excluir material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
            className="w-full max-w-md flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
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

              {/* Segmented Control: Upload vs Link */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("upload", false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${matSourceType === "upload" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("link", false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${matSourceType === "link" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone (Suporta 1 ou Vários Arquivos) */}
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
                          Arquivos Inclusos no Material ({matFiles.length})
                        </span>
                        <span className="text-gold font-mono text-[11px] font-bold">{matSize} total</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {matFiles.map((f, idx) => (
                          <div key={f.id || idx} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/90 p-2 text-xs shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="grid h-6 w-9 place-items-center rounded bg-gold/15 text-[10px] font-bold text-gold shrink-0 border border-gold/20">
                                {f.kind}
                              </span>
                              <span className="truncate font-medium text-foreground">{f.name}</span>
                              <span className="text-[11px] text-muted-foreground shrink-0 font-mono">({f.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFileItem(idx, false)}
                              className="p-1 text-muted-foreground hover:text-red-400 transition shrink-0 rounded hover:bg-red-500/10"
                              title="Remover este arquivo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
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
                          <p className="text-sm font-semibold text-foreground truncate">{matRawFile.name}</p>
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
                      <p className="text-xs font-semibold text-foreground">Clique para selecionar 1 ou vários arquivos</p>
                      <p className="text-[10px] text-muted-foreground">Você pode selecionar múltiplos PNGs, PDFs, ZIPs, MP4s juntos</p>
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
            className="w-full max-w-md flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
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
                      editMatSourceType === "upload" && (editMatFiles.length > 0 || editMatRawFile || editMatRawFileName)
                        ? "border-emerald-500/40 font-semibold text-foreground bg-emerald-500/5"
                        : ""
                    }`}
                  />
                </label>
              </div>

              {/* Segmented Control: Upload vs Link */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("upload", true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${editMatSourceType === "upload" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSourceTypeChange("link", true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${editMatSourceType === "link" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone (Edit - Suporta 1 ou Vários Arquivos) */}
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
                          Arquivos Inclusos no Material ({editMatFiles.length})
                        </span>
                        <span className="text-gold font-mono text-[11px] font-bold">{editMatSize} total</span>
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                        {editMatFiles.map((f, idx) => (
                          <div key={f.id || idx} className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/90 p-2 text-xs shadow-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="grid h-6 w-9 place-items-center rounded bg-gold/15 text-[10px] font-bold text-gold shrink-0 border border-gold/20">
                                {f.kind}
                              </span>
                              <span className="truncate font-medium text-foreground">{f.name}</span>
                              <span className="text-[11px] text-muted-foreground shrink-0 font-mono">({f.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFileItem(idx, true)}
                              className="p-1 text-muted-foreground hover:text-red-400 transition shrink-0 rounded hover:bg-red-500/10"
                              title="Remover este arquivo"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
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
                      <p className="text-xs font-semibold text-foreground">Clique para selecionar 1 ou vários arquivos</p>
                      <p className="text-[10px] text-muted-foreground">Você pode selecionar múltiplos PNGs, PDFs, ZIPs, MP4s juntos</p>
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

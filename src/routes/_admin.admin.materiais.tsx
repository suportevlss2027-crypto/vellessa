import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FileUp,
  FolderArchive,
  Link2,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAffiliateStore, type DynamicMaterial } from "@/lib/affiliate-store";
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

  // ── MODAL NOVO MATERIAL ────────────────────────────────────────────────────
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matSize, setMatSize] = useState("2,5 MB");
  const [matFileUrl, setMatFileUrl] = useState("");
  const [matSourceType, setMatSourceType] = useState<"upload" | "link">("upload");
  const [matRawFile, setMatRawFile] = useState<File | null>(null);
  const [matRawFileName, setMatRawFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── MODAL EDITAR MATERIAL ──────────────────────────────────────────────────
  const [editMatId, setEditMatId] = useState<string | null>(null);
  const [editMatTitle, setEditMatTitle] = useState("");
  const [editMatKind, setEditMatKind] = useState("PDF");
  const [editMatSize, setEditMatSize] = useState("2,5 MB");
  const [editMatFileUrl, setEditMatFileUrl] = useState("");
  const [editMatSourceType, setEditMatSourceType] = useState<"upload" | "link">("upload");
  const [editMatRawFile, setEditMatRawFile] = useState<File | null>(null);
  const [editMatRawFileName, setEditMatRawFileName] = useState("");
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectRawFile = (file: File, isEdit = false) => {
    const rawExt = file.name.split(".").pop()?.toUpperCase() || "DOC";
    let mappedKind = rawExt;
    if (rawExt === "JPG" || rawExt === "JPEG") mappedKind = "PNG";
    else if (rawExt === "DOCX") mappedKind = "DOC";
    else if (rawExt === "XLSX") mappedKind = "XLS";
    else if (rawExt === "MP4") mappedKind = "VIDEO";

    const formattedSize = formatBytes(file.size);
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    if (isEdit) {
      setEditMatRawFile(file);
      setEditMatRawFileName(file.name);
      setEditMatSize(formattedSize);
      if (!editMatTitle.trim()) setEditMatTitle(cleanTitle);
      setEditMatKind(mappedKind);
    } else {
      setMatRawFile(file);
      setMatRawFileName(file.name);
      setMatSize(formattedSize);
      if (!matTitle.trim()) setMatTitle(cleanTitle);
      setMatKind(mappedKind);
    }
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
    if (matSourceType === "upload" && !matRawFile) {
      toast.error("Por favor, selecione um arquivo bruto para upload ou escolha Link Externo.");
      return;
    }
    if (matSourceType === "link" && !matFileUrl.trim()) {
      toast.error("Por favor, informe a URL do arquivo.");
      return;
    }

    await createMaterial({
      title: matTitle.trim(),
      kind: matKind.trim(),
      size: matSize.trim() || "1,0 MB",
      file_url: matSourceType === "link" ? matFileUrl.trim() : undefined,
      sourceType: matSourceType,
      rawFileName: matRawFileName || matRawFile?.name,
      mimeType: matRawFile?.type,
      rawFile: matRawFile || undefined,
    });

    setMatTitle("");
    setMatKind("PDF");
    setMatSize("2,5 MB");
    setMatFileUrl("");
    setMatRawFile(null);
    setMatRawFileName("");
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
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatId) return;
    await updateMaterial(editMatId, {
      title: editMatTitle.trim(),
      kind: editMatKind.trim(),
      size: editMatSize.trim() || "1,0 MB",
      file_url: editMatSourceType === "link" ? editMatFileUrl.trim() : undefined,
      sourceType: editMatSourceType,
      rawFileName: editMatRawFileName || editMatRawFile?.name,
      mimeType: editMatRawFile?.type,
      rawFile: editMatRawFile || undefined,
    });
    setEditMatId(null);
    setEditMatRawFile(null);
    setEditMatRawFileName("");
  };

  const handleTestDownload = async (m: DynamicMaterial) => {
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
            onClick={() => setShowMaterialModal(true)}
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
              onClick={() => setShowMaterialModal(true)}
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
                        {m.sourceType === "upload" || m.rawFileName ? (
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
                    onChange={(e) => setMatKind(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="DOC">DOC</option>
                    <option value="VIDEO">VÍDEO</option>
                    <option value="XLS">PLANILHA</option>
                    <option value="PNG">IMAGEM</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Tamanho Estimado</span>
                  <input
                    value={matSize}
                    onChange={(e) => setMatSize(e.target.value)}
                    placeholder="Ex: 5,4 MB"
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  />
                </label>
              </div>

              {/* Segmented Control: Upload vs Link */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => setMatSourceType("upload")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${matSourceType === "upload" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatSourceType("link")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${matSourceType === "link" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
              {matSourceType === "upload" && (
                !matRawFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-border/50 hover:border-gold/50 rounded-xl p-6 text-center transition-all group bg-card/30 hover:bg-card/60 space-y-2"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.mp4,.gif"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelectRawFile(f); }}
                    />
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-gold mx-auto group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">Clique para selecionar o arquivo</p>
                    <p className="text-[10px] text-muted-foreground">PNG, PDF, ZIP, DOC, XLS, MP4 e outros</p>
                  </div>
                ) : (
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
                      onClick={() => { setMatRawFile(null); setMatRawFileName(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition shrink-0 rounded-lg hover:bg-red-500/10"
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
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
                    onChange={(e) => setEditMatKind(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="DOC">DOC</option>
                    <option value="VIDEO">VÍDEO</option>
                    <option value="XLS">PLANILHA</option>
                    <option value="PNG">IMAGEM</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Tamanho Estimado</span>
                  <input
                    value={editMatSize}
                    onChange={(e) => setEditMatSize(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  />
                </label>
              </div>

              {/* Segmented Control: Upload vs Link */}
              <div>
                <span className="text-xs font-medium block mb-1.5">Fonte do Arquivo</span>
                <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-medium text-muted-foreground border border-border/50">
                  <button
                    type="button"
                    onClick={() => setEditMatSourceType("upload")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${editMatSourceType === "upload" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload de Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMatSourceType("link")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${editMatSourceType === "link" ? "bg-gold/15 text-gold font-bold border border-gold/30 shadow-sm" : "hover:text-foreground"}`}
                  >
                    <Link2 className="h-3.5 w-3.5" /> Link Externo
                  </button>
                </div>
              </div>

              {/* Upload Zone (Edit) */}
              {editMatSourceType === "upload" && (
                !editMatRawFile ? (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-border/50 hover:border-gold/50 rounded-xl p-5 text-center transition-all group bg-card/30 hover:bg-card/60 space-y-1.5"
                  >
                    <input
                      type="file"
                      ref={editFileInputRef}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx,.xls,.xlsx,.mp4,.gif"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelectRawFile(f, true); }}
                    />
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold mx-auto group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    {editMatRawFileName ? (
                      <div>
                        <p className="text-xs font-semibold text-gold">Arquivo atual: {editMatRawFileName}</p>
                        <p className="text-[10px] text-muted-foreground">Clique para substituir o arquivo</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-foreground">Clique para selecionar novo arquivo</p>
                        <p className="text-[10px] text-muted-foreground">PNG, PDF, ZIP, DOC, XLS, MP4 e outros</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/15 text-gold font-bold text-xs shrink-0">
                        {editMatKind}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{editMatRawFile.name}</p>
                        <p className="text-xs text-muted-foreground">{editMatSize}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditMatRawFile(null); setEditMatRawFileName(""); if (editFileInputRef.current) editFileInputRef.current.value = ""; }}
                      className="p-1.5 text-muted-foreground hover:text-red-400 transition shrink-0 rounded-lg hover:bg-red-500/10"
                      title="Remover arquivo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
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

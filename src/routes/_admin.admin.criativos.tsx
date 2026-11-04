import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";
import MediaUploadField from "@/components/admin/MediaUploadField";

export const Route = createFileRoute("/_admin/admin/criativos")({
  head: () => ({
    meta: [{ title: "Gestão de Criativos — Vellessa CMS" }],
  }),
  component: AdminCriativosPage,
});

type CreativeType = "Feed" | "Stories" | "Reels" | "Copy";

function AdminCriativosPage() {
  const { creativesList, createCreative, updateCreative, deleteCreative } =
    useAffiliateStore();

  // ── MODAL CRIAR ──────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CreativeType>("Feed");
  const [format, setFormat] = useState("1080×1080");
  const [imageUrl, setImageUrl] = useState("");
  const [copyText, setCopyText] = useState("");

  // ── MODAL EDITAR ─────────────────────────────────────────────────────────
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState<CreativeType>("Feed");
  const [editFormat, setEditFormat] = useState("1080×1080");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editCopyText, setEditCopyText] = useState("");

  // Scroll lock para evitar duplo scrollbar
  const anyModalOpen = showModal || editId !== null;
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

  // ── helpers ───────────────────────────────────────────────────────────────
  const formatForType = (t: CreativeType) => {
    if (t === "Stories") return "1080×1920";
    if (t === "Feed") return "1080×1080";
    if (t === "Reels") return "Vídeo 0:30";
    return "Texto";
  };

  const resetCreate = () => {
    setTitle("");
    setType("Feed");
    setFormat("1080×1080");
    setImageUrl("");
    setCopyText("");
  };

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createCreative({
      title: title.trim(),
      type,
      format: format.trim(),
      image: imageUrl || undefined,
      text: copyText.trim() || undefined,
    });
    resetCreate();
    setShowModal(false);
  };

  const openEdit = (c: (typeof creativesList)[0]) => {
    setEditId(c.id);
    setEditTitle(c.title);
    setEditType(c.type as CreativeType);
    setEditFormat(c.format);
    setEditImageUrl(c.image ?? "");
    setEditCopyText(c.text ?? "");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    await updateCreative(editId, {
      title: editTitle.trim(),
      type: editType,
      format: editFormat.trim(),
      image: editImageUrl || undefined,
      text: editCopyText.trim() || undefined,
    });
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Excluir este criativo definitivamente?")) {
      deleteCreative(id);
    }
  };

  // ── TYPE BADGE COLOURS ────────────────────────────────────────────────────
  const typeBadge: Record<CreativeType, string> = {
    Feed: "bg-blue-500/10 text-blue-400",
    Stories: "bg-violet-500/10 text-violet-400",
    Reels: "bg-rose-500/10 text-rose-400",
    Copy: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold">Central de Criativos de Anúncio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre peças validadas para Feed, Stories, Reels e copys persuasivas que seus afiliados poderão baixar.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
        >
          <Plus className="h-4 w-4" /> Novo Criativo
        </button>
      </div>

      {/* ── GRID ───────────────────────────────────────────────────────── */}
      {creativesList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
          <Copy className="mx-auto h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum criativo cadastrado ainda.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold"
          >
            <Plus className="h-4 w-4" /> Criar Primeiro Criativo
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {creativesList.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl border bg-card shadow-xs flex flex-col overflow-hidden transition hover:shadow-md"
            >
              {/* Imagem / placeholder */}
              {c.image ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={c.image}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-sm ${typeBadge[c.type as CreativeType] ?? "bg-accent text-gold"}`}
                  >
                    {c.type}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 pt-5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${typeBadge[c.type as CreativeType] ?? "bg-accent text-gold"}`}
                  >
                    {c.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.format}</span>
                </div>
              )}

              {/* Body */}
              <div className="flex flex-1 flex-col p-5 pt-3 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                  {c.image && (
                    <span className="shrink-0 text-xs text-muted-foreground">{c.format}</span>
                  )}
                </div>

                {c.text && (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {c.text}
                  </p>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t pt-3">
                  <span className="text-[11px] text-muted-foreground">Disponível para todos</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="p-1.5 text-muted-foreground hover:text-gold transition"
                      title="Editar criativo"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition"
                      title="Excluir criativo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL CRIAR ────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Novo Criativo Publicitário</h3>
              <button
                type="button"
                onClick={() => { setShowModal(false); resetCreate(); }}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                ✕
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar overscroll-contain">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium">Tipo de Criativo</span>
                  <select
                    value={type}
                    onChange={(e) => {
                      const t = e.target.value as CreativeType;
                      setType(t);
                      setFormat(formatForType(t));
                    }}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="Feed">Feed (1:1)</option>
                    <option value="Stories">Stories (9:16)</option>
                    <option value="Reels">Reels / TikTok</option>
                    <option value="Copy">Texto / Copy Persuasiva</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium">Formato / Duração</span>
                  <input
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    placeholder="1080×1080 ou 0:15"
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium">Título da Peça</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ritual de Pele Dourada"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              {type !== "Copy" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium block">Imagem / Capa da Peça</span>
                  <MediaUploadField
                    value={imageUrl}
                    onChange={setImageUrl}
                    aspectRatio="square"
                  />
                </div>
              )}

              <label className="block">
                <span className="text-xs font-medium">Texto da Copy Sugerida</span>
                <textarea
                  value={copyText}
                  onChange={(e) => setCopyText(e.target.value)}
                  rows={3}
                  placeholder="Texto persuasivo para a legenda do anúncio..."
                  className="mt-1 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetCreate(); }}
                className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted transition"
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

      {/* ── MODAL EDITAR ───────────────────────────────────────────────── */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEdit}
            className="w-full max-w-lg flex flex-col max-h-[88vh] rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95"
          >
            {/* Header fixo */}
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm rounded-t-3xl">
              <h3 className="text-xl font-semibold">Editar Criativo</h3>
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
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium">Tipo de Criativo</span>
                  <select
                    value={editType}
                    onChange={(e) => {
                      const t = e.target.value as CreativeType;
                      setEditType(t);
                      setEditFormat(formatForType(t));
                    }}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  >
                    <option value="Feed">Feed (1:1)</option>
                    <option value="Stories">Stories (9:16)</option>
                    <option value="Reels">Reels / TikTok</option>
                    <option value="Copy">Texto / Copy Persuasiva</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-medium">Formato / Duração</span>
                  <input
                    value={editFormat}
                    onChange={(e) => setEditFormat(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-medium">Título da Peça</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                  required
                />
              </label>

              {editType !== "Copy" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-medium block">Imagem / Capa da Peça</span>
                  <MediaUploadField
                    value={editImageUrl}
                    onChange={setEditImageUrl}
                    aspectRatio="square"
                  />
                </div>
              )}

              <label className="block">
                <span className="text-xs font-medium">Texto da Copy Sugerida</span>
                <textarea
                  value={editCopyText}
                  onChange={(e) => setEditCopyText(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-gold"
                />
              </label>
            </div>

            {/* Footer fixo */}
            <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-white/10 bg-card/95 backdrop-blur-sm rounded-b-3xl">
              <button
                type="button"
                onClick={() => setEditId(null)}
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

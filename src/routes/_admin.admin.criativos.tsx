import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Plus, Trash2, Image, Video, FileText } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_admin/admin/criativos")({
  head: () => ({
    meta: [{ title: "Gestão de Criativos — Vellessa CMS" }],
  }),
  component: AdminCriativosPage,
});

function AdminCriativosPage() {
  const { creativesList, createCreative, deleteCreative } = useAffiliateStore();
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Feed" | "Stories" | "Reels" | "Copy">("Feed");
  const [format, setFormat] = useState("1080×1080");
  const [imageUrl, setImageUrl] = useState("");
  const [copyText, setCopyText] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createCreative({
      title: title.trim(),
      type,
      format: format.trim(),
      image: imageUrl.trim() || undefined,
      text: copyText.trim() || undefined,
    });

    setTitle("");
    setType("Feed");
    setFormat("1080×1080");
    setImageUrl("");
    setCopyText("");
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creativesList.map((c) => (
          <div key={c.id} className="relative rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-gold">
                  {c.type}
                </span>
                <span className="text-xs text-muted-foreground">{c.format}</span>
              </div>

              {c.image && (
                <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-muted">
                  <img src={c.image} alt={c.title} className="h-full w-full object-cover" />
                </div>
              )}

              <h3 className="mt-3 font-semibold text-foreground text-base">{c.title}</h3>
              {c.text && (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {c.text}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-[11px] text-muted-foreground">Disponível para todos</span>
              <button
                onClick={() => deleteCreative(c.id)}
                className="text-xs text-red-500 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <h3 className="text-xl font-semibold">Novo Criativo Publicitário</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium">Tipo de Criativo</span>
                <select
                  value={type}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setType(t);
                    if (t === "Stories") setFormat("1080×1920");
                    else if (t === "Feed") setFormat("1080×1080");
                    else if (t === "Reels") setFormat("Vídeo 0:30");
                    else if (t === "Copy") setFormat("Texto");
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
              <label className="block">
                <span className="text-xs font-medium">Link da Imagem ou Capa (URL)</span>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                />
              </label>
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

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Publicar Criativo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

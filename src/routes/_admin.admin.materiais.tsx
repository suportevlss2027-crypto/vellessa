import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Link2, Plus, Trash2 } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

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
    deleteAffiliateLink,
    createMaterial,
    deleteMaterial,
  } = useAffiliateStore();

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matKind, setMatKind] = useState("PDF");
  const [matSize, setMatSize] = useState("2,5 MB");

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

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matTitle.trim()) return;
    await createMaterial({
      title: matTitle.trim(),
      kind: matKind.trim(),
      size: matSize.trim(),
    });
    setMatTitle("");
    setMatKind("PDF");
    setMatSize("2,5 MB");
    setShowMaterialModal(false);
  };

  return (
    <div className="space-y-8">
      {/* SEÇÃO 1: LINKS DE AFILIADOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Links Rastreados de Checkout</h2>
            <p className="text-xs text-muted-foreground">
              Configure as páginas de venda oficiais. O código único de cada afiliado será inserido automaticamente.
            </p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
          >
            <Plus className="h-4 w-4" /> Novo Link
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {linksList.map((link) => (
            <div key={link.url} className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">{link.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.note}</p>
                <p className="mt-3 truncate rounded-lg bg-muted/60 p-2 font-mono text-xs text-muted-foreground">
                  {link.url}
                </p>
              </div>
              <div className="mt-4 border-t pt-3 flex justify-end">
                <button
                  onClick={() => deleteAffiliateLink(link.id || link.url)}
                  className="text-xs text-red-500 hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir Link
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 2: MATERIAIS PARA DOWNLOAD */}
      <section className="space-y-4 pt-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold">Arquivos, PDFs e Manuais</h2>
            <p className="text-xs text-muted-foreground">
              Materiais de apoio oficiais liberados para download na aba de Materiais dos afiliados.
            </p>
          </div>
          <button
            onClick={() => setShowMaterialModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 text-xs font-semibold hover:border-gold hover:text-gold transition"
          >
            <Plus className="h-4 w-4" /> Novo Material
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card divide-y">
          {materialsList.map((m) => (
            <div key={m.title} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-xs font-bold text-gold">
                  {m.kind}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.kind} · {m.size}</p>
                </div>
              </div>
              <button
                onClick={() => deleteMaterial(m.id || m.title)}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL LINK */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateLink}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <h3 className="text-xl font-semibold">Novo Link de Afiliada</h3>
            <label className="block">
              <span className="text-xs font-medium">Nome / Rótulo</span>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Ex: Oferta Kit 3 Frascos"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium">URL de Destino</span>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://vellessa.com/kit3?ref=VLS-20481"
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
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Salvar Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL MATERIAL */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateMaterial}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <h3 className="text-xl font-semibold">Adicionar Arquivo de Apoio</h3>
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
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Cadastrar Material
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

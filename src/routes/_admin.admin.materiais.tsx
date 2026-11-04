import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ExternalLink,
  FileText,
  FolderArchive,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
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

  // ── MODAL EDITAR MATERIAL ──────────────────────────────────────────────────
  const [editMatId, setEditMatId] = useState<string | null>(null);
  const [editMatTitle, setEditMatTitle] = useState("");
  const [editMatKind, setEditMatKind] = useState("PDF");
  const [editMatSize, setEditMatSize] = useState("2,5 MB");
  const [editMatFileUrl, setEditMatFileUrl] = useState("");

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
    await createMaterial({
      title: matTitle.trim(),
      kind: matKind.trim(),
      size: matSize.trim() || "1,0 MB",
      file_url: matFileUrl.trim() || undefined,
    });
    setMatTitle("");
    setMatKind("PDF");
    setMatSize("2,5 MB");
    setMatFileUrl("");
    setShowMaterialModal(false);
  };

  const openEditMaterial = (m: (typeof materialsList)[0]) => {
    setEditMatId(m.id || m.title);
    setEditMatTitle(m.title);
    setEditMatKind(m.kind);
    setEditMatSize(m.size);
    setEditMatFileUrl(m.file_url || "");
  };

  const handleEditMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMatId) return;
    await updateMaterial(editMatId, {
      title: editMatTitle.trim(),
      kind: editMatKind.trim(),
      size: editMatSize.trim() || "1,0 MB",
      file_url: editMatFileUrl.trim() || undefined,
    });
    setEditMatId(null);
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{m.kind}</span>
                        <span>·</span>
                        <span>{m.size}</span>
                        {m.file_url && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Link Configurado
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateLink}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Novo Link de Apoio ou Logzz</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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

      {/* ── MODAL EDITAR LINK ────────────────────────────────────────────── */}
      {editLinkId !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEditLink}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Editar Link de Apoio</h3>
              <button
                type="button"
                onClick={() => setEditLinkId(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditLinkId(null)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL NOVO MATERIAL ──────────────────────────────────────────── */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleCreateMaterial}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Adicionar Arquivo de Apoio</h3>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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

            <label className="block">
              <span className="text-xs font-medium">Link do Arquivo (URL para Download)</span>
              <input
                value={matFileUrl}
                onChange={(e) => setMatFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... ou link direto"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Opcional. Se preenchido, o botão "Baixar Pacote" na área do afiliado baixará ou abrirá este arquivo diretamente.
              </span>
            </label>

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

      {/* ── MODAL EDITAR MATERIAL ────────────────────────────────────────── */}
      {editMatId !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-overlay/60 p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleEditMaterial}
            className="w-full max-w-md rounded-3xl border bg-card p-6 shadow-2xl animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Editar Arquivo de Apoio</h3>
              <button
                type="button"
                onClick={() => setEditMatId(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

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

            <label className="block">
              <span className="text-xs font-medium">Link do Arquivo (URL para Download)</span>
              <input
                value={editMatFileUrl}
                onChange={(e) => setEditMatFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... ou link direto"
                className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-gold"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Opcional. Link direto ou Google Drive/Dropbox para o arquivo.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditMatId(null)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
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

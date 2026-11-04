import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Files,
  Folder,
  FolderOpen,
  HelpCircle,
  Link2,
  Package,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import {
  useAffiliateStore,
  type DynamicMaterial,
  type MaterialFileItem,
} from "@/lib/affiliate-store";
import { getRawFile } from "@/lib/file-storage";

export const Route = createFileRoute("/_app/materiais")({
  head: () => ({
    meta: [
      { title: "Links e Materiais — Vellessa Afiliados" },
      {
        name: "description",
        content: "Acesso à Logzz para links oficiais rastreados, páginas de demonstração, manuais e materiais de apoio Vellessa.",
      },
      { property: "og:title", content: "Links e Materiais — Vellessa Afiliados" },
      { property: "og:description", content: "Central de links oficiais Logzz, páginas de referência e materiais de apoio." },
    ],
  }),
  component: Materiais,
});

// ── Lightbox ─────────────────────────────────────────────────────────────────
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

  const isImage = !!current.thumbnailUrl && (current.mimeType?.startsWith("image/") ?? true);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center justify-center w-full h-full max-w-5xl max-h-[90vh] px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm">
          <X className="h-5 w-5" />
        </button>

        {/* Nav Prev */}
        {files.length > 1 && (
          <button onClick={prev} className="absolute left-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Media */}
        <div className="flex-1 flex items-center justify-center w-full overflow-hidden rounded-2xl">
          {isImage ? (
            <img
              src={current.thumbnailUrl!}
              alt={current.name}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95"
            />
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

        {/* Footer info */}
        <div className="mt-3 flex items-center gap-3 text-white/70 text-xs">
          <span className="font-medium text-white">{current.name}</span>
          <span>·</span>
          <span>{current.size}</span>
          {files.length > 1 && (
            <>
              <span>·</span>
              <span>{index + 1} / {files.length}</span>
            </>
          )}
        </div>

        {/* Nav Next */}
        {files.length > 1 && (
          <button onClick={next} className="absolute right-2 z-10 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition backdrop-blur-sm">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Dots */}
        {files.length > 1 && (
          <div className="mt-3 flex gap-1.5">
            {files.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-gold" : "w-1.5 bg-white/30"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function Materiais() {
  const { copyText, downloadAsset, profile, linksList, materialsList, foldersList } = useAffiliateStore();

  // ── FOLDER FILTER ──────────────────────────────────────────────────────────
  const [activeFolderId, setActiveFolderId] = useState<string | "all" | "none">("all");

  // ── LIGHTBOX STATE ─────────────────────────────────────────────────────────
  const [lightboxFiles, setLightboxFiles] = useState<MaterialFileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openLightbox = (files: MaterialFileItem[], idx = 0) => {
    setLightboxFiles(files);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxFiles([]);

  useEffect(() => {
    document.body.style.overflow = lightboxFiles.length > 0 ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxFiles.length]);

  // ── FOLDER COLOR MAPS ──────────────────────────────────────────────────────
  const COLOR_MAP: Record<string, string> = {
    gold: "bg-gold/15 border-gold/40 text-gold",
    emerald: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
    rose: "bg-rose-500/15 border-rose-500/40 text-rose-400",
    violet: "bg-violet-500/15 border-violet-500/40 text-violet-400",
    sky: "bg-sky-500/15 border-sky-500/40 text-sky-400",
    amber: "bg-amber-500/15 border-amber-500/40 text-amber-400",
  };

  // ── DOWNLOAD HANDLERS ──────────────────────────────────────────────────────
  const handleDownloadFileItem = async (f: MaterialFileItem) => {
    if (f.sourceType === "upload" || !f.file_url) {
      const blob = await getRawFile(f.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = f.name;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        toast.success(`Download de "${f.name}" iniciado!`);
        return;
      }
    }
    if (f.file_url) { downloadAsset(f.file_url, f.name); return; }
    toast.info("Arquivo não disponível para download.");
  };

  const handleDownloadAllFiles = async (m: DynamicMaterial) => {
    if (m.files && m.files.length > 0) {
      toast.info(`Iniciando download do pacote (${m.files.length} arquivos)...`);
      for (let i = 0; i < m.files.length; i++) {
        const f = m.files[i];
        setTimeout(() => { handleDownloadFileItem(f); }, i * 400);
      }
      return;
    }
    handleDownloadMaterial(m);
  };

  const handleDownloadMaterial = async (m: DynamicMaterial) => {
    if ((m.sourceType === "upload" || m.rawFileName) && m.id) {
      const blob = await getRawFile(m.id);
      if (blob) {
        const filename = m.rawFileName || `${m.title}.${m.kind.toLowerCase()}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        toast.success(`Download de "${filename}" iniciado!`);
        return;
      }
    }
    if (m.file_url) {
      downloadAsset(m.file_url, `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase()}`);
      return;
    }
    const content = `=== VELLESSA AFILIADOS - ARQUIVO OFICIAL DE APOIO ===\n\nTítulo: ${m.title}\nTipo: ${m.kind}\nTamanho do Pacote: ${m.size}\nAluna/Membro: ${profile.name} (ID: ${profile.id})\nData de Emissão: ${new Date().toLocaleDateString("pt-BR")}\n\nEste documento contém diretrizes oficiais de divulgação.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`;
    downloadAsset(url, filename);
  };

  // ── FILTERED MATERIALS ─────────────────────────────────────────────────────
  const filteredMaterials = materialsList.filter((m) => {
    if (activeFolderId === "all") return true;
    if (activeFolderId === "none") return !m.folderId;
    return m.folderId === activeFolderId;
  });

  return (
    <div className="space-y-8">
      {/* Lightbox */}
      {lightboxFiles.length > 0 && (
        <Lightbox files={lightboxFiles} startIndex={lightboxIndex} onClose={closeLightbox} />
      )}

      <PageHeader
        eyebrow="Central de Vendas & Ativos Oficiais"
        title="Links e Materiais de Apoio"
        description="Instruções para acessar seus links de vendas na Logzz, além de páginas oficiais de demonstração, manuais, fotos e copys validadas."
      />

      {/* 1. CARD PRINCIPAL OFICIAL: CONEXÃO COM A PLATAFORMA LOGZZ */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-card/90 to-card/70 p-6 md:p-8 backdrop-blur-xl shadow-soft">
        <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-md">
                <span className="font-display text-sm font-black tracking-tighter text-emerald-800">LQZZ</span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>Plataforma Oficial de Checkout & Comissões</span>
                </div>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Onde está o seu link de vendas comissionado?
                </h2>
              </div>
            </div>
            <a
              href="https://app.logzz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-3 text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02]"
            >
              <span>Acessar Painel Logzz & Pegar Meus Links</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-medium">
                A Vellessa opera no modelo <strong className="text-emerald-300">Cash on Delivery (Pagamento na Entrega)</strong> em parceria com a <strong className="text-foreground">Logzz</strong>.
                É dentro do seu painel da Logzz que seu link com pixel de afiliada é gerado, as vendas caem em tempo real e você recebe suas comissões de <strong className="text-gold">até 60%</strong> direto no Pix.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Esta plataforma Vellessa é a sua <strong>área de membros e suporte</strong> (aulas, criativos e materiais).</span>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-2.5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Como pegar seu link em 3 passos:</p>
              <div className="space-y-2 text-xs text-foreground/80">
                {["Entre na sua conta da Logzz (app.logzz.com.br).", "Acesse Meus Produtos / Vitrine e selecione a Vellessa.", "Copie o link com seu pixel do kit escolhido (ex: Kit 3 Campeão) e anuncie!"].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PÁGINAS OFICIAIS DE DEMONSTRAÇÃO E ESTUDO */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Páginas Oficiais de Demonstração</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Utilize estas páginas como referência para estudar os argumentos, ofertas e estrutura dos funis da Vellessa.</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold self-start sm:self-auto">
            <Sparkles className="h-3 w-3" />
            <span>Páginas de Referência e Estudo</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-xs text-foreground/85">
          <AlertCircle className="h-4 w-4 text-gold shrink-0" />
          <span><strong>Atenção:</strong> Estes links abaixo são modelos públicos oficiais para você navegar e analisar. Para anunciar e receber comissão de 60%, <strong>você deve usar o link com seu código gerado dentro da Logzz</strong>.</span>
        </div>

        {linksList.length === 0 ? (
          <EmptyState icon={Link2} title="Nenhuma página cadastrada" description="As páginas oficiais de referência e demonstração serão cadastradas pelo administrador." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {linksList.map((l, i) => (
              <div
                key={l.id || l.url || i}
                className={i === 0 ? "rounded-3xl bg-hero-gradient p-6 gold-hairline shadow-soft flex flex-col justify-between" : "rounded-3xl border border-gold/20 bg-card/60 p-6 shadow-xs backdrop-blur-md flex flex-col justify-between"}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-xs">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{l.label}</p>
                      <p className="text-xs text-muted-foreground">{l.note}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 p-1.5 pl-3.5">
                    <span className="flex-1 truncate font-mono text-xs text-muted-foreground" title={l.url}>{l.url}</span>
                    <button onClick={() => copyText(l.url, `URL de referência "${l.label}" copiada!`)} className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition">
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">Modelo de Demonstração</span>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                    Visualizar página <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. ARQUIVOS E GUIAS OFICIAIS DE APOIO */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">Arquivos e Manuais Oficiais</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Baixe fotos em alta definição, especificações técnicas, copys validadas e roteiros prontos para suas campanhas.</p>
          </div>
        </div>

        {/* Folder Navigation Chips */}
        {foldersList.length > 0 && materialsList.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setActiveFolderId("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeFolderId === "all" ? "bg-gold/15 border-gold/40 text-gold" : "border-border/60 text-muted-foreground hover:border-gold/30 hover:text-foreground"}`}
            >
              Todos ({materialsList.length})
            </button>
            <button
              onClick={() => setActiveFolderId("none")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeFolderId === "none" ? "bg-gold/15 border-gold/40 text-gold" : "border-border/60 text-muted-foreground hover:border-gold/30 hover:text-foreground"}`}
            >
              <Folder className="h-3 w-3" /> Geral ({materialsList.filter((m) => !m.folderId).length})
            </button>
            {foldersList.map((f) => {
              const colorCls = COLOR_MAP[f.color || "gold"] || COLOR_MAP.gold;
              const count = materialsList.filter((m) => m.folderId === f.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeFolderId === f.id ? colorCls : "border-border/60 text-muted-foreground hover:border-gold/30 hover:text-foreground"}`}
                >
                  <FolderOpen className="h-3 w-3" /> {f.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum material disponível"
            description="Manuais em PDF, fotos oficiais do produto e roteiros validados estarão disponíveis aqui assim que publicados pelo administrador."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gold/25 bg-card/60 backdrop-blur-md shadow-xs divide-y divide-border/40">
            {filteredMaterials.map((m, i) => {
              const isMultiFile = m.files && m.files.length > 1;
              const previewFiles = m.files ? m.files.filter((f) => f.thumbnailUrl) : [];
              const hasPreviews = previewFiles.length > 0;

              if (isMultiFile && m.files) {
                return (
                  <div key={m.id || m.title || i} className="p-5 sm:p-6 hover:bg-accent/15 transition space-y-4">
                    {/* Header do Pacote */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/15 border border-gold/30 text-gold shadow-xs">
                          <Package className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-foreground text-sm sm:text-base">{m.title}</p>
                            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/25">
                              PACOTE ({m.files.length} ARQUIVOS)
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Tamanho total: <strong className="text-foreground/90 font-medium">{m.size}</strong> · {m.files.length} arquivos disponíveis para download
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadAllFiles(m)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition self-start sm:self-auto shrink-0"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Baixar Todos ({m.files.length})</span>
                      </button>
                    </div>

                    {/* Previews em grade (se houver imagens com thumbnail) */}
                    {hasPreviews && (
                      <div className="flex flex-wrap gap-2">
                        {previewFiles.map((f, fIdx) => (
                          <div
                            key={f.id}
                            className="relative h-20 w-20 overflow-hidden rounded-xl border border-border/50 cursor-pointer group shadow-xs"
                            onClick={() => openLightbox(previewFiles, fIdx)}
                          >
                            <img src={f.thumbnailUrl!} alt={f.name} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        ))}
                        {previewFiles.length > 0 && (
                          <button
                            onClick={() => openLightbox(previewFiles, 0)}
                            className="h-20 w-20 flex flex-col items-center justify-center rounded-xl border border-gold/30 bg-gold/5 text-gold text-[10px] font-semibold gap-1 hover:bg-gold/10 transition"
                          >
                            <Eye className="h-4 w-4" />
                            Ver prévia
                          </button>
                        )}
                      </div>
                    )}

                    {/* Lista Interna dos Arquivos */}
                    <div className="rounded-2xl border border-border/50 bg-background/50 divide-y divide-border/30 overflow-hidden">
                      {m.files.map((fileItem, fIdx) => (
                        <div key={fileItem.id || fIdx} className="flex items-center justify-between gap-3 p-3 text-xs hover:bg-muted/30 transition">
                          <div className="flex items-center gap-3 min-w-0">
                            {fileItem.thumbnailUrl ? (
                              <div
                                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-border/60 cursor-pointer group"
                                onClick={() => openLightbox(previewFiles.length > 0 ? previewFiles : [fileItem], 0)}
                              >
                                <img src={fileItem.thumbnailUrl} alt={fileItem.name} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Eye className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            ) : (
                              <span className="grid h-7 w-9 place-items-center rounded-lg bg-gold/10 text-[10px] font-bold text-gold shrink-0 border border-gold/20">
                                {fileItem.kind}
                              </span>
                            )}
                            <span className="font-medium text-foreground truncate">{fileItem.name}</span>
                            <span className="text-[11px] text-muted-foreground shrink-0 font-mono">({fileItem.size})</span>
                          </div>
                          <button
                            onClick={() => handleDownloadFileItem(fileItem)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-gold hover:text-gold transition shrink-0 shadow-xs"
                          >
                            <Download className="h-3 w-3" />
                            <span>Baixar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // Arquivo único
              const singlePreviewFile = m.files?.[0];
              const hasThumb = singlePreviewFile?.thumbnailUrl;

              return (
                <div key={m.id || m.title || i} className="flex items-center gap-4 p-4 sm:p-5 hover:bg-accent/30 transition">
                  {/* Thumbnail ou badge */}
                  {hasThumb ? (
                    <div
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/60 cursor-pointer group shadow-xs"
                      onClick={() => openLightbox([singlePreviewFile!], 0)}
                    >
                      <img src={singlePreviewFile!.thumbnailUrl!} alt={m.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 border border-gold/30 text-xs font-bold text-gold">
                      {m.kind}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground text-sm">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Formato {m.kind} · {m.size}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasThumb && (
                      <button
                        onClick={() => openLightbox([singlePreviewFile!], 0)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-card px-3 py-2 text-xs font-semibold text-foreground hover:border-gold hover:text-gold transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Prévia</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadMaterial(m)}
                      className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-card px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:border-gold hover:text-gold transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Baixar Arquivo</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

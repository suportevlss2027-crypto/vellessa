import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowLeft,
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
  LayoutGrid,
  Link2,
  List,
  Package,
  Search,
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
  type MaterialFolder,
} from "@/lib/affiliate-store";
import { getRawFile } from "@/lib/file-storage";

export const Route = createFileRoute("/_app/materiais")({
  head: () => ({
    meta: [
      { title: "Links e Materiais — Vellessa Afiliados" },
      {
        name: "description",
        content:
          "Acesso à Logzz para links oficiais rastreados, páginas de demonstração, manuais e materiais de apoio Vellessa.",
      },
      { property: "og:title", content: "Links e Materiais — Vellessa Afiliados" },
      {
        property: "og:description",
        content:
          "Central de links oficiais Logzz, páginas de referência e materiais de apoio.",
      },
    ],
  }),
  component: Materiais,
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

// ── Página de Materiais de Afiliados ───────────────────────────────────────────
function Materiais() {
  const { copyText, downloadAsset, profile, linksList, materialsList, foldersList } =
    useAffiliateStore();

  // ── ESTADO DE NAVEGAÇÃO ESPACIAL (FINDER / GOOGLE DRIVE) ────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Lightbox
  const [lightboxFiles, setLightboxFiles] = useState<MaterialFileItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const openLightbox = (files: MaterialFileItem[], idx = 0) => {
    setLightboxFiles(files);
    setLightboxIndex(idx);
  };
  const closeLightbox = () => setLightboxFiles([]);

  useEffect(() => {
    document.body.style.overflow = lightboxFiles.length > 0 ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxFiles.length]);

  const COLOR_MAP: Record<string, string> = {
    gold: "text-gold bg-gold/15 border-gold/30 group-hover:border-gold/60",
    emerald: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 group-hover:border-emerald-500/60",
    rose: "text-rose-400 bg-rose-500/15 border-rose-500/30 group-hover:border-rose-500/60",
    violet: "text-violet-400 bg-violet-500/15 border-violet-500/30 group-hover:border-violet-500/60",
    sky: "text-sky-400 bg-sky-500/15 border-sky-500/30 group-hover:border-sky-500/60",
    amber: "text-amber-400 bg-amber-500/15 border-amber-500/30 group-hover:border-amber-500/60",
  };

  // Downloads
  const handleDownloadFileItem = async (f: MaterialFileItem) => {
    // 1. Se tiver URL pública na nuvem (Supabase Storage ou link direto), baixa direto da nuvem
    if (f.file_url && !f.file_url.startsWith("indexeddb://")) {
      downloadAsset(f.file_url, f.name);
      return;
    }
    // 2. Caso contrário, tenta resgatar do IndexedDB local
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
      toast.success(`Download de "${f.name}" iniciado!`);
      return;
    }
    toast.info("Arquivo não disponível para download.");
  };

  const handleDownloadAllFiles = async (m: DynamicMaterial) => {
    if (m.files && m.files.length > 0) {
      toast.info(`Iniciando download do pacote (${m.files.length} arquivos)...`);
      for (let i = 0; i < m.files.length; i++) {
        const f = m.files[i];
        setTimeout(() => {
          handleDownloadFileItem(f);
        }, i * 400);
      }
      return;
    }
    handleDownloadMaterial(m);
  };

  const handleDownloadMaterial = async (m: DynamicMaterial) => {
    const filename = m.rawFileName || `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${m.kind.toLowerCase()}`;
    // 1. Se tiver URL na nuvem (Supabase CDN ou link externo), baixa diretamente
    if (m.file_url && !m.file_url.startsWith("indexeddb://")) {
      downloadAsset(m.file_url, filename);
      return;
    }
    // 2. Se tiver arquivo local no IndexedDB da máquina que criou
    if (m.id) {
      const blob = await getRawFile(m.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        toast.success(`Download de "${filename}" iniciado!`);
        return;
      }
    }
    // 3. Fallback oficial formatado com os dados do afiliado
    const content = `=== VELLESSA AFILIADOS - ARQUIVO OFICIAL DE APOIO ===\n\nTítulo: ${m.title}\nTipo: ${m.kind}\nTamanho do Pacote: ${m.size}\nMembro/Afiliado: ${profile.name} (ID: ${profile.id})\nData de Emissão: ${new Date().toLocaleDateString("pt-BR")}\n\nEste documento contém diretrizes oficiais de divulgação.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    downloadAsset(url, `${m.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.txt`);
  };

  // ── FILTROS E CONTEXTO DE DIRETÓRIO ATUAL ──────────────────────────────────
  const currentFolder = foldersList.find((f) => f.id === currentFolderId);

  // Arquivos exibidos de acordo com a pasta selecionada ou busca ativa
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

  // Baixar todos os materiais da pasta de uma vez
  const handleDownloadEntireFolder = (folderMaterials: DynamicMaterial[]) => {
    if (folderMaterials.length === 0) return;
    toast.info(`Iniciando download de todos os ${folderMaterials.length} materiais da pasta...`);
    folderMaterials.forEach((mat, idx) => {
      setTimeout(() => {
        handleDownloadAllFiles(mat);
      }, idx * 600);
    });
  };

  // ── RENDERIZADOR DE CARD DE MATERIAL (ESTILO APPLE HIG) ───────────────────
  const renderMaterialCard = (m: DynamicMaterial) => {
    const isMultiFile = m.files && m.files.length > 1;
    const previewFiles = m.files ? m.files.filter((f) => f.thumbnailUrl) : [];
    const hasPreviews = previewFiles.length > 0;
    const singleThumb = hasPreviews ? previewFiles[0].thumbnailUrl : null;

    return (
      <div
        key={m.id || m.title}
        className="group relative rounded-2xl border border-border/70 bg-card/70 p-5 shadow-xs hover:border-gold/50 hover:shadow-gold transition-all duration-300 flex flex-col justify-between backdrop-blur-md"
      >
        <div>
          {/* Topo do Card: Miniatura Real ou Selo de Formato */}
          <div className="relative mb-3.5 aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted/40 border border-border/40 flex items-center justify-center">
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
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs"
                >
                  <Eye className="h-4 w-4" />
                  <span>Ver Fotos ({previewFiles.length})</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 text-gold">
                <span className="text-2xl font-bold tracking-wider">{m.kind}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-medium">
                  Documento Oficial
                </span>
              </div>
            )}

            {/* Selo no Canto Superior */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
              <span className="rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white border border-white/20 backdrop-blur-md">
                {m.kind}
              </span>
              {isMultiFile && (
                <span className="rounded-lg bg-gold/90 px-2 py-0.5 text-[10px] font-bold text-primary-foreground border border-gold/40 shadow-xs">
                  {m.files!.length} arquivos
                </span>
              )}
            </div>
          </div>

          {/* Título e Metadados */}
          <h4 className="font-bold text-sm sm:text-base text-foreground group-hover:text-gold transition line-clamp-1">
            {m.title}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Tamanho: <strong className="text-foreground/90">{m.size}</strong> ·{" "}
            {isMultiFile ? `Pacote com ${m.files!.length} itens` : `Formato ${m.kind}`}
          </p>

          {/* Vitrine de Miniaturas Rápidas para Pacotes de Fotos */}
          {hasPreviews && previewFiles.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {previewFiles.slice(0, 4).map((f, fIdx) => (
                <div
                  key={f.id}
                  onClick={() => openLightbox(previewFiles, fIdx)}
                  className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/50 cursor-pointer hover:border-gold transition"
                  title={f.name}
                >
                  <img src={f.thumbnailUrl!} alt={f.name} className="h-full w-full object-cover" />
                </div>
              ))}
              {previewFiles.length > 4 && (
                <button
                  type="button"
                  onClick={() => openLightbox(previewFiles, 0)}
                  className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-gold/15 border border-gold/30 text-gold text-[10px] font-bold"
                >
                  +{previewFiles.length - 4}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Rodapé com Botão Primário Padronizado */}
        <div className="mt-5 pt-3.5 border-t border-border/40 flex items-center gap-2">
          {hasPreviews && (
            <button
              type="button"
              onClick={() => openLightbox(previewFiles, 0)}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-gold/30 bg-card p-2 text-xs font-semibold text-gold hover:bg-gold/10 transition shadow-xs"
              title="Visualizar prévias em tela cheia"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownloadAllFiles(m)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2 px-3 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isMultiFile ? `Baixar Todos (${m.files!.length})` : "Baixar Arquivo"}</span>
          </button>
        </div>
      </div>
    );
  };

  // ── RENDERIZADOR DE LINHA (MODO LISTA COMPACTA) ───────────────────────────
  const renderMaterialRow = (m: DynamicMaterial) => {
    const isMultiFile = m.files && m.files.length > 1;
    const previewFiles = m.files ? m.files.filter((f) => f.thumbnailUrl) : [];

    return (
      <div
        key={m.id || m.title}
        className="flex items-center justify-between p-4 hover:bg-muted/30 transition rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-4">
          {previewFiles.length > 0 ? (
            <div
              className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted cursor-pointer group"
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
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold font-bold text-xs border border-gold/30">
              {m.kind}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{m.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {m.kind} · {m.size}{" "}
              {isMultiFile && `· Pacote com ${m.files!.length} arquivos inclusos`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {previewFiles.length > 0 && (
            <button
              type="button"
              onClick={() => openLightbox(previewFiles, 0)}
              className="p-2 text-muted-foreground hover:text-gold transition rounded-xl hover:bg-gold/10"
              title="Ver Fotos"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDownloadAllFiles(m)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient py-2 px-3.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isMultiFile ? `Baixar Todos (${m.files!.length})` : "Baixar Arquivo"}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden min-w-0">
      {/* Lightbox Modal */}
      {lightboxFiles.length > 0 && (
        <Lightbox files={lightboxFiles} startIndex={lightboxIndex} onClose={closeLightbox} />
      )}

      <PageHeader
        eyebrow="Central de Vendas & Ativos Oficiais"
        title="Links e Materiais de Apoio"
        description="Instruções para acessar seus links de vendas na Logzz, além de páginas oficiais de demonstração, manuais, fotos e copys validadas."
      />

      {/* 1. CARD PRINCIPAL OFICIAL: CONEXÃO COM A PLATAFORMA LOGZZ */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-card/90 to-card/70 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-soft w-full max-w-full">
        <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-0 h-48 w-48 rounded-full bg-gold/10 blur-2xl" />

        <div className="relative z-10 w-full min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5 w-full min-w-0">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="grid h-11 w-11 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-2xl bg-white shadow-md">
                <span className="font-display text-xs sm:text-sm font-black tracking-tighter text-emerald-800">
                  LQZZ
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-300 max-w-full">
                  <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Plataforma Oficial de Checkout & Comissões</span>
                </div>
                <h2 className="mt-1 font-display text-lg sm:text-2xl font-bold tracking-tight text-foreground break-words">
                  Onde está o seu link de vendas comissionado?
                </h2>
              </div>
            </div>
            <a
              href="https://app.logzz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] w-full sm:w-auto text-center shrink-0"
            >
              <span className="truncate">Acessar Painel Logzz & Pegar Meus Links</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed font-medium">
                A Vellessa opera no modelo{" "}
                <strong className="text-emerald-300">Cash on Delivery (Pagamento na Entrega)</strong> em
                parceria com a <strong className="text-foreground">Logzz</strong>. É dentro do seu
                painel da Logzz que seu link com pixel de afiliado é gerado, as vendas caem em tempo real
                e você recebe suas comissões de <strong className="text-gold">até 60%</strong> direto no
                Pix.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Esta plataforma Vellessa é a sua <strong>área de membros e suporte</strong> (aulas,
                  criativos e materiais).
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 space-y-2.5 backdrop-blur-md">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Como pegar seu link em 3 passos:
              </p>
              <div className="space-y-2 text-xs text-foreground/80">
                {[
                  "Entre na sua conta da Logzz (app.logzz.com.br).",
                  "Acesse Meus Produtos / Vitrine e selecione a Vellessa.",
                  "Copie o link com seu pixel do kit escolhido (ex: Kit 3 Campeão) e anuncie!",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                      {i + 1}
                    </span>
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
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Páginas Oficiais de Demonstração
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Utilize estas páginas como referência para estudar os argumentos, ofertas e estrutura
              dos funis da Vellessa.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold self-start sm:self-auto">
            <Sparkles className="h-3 w-3" />
            <span>Páginas de Referência e Estudo</span>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-xs text-foreground/85">
          <AlertCircle className="h-4 w-4 text-gold shrink-0" />
          <span>
            <strong>Atenção:</strong> Estes links abaixo são modelos públicos oficiais para você
            navegar e analisar. Para anunciar e receber comissão de 60%,{" "}
            <strong>você deve usar o link com seu código gerado dentro da Logzz</strong>.
          </span>
        </div>

        {linksList.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="Nenhuma página cadastrada"
            description="As páginas oficiais de referência e demonstração serão cadastradas pelo administrador."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {linksList.map((l, i) => (
              <div
                key={l.id || l.url || i}
                className={
                  i === 0
                    ? "rounded-3xl bg-hero-gradient p-4 sm:p-6 gold-hairline shadow-soft flex flex-col justify-between w-full min-w-0"
                    : "rounded-3xl border border-gold/20 bg-card/60 p-4 sm:p-6 shadow-xs backdrop-blur-md flex flex-col justify-between w-full min-w-0"
                }
              >
                <div className="w-full min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-gradient text-primary-foreground shadow-xs">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-sm truncate">{l.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{l.note}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 p-1.5 pl-3 w-full min-w-0 overflow-hidden">
                    <span
                      className="flex-1 min-w-0 truncate font-mono text-xs text-muted-foreground"
                      title={l.url}
                    >
                      {l.url}
                    </span>
                    <button
                      onClick={() => copyText(l.url, `URL de referência "${l.label}" copiada!`)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gold-gradient px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:brightness-105 transition shrink-0"
                    >
                      <Copy className="h-3 w-3" /> Copiar
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    Modelo de Demonstração
                  </span>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline shrink-0"
                  >
                    Visualizar página <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. COFRE DE ARQUIVOS E GUIAS OFICIAIS (VELLESSA VAULT COM BREADCRUMB) */}
      <section className="space-y-5 pt-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Arquivos e Manuais Oficiais
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Baixe fotos em alta definição, especificações técnicas, copys validadas e roteiros prontos
              para suas campanhas.
            </p>
          </div>
        </div>

        {/* Barra de Busca e Alternância de Visualização */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/60 p-3 rounded-2xl border border-border/50 backdrop-blur-md">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gold/10 border border-gold/30 p-3 sm:p-4 rounded-2xl backdrop-blur-md animate-in fade-in w-full min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-gold/30 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/15 transition shadow-xs shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <ChevronRight className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center gap-1.5 truncate">
                  <FolderOpen className="h-4 w-4 text-gold shrink-0" /> {currentFolder.name}
                </span>
                <span className="text-[11px] font-mono text-gold shrink-0">
                  ({displayedMaterials.length})
                </span>
              </div>
            </div>

            {displayedMaterials.length > 0 && (
              <button
                type="button"
                onClick={() => handleDownloadEntireFolder(displayedMaterials)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold-gradient px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition w-full sm:w-auto shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Pasta Completa</span>
              </button>
            )}
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {displayedMaterials.map((m) => renderMaterialCard(m))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedMaterials.map((m) => renderMaterialRow(m))}
              </div>
            )}
          </div>
        ) : currentFolder ? (
          /* MODO DENTRO DA PASTA */
          <div>
            {displayedMaterials.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-14 text-center bg-card/30">
                <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-semibold text-foreground">Esta pasta está vazia no momento</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O administrador ainda não incluiu arquivos dentro desta pasta temática.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in">
                {displayedMaterials.map((m) => renderMaterialCard(m))}
              </div>
            ) : (
              <div className="space-y-2.5 animate-in fade-in">
                {displayedMaterials.map((m) => renderMaterialRow(m))}
              </div>
            )}
          </div>
        ) : (
          /* MODO RAIZ: PASTAS EM CARDS TÁTEIS + ARQUIVOS GERAIS */
          <div className="space-y-8 animate-in fade-in">
            {/* 1. SEÇÃO DE PASTAS TEMÁTICAS EM CARDS TÁTEIS */}
            {foldersList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pastas Temáticas ({foldersList.length})
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Clique na pasta para explorar o conteúdo
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
                        className="group relative cursor-pointer rounded-2xl border border-gold/30 bg-card/80 p-5 shadow-xs hover:border-gold hover:shadow-gold transition-all duration-300 flex flex-col justify-between backdrop-blur-md"
                      >
                        <div>
                          {/* Topo do Card da Pasta */}
                          <div className="flex items-start justify-between gap-2">
                            <div
                              className={`grid h-12 w-12 place-items-center rounded-2xl border ${colorCls} transition-transform duration-300 group-hover:scale-105 shadow-xs`}
                            >
                              <Folder className="h-6 w-6" />
                            </div>
                            <span className="rounded-full bg-gold/10 border border-gold/25 px-2.5 py-0.5 text-[11px] font-bold text-gold">
                              {folderItems.length} {folderItems.length === 1 ? "item" : "itens"}
                            </span>
                          </div>

                          {/* Nome e Descrição */}
                          <h4 className="mt-3.5 font-bold text-base text-foreground group-hover:text-gold transition line-clamp-1">
                            {folder.name}
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {folder.description || "Pasta com ativos e arquivos oficiais para suas campanhas."}
                          </p>
                        </div>

                        {/* Rodapé com Ação Clara */}
                        <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Acessar pasta
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

            {/* 2. SEÇÃO DE ARQUIVOS GERAIS (FORA DE PASTAS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gold" />
                  <span>Arquivos Gerais ({displayedMaterials.length})</span>
                </span>
                {foldersList.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Materiais de apoio e manuais rápidos
                  </span>
                )}
              </div>

              {displayedMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-10 text-center bg-card/20">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum arquivo avulso no momento.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedMaterials.map((m) => renderMaterialCard(m))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayedMaterials.map((m) => renderMaterialRow(m))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

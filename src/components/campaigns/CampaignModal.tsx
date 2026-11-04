import React, { useState, useMemo } from "react";
import {
  X,
  Target,
  Image as ImageIcon,
  Sparkles,
  Link2,
  Copy,
  Check,
  DollarSign,
  Layers,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import { useAffiliateStore, type Campaign } from "@/lib/affiliate-store";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { toast } from "sonner";

interface CampaignModalProps {
  campaign?: Campaign | null;
  onClose: () => void;
}

const DEFAULT_KITS = [
  { name: "Kit 1 Frasco (Iniciante)", commission: 80 },
  { name: "Kit 3 Frascos (Campeão de Vendas)", commission: 140 },
  { name: "Kit 5 Frascos (Máxima Conversão)", commission: 220 },
  { name: "Oferta Personalizada", commission: 140 },
];

export function CampaignModal({ campaign, onClose }: CampaignModalProps) {
  const { creativesList, createCampaign, updateCampaign, copyText, profile } =
    useAffiliateStore();

  const isEditing = Boolean(campaign);

  // Form states
  const [name, setName] = useState(campaign?.name || "");
  const [platform, setPlatform] = useState<Campaign["platform"]>(
    campaign?.platform || "meta"
  );
  const [status, setStatus] = useState<Campaign["status"]>(
    campaign?.status || "testing"
  );
  const [selectedKit, setSelectedKit] = useState<string>(
    campaign?.kitName || DEFAULT_KITS[1].name
  );
  const [commissionPerSale, setCommissionPerSale] = useState<number>(
    campaign?.commissionPerSale || 140
  );
  const [targetAudience, setTargetAudience] = useState(
    campaign?.targetAudience || ""
  );
  const [dailyBudget, setDailyBudget] = useState<number>(
    campaign?.dailyBudget || 50
  );
  const [destinationUrl, setDestinationUrl] = useState(
    campaign?.destinationUrl || "https://checkout.logzz.com.br/vellessa-serum"
  );
  const [notes, setNotes] = useState(campaign?.notes || "");

  // Métricas existentes (se edição ou lançamento inicial)
  const [totalAdSpend, setTotalAdSpend] = useState<number>(
    campaign?.totalAdSpend || 0
  );
  const [salesCount, setSalesCount] = useState<number>(
    campaign?.salesCount || 0
  );
  const [extraCosts, setExtraCosts] = useState<number>(
    campaign?.extraCosts || 0
  );

  // Criativo vinculado
  const [creativeSource, setCreativeSource] = useState<"official" | "custom">(
    campaign?.creativeSource || "official"
  );
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>(
    campaign?.officialCreativeId || ""
  );
  const [customTitle, setCustomTitle] = useState(
    campaign?.customCreative?.title || ""
  );
  const [customFormat, setCustomFormat] = useState<
    "Feed" | "Stories" | "Reels" | "Copy"
  >(campaign?.customCreative?.format || "Feed");
  const [customMedia, setCustomMedia] = useState(
    campaign?.customCreative?.imageOrVideoUrl || ""
  );

  const [copied, setCopied] = useState(false);

  // Criativo selecionado oficial
  const activeOfficialCreative = useMemo(() => {
    return creativesList.find((c) => c.id === selectedOfficialId);
  }, [creativesList, selectedOfficialId]);

  // Se trocar o kit pré-definido, ajusta comissão padrão
  const handleKitChange = (kitName: string) => {
    setSelectedKit(kitName);
    const found = DEFAULT_KITS.find((k) => k.name === kitName);
    if (found && kitName !== "Oferta Personalizada") {
      setCommissionPerSale(found.commission);
    }
  };

  // Gerador de UTM automático
  const generatedUtmLink = useMemo(() => {
    const base = destinationUrl.trim() || "https://checkout.logzz.com.br/vellessa-serum";
    const cleanCamp = (name || "campanha").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const creativeName =
      creativeSource === "official"
        ? (activeOfficialCreative?.title || "criativo-oficial")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-")
        : (customTitle || "criativo-proprio")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
    const audience = (targetAudience || "aberto").toLowerCase().replace(/[^a-z0-9]/g, "-");
    const affiliateId = profile.id ? `&src=${profile.id}` : "";

    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}utm_source=${platform}&utm_medium=paid&utm_campaign=${cleanCamp}&utm_content=${creativeName}&utm_term=${audience}${affiliateId}`;
  }, [
    destinationUrl,
    name,
    platform,
    creativeSource,
    activeOfficialCreative,
    customTitle,
    targetAudience,
    profile.id,
  ]);

  const handleCopyLink = () => {
    copyText(generatedUtmLink, "Link com UTM copiado para sua área de transferência!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da campanha.");
      return;
    }

    if (creativeSource === "official" && !selectedOfficialId && creativesList.length > 0) {
      toast.error("Selecione um criativo oficial da lista ou opte por 'Meu Criativo Próprio'.");
      return;
    }

    const payload = {
      name: name.trim(),
      platform,
      status,
      kitName: selectedKit,
      commissionPerSale,
      targetAudience: targetAudience.trim(),
      creativeSource,
      officialCreativeId: creativeSource === "official" ? selectedOfficialId : undefined,
      officialCreativeTitle:
        creativeSource === "official" ? activeOfficialCreative?.title : undefined,
      officialCreativeImage:
        creativeSource === "official" ? activeOfficialCreative?.image : undefined,
      customCreative:
        creativeSource === "custom"
          ? {
              title: customTitle.trim() || "Criativo Autoral",
              format: customFormat,
              imageOrVideoUrl: customMedia,
            }
          : undefined,
      dailyBudget,
      totalAdSpend,
      salesCount,
      totalCommission: salesCount * commissionPerSale,
      extraCosts,
      startDate: campaign?.startDate || new Date().toISOString(),
      notes: notes.trim(),
      utmLink: generatedUtmLink,
      destinationUrl: destinationUrl.trim(),
    };

    if (isEditing && campaign) {
      updateCampaign(campaign.id, payload);
    } else {
      createCampaign(payload);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-card p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 space-y-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-gradient text-primary-foreground shadow-gold shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {isEditing ? "Editar Campanha de Anúncios" : "Nova Campanha de Tráfego Pago"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vincule criativos, defina sua oferta e gere links rastreados para o Meta Ads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Identificação & Plataforma */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: [CBO] Rugas & Melasma 40+ (Aberto)"
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-gold transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Plataforma
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold transition"
                >
                  <option value="meta">Meta Ads (Facebook & IG)</option>
                  <option value="google">Google Ads / YouTube</option>
                  <option value="tiktok">TikTok Ads</option>
                  <option value="outro">Outra Rede (Taboola/Native)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Status Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-foreground outline-none focus:border-gold transition"
                >
                  <option value="testing">🟡 Em Teste (Validação)</option>
                  <option value="active">🟢 Ativa (Rodando)</option>
                  <option value="scaling">🔵 Em Escala</option>
                  <option value="paused">⚪ Pausada</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Orçamento Diário (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-gold transition font-bold text-gold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Público / Ângulo (Opcional)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex: Mulheres 35-55 anos"
                  className="w-full rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-gold transition"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Oferta & Comissão Logzz */}
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Oferta & Comissão Logzz
            </span>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Kit Ofertado
                </label>
                <select
                  value={selectedKit}
                  onChange={(e) => handleKitChange(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-foreground outline-none focus:border-gold transition"
                >
                  {DEFAULT_KITS.map((k) => (
                    <option key={k.name} value={k.name}>
                      {k.name} (R$ {k.commission},00)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Comissão por Venda (R$)
                </label>
                <input
                  type="number"
                  min="1"
                  value={commissionPerSale}
                  onChange={(e) => setCommissionPerSale(Number(e.target.value))}
                  className="w-full rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-gold font-bold outline-none focus:border-gold transition"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Vinculação de Criativo (Oficial vs Próprio) */}
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Criativo Vinculado
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Escolha se vai rodar com uma peça oficial da Vellessa ou com um criativo que você mesmo produziu.
                </p>
              </div>
              <div className="flex rounded-full border border-border/60 bg-card p-0.5 text-xs font-semibold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCreativeSource("official")}
                  className={`rounded-full px-3 py-1 transition ${
                    creativeSource === "official"
                      ? "bg-gold text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Oficial Vellessa
                </button>
                <button
                  type="button"
                  onClick={() => setCreativeSource("custom")}
                  className={`rounded-full px-3 py-1 transition ${
                    creativeSource === "custom"
                      ? "bg-gold text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Criativo Próprio
                </button>
              </div>
            </div>

            {creativeSource === "official" ? (
              <div className="space-y-3">
                {creativesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 italic text-center">
                    Nenhum criativo oficial cadastrado pelo administrador no sistema ainda. Alterne para "Criativo Próprio" para subir o seu.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                    {creativesList.map((c) => {
                      const isSelected = selectedOfficialId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedOfficialId(c.id)}
                          className={`flex items-center gap-2.5 rounded-xl p-2.5 text-left border transition ${
                            isSelected
                              ? "border-gold bg-gold/15 shadow-xs"
                              : "border-border/40 bg-card hover:border-gold/40"
                          }`}
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted/60 shrink-0 border border-white/10">
                            {c.image ? (
                              <img
                                src={c.image}
                                alt={c.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center text-gold text-xs font-bold">
                                {c.type}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {c.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {c.type} · {c.format}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-gold shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Título do Criativo Próprio
                    </label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Ex: Depoimento Dra. Camila no Reels"
                      className="w-full rounded-xl border border-border/60 bg-card px-3.5 py-2 text-xs text-foreground outline-none focus:border-gold transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Formato
                    </label>
                    <select
                      value={customFormat}
                      onChange={(e) => setCustomFormat(e.target.value as any)}
                      className="w-full rounded-xl border border-border/60 bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-gold transition"
                    >
                      <option value="Feed">Feed (1:1)</option>
                      <option value="Stories">Stories (9:16)</option>
                      <option value="Reels">Reels / TikTok (9:16)</option>
                      <option value="Copy">Texto / Copy</option>
                    </select>
                  </div>
                </div>

                <MediaUploadField
                  label="Mídia do seu Anúncio (Imagem ou Capa de Vídeo)"
                  description="Faça upload do arquivo do seu computador ou informe a URL direta."
                  value={customMedia}
                  onChange={setCustomMedia}
                  aspectRatio="video"
                />
              </div>
            )}
          </div>

          {/* Seção 4: Gerador de Links com UTMs Integrado */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> Link Rastreado com UTM (Logzz Ready)
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-3 py-1 text-xs transition shadow-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiado!" : "Copiar Link Rastreado"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono break-all bg-card/60 rounded-xl p-2.5 border border-white/5 select-all">
              {generatedUtmLink}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Cole esta URL exata no campo "URL de Destino" do seu anúncio no Meta Ads para registrar a origem das vendas.
            </p>
          </div>

          {/* Seção 5: Métricas Iniciais / Histórico (Se estiver editando ou migrando) */}
          {isEditing && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
              <span className="text-xs font-semibold text-foreground">
                Ajuste de Métricas Totais
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Total Gasto (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={totalAdSpend}
                    onChange={(e) => setTotalAdSpend(Number(e.target.value))}
                    className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Vendas Confirmadas</label>
                  <input
                    type="number"
                    min="0"
                    value={salesCount}
                    onChange={(e) => setSalesCount(Number(e.target.value))}
                    className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold text-emerald-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Custos Extras (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraCosts}
                    onChange={(e) => setExtraCosts(Number(e.target.value))}
                    className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold text-muted-foreground outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gold-gradient px-6 py-2 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              {isEditing ? "Salvar Alterações" : "Criar Campanha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Layers,
  Palette,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import {
  useAffiliateStore,
  type BillboardItem,
  type BillboardSettings,
  type BillboardTheme,
  BILLBOARD_THEMES,
  BILLBOARD_PRESETS,
  DEFAULT_BILLBOARD_SETTINGS,
} from "@/lib/affiliate-store";

interface BillboardModalProps {
  open: boolean;
  onClose: () => void;
}

const INTERVAL_OPTIONS = [
  { seconds: 3, label: "3 seg", description: "Rápido" },
  { seconds: 5, label: "5 seg", description: "Recomendado" },
  { seconds: 8, label: "8 seg", description: "Equilibrado" },
  { seconds: 10, label: "10 seg", description: "Leitura Calma" },
  { seconds: 15, label: "15 seg", description: "Estendido" },
];

export function BillboardModal({ open, onClose }: BillboardModalProps) {
  const { billboardSettings, updateBillboardSettings, resetBillboardSettings } =
    useAffiliateStore();

  const [form, setForm] = useState<BillboardSettings>(billboardSettings);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [previewSlide, setPreviewSlide] = useState(0);
  const [previewPaused, setPreviewPaused] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(billboardSettings);
      setActiveItemIndex(0);
      setPreviewSlide(0);
    }
  }, [open, billboardSettings]);

  // Rotação da prévia ao vivo
  useEffect(() => {
    const activePreviewItems = form.items.filter((it) => it.enabled);
    if (!form.enabled || activePreviewItems.length <= 1 || previewPaused) return;

    const timer = setInterval(() => {
      setPreviewSlide((prev) => (prev + 1) % activePreviewItems.length);
    }, (form.intervalSeconds || 5) * 1000);

    return () => clearInterval(timer);
  }, [form.enabled, form.intervalSeconds, form.items, previewPaused]);

  if (!open) return null;

  const currentItem: BillboardItem =
    form.items[activeItemIndex] ||
    form.items[0] ||
    DEFAULT_BILLBOARD_SETTINGS.items[0];

  const currentTheme =
    BILLBOARD_THEMES[currentItem.theme] || BILLBOARD_THEMES.emerald;

  const activeCount = form.items.filter((it) => it.enabled).length;

  const handleSave = () => {
    updateBillboardSettings(form);
    onClose();
  };

  const handleReset = () => {
    resetBillboardSettings();
    onClose();
  };

  const handleAddItem = () => {
    const newItem: BillboardItem = {
      id: `item-${Date.now()}`,
      badgeText: "NOVO",
      title: `Novo Comunicado Oficial ${form.items.length + 1}`,
      subtitle: "Insira orientações, metas de vendas ou novidades para a equipe",
      buttonText: "Acessar",
      buttonUrl: "/materiais",
      theme: "gold",
      showPulse: true,
      enabled: true,
    };
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setActiveItemIndex(form.items.length);
  };

  const handleDuplicateItem = (idx: number) => {
    const target = form.items[idx];
    if (!target) return;
    const duplicated: BillboardItem = {
      ...target,
      id: `item-${Date.now()}`,
      title: `${target.title} (Cópia)`,
    };
    const nextItems = [...form.items];
    nextItems.splice(idx + 1, 0, duplicated);
    setForm((prev) => ({ ...prev, items: nextItems }));
    setActiveItemIndex(idx + 1);
  };

  const handleRemoveItem = (idx: number) => {
    if (form.items.length <= 1) return;
    const nextItems = form.items.filter((_, i) => i !== idx);
    setForm((prev) => ({ ...prev, items: nextItems }));
    setActiveItemIndex(Math.max(0, idx - 1));
  };

  const updateCurrentItem = (patch: Partial<BillboardItem>) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      if (nextItems[activeItemIndex]) {
        nextItems[activeItemIndex] = { ...nextItems[activeItemIndex], ...patch };
      }
      return { ...prev, items: nextItems };
    });
  };

  // Itens para a prévia
  const activePreviewItems = form.items.filter((it) => it.enabled);
  const previewItem =
    activePreviewItems[previewSlide] || activePreviewItems[0] || currentItem;
  const previewTheme =
    BILLBOARD_THEMES[previewItem.theme] || BILLBOARD_THEMES.emerald;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-3xl border border-white/10 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header do Modal */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-6 py-4.5 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/15 text-gold border border-gold/30 shadow-gold">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Outdoor Oficial do Painel
                </h2>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                  Carrossel Dinâmico
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    form.enabled && activeCount > 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-white/10"
                  }`}
                >
                  {form.enabled
                    ? `${activeCount} de ${form.items.length} ativo(s)`
                    : "Carrossel Oculto"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exiba um ou vários avisos em carrossel rotativo na home de todos os membros.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain custom-scrollbar">
          {/* Seção A: Configurações Globais do Carrossel (Liga/Desliga e Duração) */}
          <div className="rounded-2xl border border-white/10 bg-surface/40 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-gold" /> Status Geral do Carrossel
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Liga ou desliga a exibição de todos os outdoors no painel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.enabled ? "bg-emerald-500" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    form.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Tempo de Duração de cada Outdoor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gold" /> Tempo de Exibição por Outdoor
                </span>
                <span className="text-[11px] font-mono text-gold font-bold">
                  {form.intervalSeconds || 5} segundos por slide
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INTERVAL_OPTIONS.map((opt) => {
                  const isSelected = form.intervalSeconds === opt.seconds;
                  return (
                    <button
                      key={opt.seconds}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, intervalSeconds: opt.seconds }))
                      }
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? "border-gold bg-gold/15 text-gold font-bold shadow-xs"
                          : "border-white/10 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[9px] opacity-75">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seção B: Prévia ao Vivo em Carrossel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gold" /> Prévia ao vivo para o afiliado
              </span>
              {activePreviewItems.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    Passar mouse pausa a rotação
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide(
                          (prev) =>
                            (prev - 1 + activePreviewItems.length) %
                            activePreviewItems.length
                        )
                      }
                      className="grid h-6 w-6 place-items-center rounded-lg border border-white/10 bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[10px] font-mono text-gold px-1.5">
                      {previewSlide + 1}/{activePreviewItems.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewSlide(
                          (prev) => (prev + 1) % activePreviewItems.length
                        )
                      }
                      className="grid h-6 w-6 place-items-center rounded-lg border border-white/10 bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              className="rounded-2xl border border-white/10 bg-background/50 p-4"
              onMouseEnter={() => setPreviewPaused(true)}
              onMouseLeave={() => setPreviewPaused(false)}
            >
              {form.enabled && activePreviewItems.length > 0 ? (
                <div
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 backdrop-blur-md shadow-lg transition-all duration-300 ${previewTheme.border} ${previewTheme.bg}`}
                  style={{ boxShadow: `0 8px 24px -6px ${previewTheme.glow}` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl shadow-xs font-display text-[9px] font-black tracking-tight ${previewTheme.badgeBg} ${previewTheme.badgeText}`}
                    >
                      {previewItem.badgeText || "AVISO"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white tracking-tight truncate">
                          {previewItem.title || "Título do Outdoor"}
                        </p>
                        {previewItem.showPulse && (
                          <span className="relative flex h-2 w-2 shrink-0 ml-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${previewTheme.pulseColor}`}
                            />
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${previewTheme.pulseColor}`}
                            />
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-[11px] font-medium truncate ${previewTheme.text}`}
                      >
                        {previewItem.subtitle ||
                          "Subtítulo ou instrução de apoio..."}
                      </p>
                    </div>
                  </div>
                  {previewItem.buttonUrl && (
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shrink-0 self-start sm:self-auto ${previewTheme.buttonBg} ${previewTheme.buttonBorder} ${previewTheme.buttonText}`}
                    >
                      <span>{previewItem.buttonText || "Acessar"}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {/* Indicadores sutis de carrossel */}
                  {activePreviewItems.length > 1 && (
                    <div className="absolute right-3 top-2 flex items-center gap-1">
                      {activePreviewItems.map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            dotIdx === previewSlide
                              ? "w-4 bg-gold"
                              : "w-1.5 bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-xl">
                  {form.enabled
                    ? "Nenhum outdoor ativo no momento. Ative pelo menos um outdoor abaixo."
                    : "O carrossel de outdoors está desativado no painel."}
                </div>
              )}
            </div>
          </div>

          {/* Seção C: Gestão da Quantidade de Outdoors (Abas e Adicionar/Remover) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-gold" /> Outdoors Cadastrados ({form.items.length})
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Selecione uma aba para editar ou adicione novos outdoors ao carrossel.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/25 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Novo Outdoor
              </button>
            </div>

            {/* Lista Horizontal de Abas */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {form.items.map((item, idx) => {
                const isSelected = idx === activeItemIndex;
                const itemTheme =
                  BILLBOARD_THEMES[item.theme] || BILLBOARD_THEMES.emerald;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => setActiveItemIndex(idx)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 transition cursor-pointer ${
                      isSelected
                        ? "border-gold bg-gold/20 text-gold shadow-xs"
                        : "border-white/10 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        item.enabled ? itemTheme.pulseColor : "bg-muted-foreground/40"
                      }`}
                    />
                    <span className="font-mono text-[10px] opacity-80">
                      #{idx + 1}
                    </span>
                    <span className="max-w-[130px] truncate">
                      {item.title || "Sem título"}
                    </span>
                    {!item.enabled && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-normal">
                        Oculto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Barra de Ações Rápidas do Outdoor Selecionado */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-muted/15 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Editando Outdoor #{activeItemIndex + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentItem({ enabled: !currentItem.enabled })
                  }
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${
                    currentItem.enabled
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-white/10"
                  }`}
                >
                  {currentItem.enabled ? "Ativo no Carrossel" : "Pausado (Oculto)"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateItem(activeItemIndex)}
                  title="Duplicar este outdoor"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40 transition cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Duplicar
                </button>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(activeItemIndex)}
                    title="Remover este outdoor"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Excluir
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Seção D: Modelos Prontos (Presets de 1 Clique para o Outdoor Atual) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Modelos Prontos (Aplicar neste Outdoor)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Clique para preencher os dados instantaneamente
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BILLBOARD_PRESETS.map((preset) => {
                const isActive =
                  currentItem.title === preset.item.title &&
                  currentItem.theme === preset.item.theme;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updateCurrentItem(preset.item)}
                    className={`flex flex-col items-start p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                      isActive
                        ? "border-gold/60 bg-gold/15 shadow-gold/20"
                        : "border-white/10 bg-muted/20 hover:bg-muted/40 hover:border-white/20"
                    }`}
                  >
                    <span className="font-mono text-[9px] font-bold text-gold px-1.5 py-0.5 rounded-md bg-gold/10 border border-gold/20">
                      {preset.tag}
                    </span>
                    <p className="mt-1.5 text-xs font-semibold text-foreground truncate w-full">
                      {preset.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção E: Seletor de Tema / Paleta de Cores do Outdoor Selecionado */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-gold" /> Cor e Tema Visual do Outdoor #{activeItemIndex + 1}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(BILLBOARD_THEMES) as BillboardTheme[]).map((themeKey) => {
                const t = BILLBOARD_THEMES[themeKey];
                const isSelected = currentItem.theme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => updateCurrentItem({ theme: themeKey })}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-xs font-medium transition text-center cursor-pointer ${
                      isSelected
                        ? "border-gold bg-gold/15 text-gold shadow-xs"
                        : "border-white/10 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3 w-3 rounded-full ${t.pulseColor}`} />
                      <span className="font-bold text-[11px] truncate">
                        {t.name.split(" ")[0]}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] text-gold font-semibold">
                        Ativo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção F: Ponto Pulsante Ao Vivo */}
          <div className="rounded-2xl border border-white/10 bg-muted/15 p-3.5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Indicador Luminoso Ao Vivo (Ponto Pulsante)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Efeito de radar luminoso para atrair atenção imediata
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateCurrentItem({ showPulse: !currentItem.showPulse })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                currentItem.showPulse ? "bg-gold" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  currentItem.showPulse ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Seção G: Textos, Títulos e Links */}
          <div className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Tag / Badge Curto
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={currentItem.badgeText}
                  onChange={(e) =>
                    updateCurrentItem({
                      badgeText: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Ex: LQZZ, AVISO"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Título Principal
                </label>
                <input
                  type="text"
                  value={currentItem.title}
                  onChange={(e) => updateCurrentItem({ title: e.target.value })}
                  placeholder="Ex: Parceria Oficial Logzz COD"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Subtítulo / Descrição Rápida
              </label>
              <input
                type="text"
                value={currentItem.subtitle}
                onChange={(e) =>
                  updateCurrentItem({ subtitle: e.target.value })
                }
                placeholder="Ex: Até 60% de comissão via Pix no checkout oficial"
                className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Texto do Botão (CTA)
                </label>
                <input
                  type="text"
                  value={currentItem.buttonText}
                  onChange={(e) =>
                    updateCurrentItem({ buttonText: e.target.value })
                  }
                  placeholder="Ex: Acessar Logzz"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Link de Destino (URL)
                </label>
                <input
                  type="text"
                  value={currentItem.buttonUrl}
                  onChange={(e) =>
                    updateCurrentItem({ buttonUrl: e.target.value })
                  }
                  placeholder="https://app.logzz.com.br ou /aulas"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer de Ações */}
        <div className="shrink-0 flex items-center justify-between border-t border-white/10 px-6 py-4 bg-card/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar Padrões Originais
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
            >
              <Check className="h-4 w-4" /> Salvar e Publicar Carrossel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

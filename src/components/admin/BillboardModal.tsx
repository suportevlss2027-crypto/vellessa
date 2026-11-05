import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  Eye,
  Palette,
  Radio,
  RotateCcw,
  Sparkles,
  Tv,
  X,
} from "lucide-react";
import {
  useAffiliateStore,
  type BillboardSettings,
  type BillboardTheme,
  BILLBOARD_THEMES,
} from "@/lib/affiliate-store";

interface BillboardModalProps {
  open: boolean;
  onClose: () => void;
}

export function BillboardModal({ open, onClose }: BillboardModalProps) {
  const { billboardSettings, updateBillboardSettings, resetBillboardSettings } =
    useAffiliateStore();

  const [form, setForm] = useState<BillboardSettings>(billboardSettings);

  useEffect(() => {
    if (open) {
      setForm(billboardSettings);
    }
  }, [open, billboardSettings]);

  if (!open) return null;

  const currentTheme = BILLBOARD_THEMES[form.theme] || BILLBOARD_THEMES.emerald;

  const handleSave = () => {
    updateBillboardSettings(form);
    onClose();
  };

  const handleReset = () => {
    resetBillboardSettings();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-white/10 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
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
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {form.enabled ? "Ativo no Painel" : "Oculto"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure o banner de destaque exibido na home de todos os afiliados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 2. Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain custom-scrollbar">
          {/* Live Preview em Tempo Real */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-gold" /> Prévia ao vivo para o afiliado
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tema: <strong className="text-foreground">{currentTheme.name}</strong>
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              {form.enabled ? (
                <div
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 backdrop-blur-md shadow-lg transition-all duration-300 ${currentTheme.border} ${currentTheme.bg}`}
                  style={{ boxShadow: `0 8px 24px -6px ${currentTheme.glow}` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl shadow-xs font-display text-[9px] font-black tracking-tight ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
                    >
                      {form.badgeText || "AVISO"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-white tracking-tight truncate">
                          {form.title || "Título do Outdoor"}
                        </p>
                        {form.showPulse && (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentTheme.pulseColor}`}
                            />
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${currentTheme.pulseColor}`}
                            />
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-medium truncate ${currentTheme.text}`}>
                        {form.subtitle || "Subtítulo ou instrução de apoio..."}
                      </p>
                    </div>
                  </div>
                  {form.buttonUrl && (
                    <span
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition shrink-0 self-start sm:self-auto ${currentTheme.buttonBg} ${currentTheme.buttonBorder} ${currentTheme.buttonText}`}
                    >
                      <span>{form.buttonText || "Acessar"}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  O Outdoor está atualmente desativado. Ele não aparecerá no painel dos afiliados.
                </div>
              )}
            </div>
          </div>

          {/* Seletor de Tema / Paleta de Cores */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-gold" /> Escolha o Tema Visual do Outdoor
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(BILLBOARD_THEMES) as BillboardTheme[]).map((themeKey) => {
                const t = BILLBOARD_THEMES[themeKey];
                const isSelected = form.theme === themeKey;
                return (
                  <button
                    key={themeKey}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, theme: themeKey }))}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border text-xs font-medium transition text-center ${
                      isSelected
                        ? "border-gold bg-gold/15 text-gold shadow-xs"
                        : "border-white/10 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-3 w-3 rounded-full ${t.pulseColor}`} />
                      <span className="font-bold text-[11px] truncate">{t.name.split(" ")[0]}</span>
                    </div>
                    {isSelected && <span className="text-[10px] text-gold font-semibold">Ativo</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controles Principais */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Status: Ativar / Desativar */}
            <div className="rounded-2xl border border-white/10 bg-muted/15 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Exibir Outdoor no Painel</p>
                <p className="text-[11px] text-muted-foreground">Visível para todos os membros</p>
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

            {/* Ponto Pulsante Ao Vivo */}
            <div className="rounded-2xl border border-white/10 bg-muted/15 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Indicador Luminoso Ao Vivo</p>
                <p className="text-[11px] text-muted-foreground">Ponto pulsante de destaque</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, showPulse: !prev.showPulse }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.showPulse ? "bg-gold" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    form.showPulse ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Textos e Conteúdos */}
          <div className="space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Tag / Badge Curto</label>
                <input
                  type="text"
                  maxLength={10}
                  value={form.badgeText}
                  onChange={(e) => setForm((prev) => ({ ...prev, badgeText: e.target.value.toUpperCase() }))}
                  placeholder="Ex: LQZZ, AVISO"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Título Principal</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Parceria Oficial Logzz COD"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Subtítulo / Descrição Rápida</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ex: Até 60% de comissão via Pix no checkout oficial"
                className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Texto do Botão (CTA)</label>
                <input
                  type="text"
                  value={form.buttonText}
                  onChange={(e) => setForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                  placeholder="Ex: Painel Logzz"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-background p-2.5 text-xs outline-none focus:border-gold transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">Link de Destino (URL)</label>
                <input
                  type="text"
                  value={form.buttonUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, buttonUrl: e.target.value }))}
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
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Restaurar Padrão Logzz
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              <Check className="h-4 w-4" /> Salvar e Publicar no Painel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

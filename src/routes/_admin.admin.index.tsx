import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BookOpen, CheckCircle2, Eye, Image, Link2, Palette, PlusCircle, SlidersHorizontal, Sparkles, TrendingUp, Tv, Users } from "lucide-react";
import { useAffiliateStore, BILLBOARD_THEMES } from "@/lib/affiliate-store";
import { BillboardModal } from "@/components/admin/BillboardModal";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({
    meta: [{ title: "Painel Administrativo — Vellessa CMS" }],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const {
    modulesList,
    allLessonsList,
    creativesList,
    materialsList,
    linksList,
    affiliatesMonitoring,
    featureSettings,
    toggleFeature,
    billboardSettings,
  } = useAffiliateStore();

  const [showBillboardModal, setShowBillboardModal] = useState(false);

  const monitoringList = useMemo(() => Object.values(affiliatesMonitoring || {}), [affiliatesMonitoring]);
  const activeRecently = useMemo(() => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return monitoringList.filter(
      (a) => a.lastLoginAt && now - new Date(a.lastLoginAt).getTime() < sevenDays
    ).length;
  }, [monitoringList]);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 gold-hairline md:p-10 shadow-soft">
        <div className="max-w-xl">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Controle Total do Produtor</span>
          <h1 className="mt-2 text-3xl md:text-5xl font-semibold leading-tight">
            Central de Gestão de Conteúdo
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Adicione aulas, vídeos, criativos publicitários, materiais e links que seus afiliados recebem em tempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/admin/aulas"
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
            >
              <PlusCircle className="h-4 w-4" /> Cadastrar Nova Aula
            </Link>
          </div>
        </div>
      </div>

      {/* Central de Permissões & Módulos Ativos (Feature Flags) — Padrão Apple HIG com Switches iOS */}
      <section className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-xs backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" /> Gestão de Recursos em Tempo Real
            </span>
            <h2 className="text-xl font-display font-bold text-foreground">
              Controle de Módulos da Plataforma (Afiliados)
            </h2>
            <p className="text-xs text-muted-foreground">
              Ative ou desative seções visíveis para os afiliados com 1 clique. O painel administrativo mantém acesso irrestrito para homologação e testes.
            </p>
          </div>
          <span className="self-start sm:self-center rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold text-gold border border-gold/20 shrink-0">
            Retorno Imediato
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: Gestor de Tráfego & Calculadora Meta Ads */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
              featureSettings.trafficManagerEnabled
                ? "border-gold/40 bg-gold/5 shadow-xs"
                : "border-white/10 bg-muted/20"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl shadow-xs transition ${
                      featureSettings.trafficManagerEnabled
                        ? "bg-gold-gradient text-primary-foreground shadow-gold"
                        : "bg-muted text-muted-foreground border border-white/10"
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Gestor de Tráfego</h3>
                    <p className="text-[11px] text-muted-foreground">Meta Ads, Break-Even & UTMs</p>
                  </div>
                </div>

                {/* Switch estilo iOS */}
                <button
                  type="button"
                  onClick={() => toggleFeature("trafficManagerEnabled")}
                  role="switch"
                  aria-checked={featureSettings.trafficManagerEnabled}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    featureSettings.trafficManagerEnabled ? "bg-gold" : "bg-zinc-700"
                  }`}
                  title={
                    featureSettings.trafficManagerEnabled
                      ? "Clique para ocultar dos afiliados"
                      : "Clique para ativar para os afiliados"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      featureSettings.trafficManagerEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Calculadora inteligente de break-even de 60%, gerador de links com UTMs e registro de custos diários de anúncios.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  featureSettings.trafficManagerEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    featureSettings.trafficManagerEnabled ? "bg-emerald-400" : "bg-zinc-400"
                  }`}
                />
                {featureSettings.trafficManagerEnabled
                  ? "Ativo para Afiliados"
                  : "Oculto para Afiliados"}
              </span>

              <Link
                to="/campanhas"
                className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1"
              >
                <span>Ver Módulo</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Comunidade & Mural de Afiliados */}
          <div
            className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
              featureSettings.communityEnabled
                ? "border-gold/40 bg-gold/5 shadow-xs"
                : "border-white/10 bg-muted/20"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-2xl shadow-xs transition ${
                      featureSettings.communityEnabled
                        ? "bg-gold-gradient text-primary-foreground shadow-gold"
                        : "bg-muted text-muted-foreground border border-white/10"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Comunidade & Mural</h3>
                    <p className="text-[11px] text-muted-foreground">Troca de Experiências & Avisos</p>
                  </div>
                </div>

                {/* Switch estilo iOS */}
                <button
                  type="button"
                  onClick={() => toggleFeature("communityEnabled")}
                  role="switch"
                  aria-checked={featureSettings.communityEnabled}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    featureSettings.communityEnabled ? "bg-gold" : "bg-zinc-700"
                  }`}
                  title={
                    featureSettings.communityEnabled
                      ? "Clique para ocultar dos afiliados"
                      : "Clique para ativar para os afiliados"
                  }
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      featureSettings.communityEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                Mural social com publicações, curtidas e comunicados oficiais fixados pela equipe gestora da Vellessa.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  featureSettings.communityEnabled
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    featureSettings.communityEnabled ? "bg-emerald-400" : "bg-zinc-400"
                  }`}
                />
                {featureSettings.communityEnabled
                  ? "Ativo para Afiliados"
                  : "Oculto para Afiliados"}
              </span>

              <Link
                to="/comunidade"
                className="text-xs font-semibold text-gold hover:underline inline-flex items-center gap-1"
              >
                <span>Ver Módulo</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas do CMS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Módulos Ativos", value: modulesList.length, desc: "Cursos na plataforma", icon: BookOpen, to: "/admin/aulas" },
          { label: "Aulas em Vídeo", value: allLessonsList.length, desc: "Conteúdos disponíveis", icon: Sparkles, to: "/admin/aulas" },
          { label: "Peças de Criativos", value: creativesList.length, desc: "Feed, Stories e Reels", icon: Image, to: "/admin/criativos" },
          { label: "Materiais & Links", value: materialsList.length + linksList.length, desc: "PDFs e links de venda", icon: Link2, to: "/admin/materiais" },
        ].map(({ label, value, desc, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="group rounded-2xl border bg-card p-5 transition hover:border-gold hover:shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-gold">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-display font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Monitoramento de Afiliados & Engajamento */}
      <div className="rounded-3xl border bg-card p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold shadow-gold shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Monitoramento de Afiliados em Tempo Real</h2>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                Ativo
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhe quem está assistindo as aulas, frequência de login e abra o Raio-X individual com mentoria via WhatsApp.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin/afiliados"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20 hover:border-gold transition"
          >
            <Eye className="h-3.5 w-3.5" /> Acessar Painel de Afiliados
          </Link>
        </div>
      </div>

      {/* Modal de Configuração do Outdoor Oficial */}
      <BillboardModal
        open={showBillboardModal}
        onClose={() => setShowBillboardModal(false)}
      />

      {/* Outdoor Oficial do Painel & Anúncios */}
      <div className="rounded-3xl border border-white/10 bg-card p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/10 text-gold shadow-gold shrink-0">
            <Tv className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Outdoor Oficial do Painel</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                billboardSettings.enabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-muted text-muted-foreground border-white/10"
              }`}>
                {billboardSettings.enabled ? "Ativo no Painel" : "Desativado"}
              </span>
              <span className="text-[10px] font-semibold text-gold">
                Tema: {BILLBOARD_THEMES[billboardSettings.theme]?.name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personalize título, mensagem, link e cores do banner de topo exibido a todos os afiliados.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowBillboardModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20 hover:border-gold transition"
          >
            <Palette className="h-3.5 w-3.5" /> Configurar Outdoor
          </button>
        </div>
      </div>

      {/* Ações Rápidas de Gerenciamento */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Módulos da Academia</h2>
            <Link to="/admin/aulas" className="text-xs font-semibold text-gold hover:underline">
              Gerenciar todos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {modulesList.map((m, idx) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border">
                <div>
                  <p className="font-medium text-sm text-foreground">
                    Módulo {idx + 1}: {m.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.lessons.length} aulas cadastradas</p>
                </div>
                <Link to="/admin/aulas" className="text-xs font-semibold text-gold hover:underline">
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-semibold">Biblioteca de Criativos</h2>
            <Link to="/admin/criativos" className="text-xs font-semibold text-gold hover:underline">
              Adicionar criativos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {creativesList.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3.5 border">
                <div>
                  <p className="font-medium text-sm text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Formato: <span className="font-semibold text-gold">{c.type}</span> · {c.format}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Ativo</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

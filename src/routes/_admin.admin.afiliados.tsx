import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Shield,
  UserCheck,
  Users,
  RefreshCw,
  Crown,
  Lock,
  Eye,
  AlertTriangle,
  TrendingUp,
  Activity,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useAffiliateStore, isSuperAdmin } from "@/lib/affiliate-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { AffiliateDetailModal, formatRelativeTime } from "@/components/admin/AffiliateDetailModal";

export const Route = createFileRoute("/_admin/admin/afiliados")({
  head: () => ({
    meta: [{ title: "Monitoramento de Afiliados — Vellessa CMS" }],
  }),
  component: AdminAfiliadosPage,
});

type FilterTab = "all" | "active" | "complete" | "inactive";

function AdminAfiliadosPage() {
  const { profile, isTitular, affiliatesMonitoring, modulesList, allLessonsList } =
    useAffiliateStore();
  const [search, setSearch] = useState("");
  const [dbAffiliates, setDbAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);

  const fetchAffiliates = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(0, 99);

      if (data && !error && data.length > 0) {
        setDbAffiliates(
          data.map((p) => ({
            id: p.affiliate_code || p.id.slice(0, 8),
            rawId: p.id,
            name: p.name,
            email: p.email,
            level: p.level || "Afiliado(a) Ouro",
            status: p.status === "active" ? "Ativo" : p.status,
            phone: p.phone || "",
            instagram: p.instagram || "",
            role: p.role,
            date: new Date(p.created_at).toLocaleDateString("pt-BR"),
            createdAt: p.created_at,
          }))
        );
      }
    } catch (e) {
      console.warn("Could not fetch profiles from Supabase:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  // Enriquece os afiliados com dados de monitoramento
  const enrichedAffiliates = useMemo(() => {
    const totalLessons = allLessonsList.length;
    return dbAffiliates.map((a) => {
      const monKey = a.email || a.id;
      const mon = affiliatesMonitoring[monKey] || {};
      const completedCount = (mon.completedLessonIds || []).length;
      const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      return {
        ...a,
        ...mon,
        progressPct: pct,
        completedCount,
        totalLessons,
      };
    });
  }, [dbAffiliates, affiliatesMonitoring, allLessonsList]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const total = enrichedAffiliates.length;
    const avgCompletion =
      total > 0
        ? Math.round(
            enrichedAffiliates.reduce((s, a) => s + (a.progressPct || 0), 0) / total
          )
        : 0;
    const activeLast7 = enrichedAffiliates.filter(
      (a) => a.lastLoginAt && now - new Date(a.lastLoginAt).getTime() < sevenDays
    ).length;
    const needAttention = enrichedAffiliates.filter(
      (a) => !a.lastLoginAt || (a.completedLessonIds || []).length === 0
    ).length;
    return { total, avgCompletion, activeLast7, needAttention };
  }, [enrichedAffiliates]);

  // Filtragem por aba + busca
  const filteredByTab = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return enrichedAffiliates.filter((a) => {
      if (filterTab === "active")
        return a.lastLoginAt && now - new Date(a.lastLoginAt).getTime() < sevenDays;
      if (filterTab === "complete") return a.progressPct >= 100;
      if (filterTab === "inactive")
        return !a.lastLoginAt || (a.completedLessonIds || []).length === 0;
      return true;
    });
  }, [enrichedAffiliates, filterTab]);

  const filtered = filteredByTab.filter(
    (a) =>
      (a.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (a.id || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleAdmin = async (affiliate: any) => {
    if (!isTitular) {
      toast.error("Permissão negada: apenas o Titular (ymarssico) pode nomear ou revogar administradores.");
      return;
    }
    if (isSuperAdmin(affiliate.email)) {
      toast.error("Ação bloqueada: o Titular Supremo possui governança permanente e não pode ser rebaixado.");
      return;
    }
    if (!affiliate.rawId || !isSupabaseConfigured || !supabase) {
      toast.info(`Simulação: cargo de ${affiliate.name} seria alterado para ${affiliate.role === "admin" ? "Afiliado(a)" : "Admin"}.`);
      return;
    }
    const newRole = affiliate.role === "admin" ? "affiliate" : "admin";
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", affiliate.rawId);
      if (error) throw error;
      toast.success(`Permissão de ${affiliate.name} atualizada para ${newRole === "admin" ? "Administrador" : "Afiliado(a)"}!`);
      fetchAffiliates();
    } catch (e: any) {
      toast.error(`Erro ao atualizar permissão: ${e.message}`);
    }
  };

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "Todos", count: kpis.total },
    { key: "active", label: "Ativos Recentes", count: kpis.activeLast7 },
    { key: "complete", label: "Completaram Curso" },
    { key: "inactive", label: "Precisam de Atenção", count: kpis.needAttention },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold">Monitoramento de Afiliados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o progresso nas aulas, frequência de acesso e engajamento de cada afiliado(a).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAffiliates}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-gold" : ""}`} />
            Atualizar
          </button>
          <div className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground w-full sm:w-72">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou ID..."
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total */}
        <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total de Afiliados</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold/10 text-gold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{kpis.total}</p>
          <p className="text-[11px] text-muted-foreground">cadastradas na plataforma</p>
        </div>

        {/* Avg Completion */}
        <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Taxa Média de Conclusão</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{kpis.avgCompletion}%</p>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${kpis.avgCompletion}%` }}
            />
          </div>
        </div>

        {/* Active 7d */}
        <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ativas nos Últimos 7 Dias</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{kpis.activeLast7}</p>
          <p className="text-[11px] text-muted-foreground">
            {kpis.total > 0 ? Math.round((kpis.activeLast7 / kpis.total) * 100) : 0}% do total
          </p>
        </div>

        {/* Need Attention */}
        <div className="rounded-3xl border bg-card p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Precisam de Atenção</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{kpis.needAttention}</p>
          <p className="text-[11px] text-muted-foreground">sem acesso ou sem aulas</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition border ${
              filterTab === t.key
                ? "bg-gold text-primary-foreground border-gold shadow-gold"
                : "bg-card text-muted-foreground border-border hover:border-gold/40 hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                  filterTab === t.key ? "bg-black/20" : "bg-muted"
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Afiliado(a)</th>
                <th className="p-4">Nível / Papel</th>
                <th className="p-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> Progresso nas Aulas
                  </span>
                </th>
                <th className="p-4">Último Acesso</th>
                <th className="p-4">Frequência</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-foreground">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-xs text-muted-foreground">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-gold" /> Carregando afiliados...
                      </span>
                    ) : (
                      "Nenhum afiliado encontrado para o filtro selecionado."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const lastAccess = formatRelativeTime(a.lastLoginAt);
                  const loginCount = a.loginCount || 0;
                  const progressPct = a.progressPct || 0;
                  const completedCount = a.completedCount || 0;
                  const totalLessons = a.totalLessons || 0;

                  return (
                    <tr key={a.id} className="hover:bg-muted/30 transition group">
                      {/* Afiliado(a) */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground shadow-xs shrink-0">
                            {(a.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                            <p className="text-[10px] font-mono text-gold/80">{a.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Nível / Papel */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-foreground">{a.level}</p>
                          {isSuperAdmin(a.email) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-gold">
                              <Crown className="h-3 w-3" /> Titular Supremo
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                a.role === "admin"
                                  ? "bg-gold/15 text-gold border border-gold/30"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {a.role === "admin" && <Shield className="h-3 w-3" />}
                              {a.role === "admin" ? "Admin" : "Afiliado(a)"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Progresso nas Aulas */}
                      <td className="p-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span
                              className={
                                progressPct >= 100
                                  ? "text-emerald-400 font-bold"
                                  : progressPct > 0
                                  ? "text-blue-400"
                                  : "text-muted-foreground"
                              }
                            >
                              {progressPct}%
                            </span>
                            <span className="text-muted-foreground">
                              {completedCount}/{totalLessons}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progressPct >= 100
                                  ? "bg-emerald-400"
                                  : progressPct > 0
                                  ? "bg-blue-400"
                                  : "bg-muted-foreground/20"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Último Acesso */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${
                              lastAccess.color === "text-emerald-400"
                                ? "bg-emerald-400"
                                : lastAccess.color === "text-blue-400"
                                ? "bg-blue-400"
                                : lastAccess.color === "text-amber-400"
                                ? "bg-amber-400"
                                : "bg-rose-400/60"
                            }`}
                          />
                          <span className={`text-xs font-medium ${lastAccess.color}`}>
                            {lastAccess.text}
                          </span>
                        </div>
                      </td>

                      {/* Frequência */}
                      <td className="p-4">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                            loginCount >= 10
                              ? "bg-emerald-500/10 text-emerald-400"
                              : loginCount >= 3
                              ? "bg-blue-500/10 text-blue-400"
                              : loginCount >= 1
                              ? "bg-muted text-muted-foreground"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {loginCount >= 10
                            ? "Alta"
                            : loginCount >= 3
                            ? "Regular"
                            : loginCount >= 1
                            ? `${loginCount}x`
                            : "Nunca"}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Raio-X Button */}
                          <button
                            onClick={() => setSelectedAffiliate(a)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs font-semibold text-gold hover:bg-gold/15 hover:border-gold transition"
                            title="Ver Raio-X do afiliado"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Raio-X
                          </button>

                          {/* Toggle Admin */}
                          {isSuperAdmin(a.email) ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold/70 italic">
                              <Lock className="h-3 w-3" />
                            </span>
                          ) : isTitular ? (
                            <button
                              onClick={() => handleToggleAdmin(a)}
                              className="rounded-lg border px-2.5 py-1 text-xs font-semibold hover:border-gold hover:text-gold transition text-muted-foreground"
                              title={a.role === "admin" ? "Revogar permissão administrativa" : "Nomear como administrador"}
                            >
                              {a.role === "admin" ? "Revogar" : "Nomear Admin"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela */}
        {filtered.length > 0 && (
          <div className="border-t px-6 py-3 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
            <span>
              Exibindo <strong className="text-foreground">{filtered.length}</strong> de{" "}
              <strong className="text-foreground">{kpis.total}</strong> afiliados
            </span>
            <span className="font-mono">
              {kpis.activeLast7} ativos nos últimos 7 dias
            </span>
          </div>
        )}
      </div>

      {/* Modal Raio-X */}
      {selectedAffiliate && (
        <AffiliateDetailModal
          affiliate={selectedAffiliate}
          modulesList={modulesList}
          onClose={() => setSelectedAffiliate(null)}
        />
      )}
    </div>
  );
}

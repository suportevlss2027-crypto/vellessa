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
  Check,
  UserPlus,
  X,
  Mail,
  Phone,
  Instagram,
  Key,
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

  // Modal de Criação de Afiliado pelo Admin
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    instagram: "",
    level: "Afiliado(a) Ouro",
    role: "affiliate" as "affiliate" | "admin",
  });

  const fetchAffiliates = async () => {
    setLoading(true);
    let supabaseItems: any[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .range(0, 99);

        if (error) {
          console.warn("[AdminAfiliados] Erro ao buscar perfis do Supabase:", error);
          toast.error(`Aviso Supabase: ${error.message}`);
        } else if (data) {
          supabaseItems = data.map((p) => ({
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
          }));
        }
      } catch (e: any) {
        console.warn("Could not fetch profiles from Supabase:", e);
      }
    }

    // Mescla inteligente com telemetria local (fallback para contas locais/offline)
    const mapByEmail = new Map<string, any>();
    supabaseItems.forEach((item) => {
      if (item.email) mapByEmail.set(item.email.toLowerCase(), item);
    });

    Object.values(affiliatesMonitoring).forEach((mon) => {
      const email = mon.email?.toLowerCase();
      if (email && !mapByEmail.has(email)) {
        mapByEmail.set(email, {
          id: mon.affiliateId || `VLS-${email.slice(0, 5).toUpperCase()}`,
          rawId: mon.affiliateId,
          name: mon.name || email.split("@")[0],
          email: mon.email,
          level: mon.level || "Afiliado Oficial",
          status: "Ativo",
          phone: mon.phone || "",
          instagram: mon.instagram || "",
          role: mon.role || "affiliate",
          date: new Date(mon.createdAt || Date.now()).toLocaleDateString("pt-BR"),
          createdAt: mon.createdAt || new Date().toISOString(),
        });
      }
    });

    setDbAffiliates(Array.from(mapByEmail.values()));
    setLoading(false);
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

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffiliate.name.trim() || !newAffiliate.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    if (!newAffiliate.email.includes("@")) {
      toast.error("Insira um e-mail válido.");
      return;
    }

    setIsSubmitting(true);
    const trimmedEmail = newAffiliate.email.trim().toLowerCase();
    const trimmedName = newAffiliate.name.trim();
    const first = trimmedName.split(" ")[0] || trimmedName;
    const affiliateCode = `VLS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      let createdUserId: string | null = null;

      // 1. Cria usuário no Supabase Auth se houver senha fornecida
      if (isSupabaseConfigured && supabase && newAffiliate.password.trim().length >= 6) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: trimmedEmail,
            password: newAffiliate.password.trim(),
            options: {
              data: {
                name: trimmedName,
                role: newAffiliate.role,
                phone: newAffiliate.phone.trim() || undefined,
                instagram: newAffiliate.instagram.trim() || undefined,
              },
            },
          });
          if (authData?.user) {
            createdUserId = authData.user.id;
          } else if (authErr) {
            console.warn("Auth signup notice:", authErr.message);
          }
        } catch (err) {
          console.warn("Auth signup error:", err);
        }
      }

      // 2. Garante o perfil em public.profiles
      const profileId = createdUserId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      if (isSupabaseConfigured && supabase) {
        const { error: profileErr } = await supabase.from("profiles").upsert({
          id: profileId,
          email: trimmedEmail,
          name: trimmedName,
          first_name: first,
          phone: newAffiliate.phone.trim() || null,
          instagram: newAffiliate.instagram.trim() || null,
          affiliate_code: affiliateCode,
          role: newAffiliate.role,
          level: newAffiliate.level,
          status: "active",
          commission_rate: 0.60,
        }, { onConflict: "id" });

        if (profileErr) {
          console.warn("Profile upsert warning:", profileErr);
        }
      }

      // 3. Registra na telemetria local para visualização imediata em qualquer condição
      const newProf = {
        id: affiliateCode,
        rawId: profileId,
        name: trimmedName,
        first,
        email: trimmedEmail,
        phone: newAffiliate.phone.trim(),
        instagram: newAffiliate.instagram.trim(),
        role: newAffiliate.role,
        level: newAffiliate.level,
        status: "Ativo",
        date: new Date().toLocaleDateString("pt-BR"),
        createdAt: new Date().toISOString(),
      };

      setDbAffiliates((prev) => [newProf, ...prev.filter((p) => p.email?.toLowerCase() !== trimmedEmail)]);
      toast.success(`${trimmedName} cadastrado(a) com sucesso como ${newAffiliate.role === "admin" ? "Administrador" : "Afiliado(a)"}!`);
      setShowCreateModal(false);
      setNewAffiliate({
        name: "",
        email: "",
        password: "",
        phone: "",
        instagram: "",
        level: "Afiliado(a) Ouro",
        role: "affiliate",
      });
      fetchAffiliates();
    } catch (e: any) {
      toast.error(`Erro ao cadastrar: ${e?.message || "Tente novamente."}`);
    } finally {
      setIsSubmitting(false);
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
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Cadastrar Afiliado
          </button>
          <button
            onClick={fetchAffiliates}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition disabled:opacity-50 cursor-pointer"
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

      {/* Modal de Criação de Afiliado pelo Admin */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gold/30 bg-card p-6 shadow-2xl animate-in zoom-in-95 text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold/10 text-gold border border-gold/20">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">Cadastrar Novo Afiliado</h3>
                  <p className="text-xs text-muted-foreground">Adicione um novo membro diretamente à plataforma.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAffiliate} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/90">Nome Completo *</label>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
                    placeholder="Ex: Maria Silva"
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">E-mail *</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <input
                      required
                      type="email"
                      value={newAffiliate.email}
                      onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
                      placeholder="afiliado@exemplo.com"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">Senha Inicial</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={newAffiliate.password}
                      onChange={(e) => setNewAffiliate({ ...newAffiliate, password: e.target.value })}
                      placeholder="Mín. 6 dígitos (opcional)"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">WhatsApp / Telefone</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={newAffiliate.phone}
                      onChange={(e) => setNewAffiliate({ ...newAffiliate, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">Instagram</label>
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={newAffiliate.instagram}
                      onChange={(e) => setNewAffiliate({ ...newAffiliate, instagram: e.target.value })}
                      placeholder="@usuario"
                      className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">Nível Inicial</label>
                  <select
                    value={newAffiliate.level}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, level: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs outline-none text-foreground"
                  >
                    <option value="Afiliado(a) Ouro">Afiliado(a) Ouro</option>
                    <option value="Afiliado(a) Diamante">Afiliado(a) Diamante</option>
                    <option value="Afiliado(a) Black">Afiliado(a) Black</option>
                    <option value="Afiliado(a) Embaixador">Afiliado(a) Embaixador</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/90">Tipo de Acesso</label>
                  <select
                    value={newAffiliate.role}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, role: e.target.value as "affiliate" | "admin" })}
                    className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs outline-none text-foreground"
                  >
                    <option value="affiliate">Afiliado(a) Padrão</option>
                    <option value="admin">Administrador / Gerente</option>
                  </select>
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-border/60 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-5 py-2 text-xs font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition disabled:opacity-50 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isSubmitting ? "Cadastrando..." : "Cadastrar e Ativar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

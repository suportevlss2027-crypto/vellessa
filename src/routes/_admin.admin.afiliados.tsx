import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Shield, UserCheck, Users, Mail, Phone, RefreshCw, Crown, Lock } from "lucide-react";
import { useAffiliateStore, isSuperAdmin } from "@/lib/affiliate-store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/admin/afiliados")({
  head: () => ({
    meta: [{ title: "Afiliados Cadastrados — Vellessa CMS" }],
  }),
  component: AdminAfiliadosPage,
});

function AdminAfiliadosPage() {
  const { profile, isTitular } = useAffiliateStore();
  const [search, setSearch] = useState("");
  const [dbAffiliates, setDbAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
            level: p.level || "Afiliada Ouro",
            status: p.status === "active" ? "Ativo" : p.status,
            phone: p.phone || "—",
            role: p.role,
            date: new Date(p.created_at).toLocaleDateString("pt-BR"),
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

  const affiliatesList = dbAffiliates;

  const handleToggleAdmin = async (affiliate: any) => {
    // RBAC: Apenas o titular pode nomear ou revogar administradores
    if (!isTitular) {
      toast.error("Permissão negada: apenas o Titular (ymarssico) pode nomear ou revogar administradores.");
      return;
    }

    // RBAC: O titular supremo é imutável
    if (isSuperAdmin(affiliate.email)) {
      toast.error("Ação bloqueada: o Titular Supremo possui governança permanente e não pode ser rebaixado.");
      return;
    }

    if (!affiliate.rawId || !isSupabaseConfigured || !supabase) {
      // Demonstração local/offline
      toast.info(`Simulação: cargo de ${affiliate.name} seria alterado para ${affiliate.role === "admin" ? "Afiliada" : "Admin"}.`);
      return;
    }

    const newRole = affiliate.role === "admin" ? "affiliate" : "admin";
    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", affiliate.rawId);
      if (error) throw error;
      toast.success(`Permissão de ${affiliate.name} atualizada para ${newRole === "admin" ? "Administrador" : "Afiliada"}!`);
      fetchAffiliates();
    } catch (e: any) {
      toast.error(`Erro ao atualizar permissão: ${e.message}`);
    }
  };

  const filtered = affiliatesList.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-semibold">Afiliados Cadastrados</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a lista de afiliadas da sua operação, códigos de rastreamento e status de conta.
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
          <div className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground w-full sm:w-64">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou ID..."
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">Afiliado</th>
                <th className="p-4">Código / ID</th>
                <th className="p-4">Nível</th>
                <th className="p-4">Papel</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data de Entrada</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-foreground">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                    Nenhum afiliado cadastrado encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-primary-foreground shadow-xs">
                          {a.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-gold font-semibold">{a.id}</td>
                    <td className="p-4 text-xs font-medium">{a.level}</td>
                    <td className="p-4">
                      {isSuperAdmin(a.email) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground shadow-gold">
                          <Crown className="h-3 w-3" /> Titular Supremo
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            a.role === "admin"
                              ? "bg-gold/15 text-gold border border-gold/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {a.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                          {a.role === "admin" ? "Administrador Delegado" : "Afiliada"}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <UserCheck className="h-3 w-3" /> {a.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{a.date}</td>
                    <td className="p-4 pr-6 text-right">
                      {isSuperAdmin(a.email) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold/80 italic">
                          <Lock className="h-3 w-3" /> Titular Imutável
                        </span>
                      ) : isTitular ? (
                        <button
                          onClick={() => handleToggleAdmin(a)}
                          className="rounded-lg border px-2.5 py-1 text-xs font-semibold hover:border-gold hover:text-gold transition"
                          title={a.role === "admin" ? "Revogar permissão administrativa" : "Nomear como administrador"}
                        >
                          {a.role === "admin" ? "Revogar Admin" : "Nomear Admin"}
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60">
                          Apenas Titular
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

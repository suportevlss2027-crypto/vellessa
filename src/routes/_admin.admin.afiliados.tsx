import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, UserCheck, Users, Mail, Phone } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_admin/admin/afiliados")({
  head: () => ({
    meta: [{ title: "Afiliados Cadastrados — Vellessa CMS" }],
  }),
  component: AdminAfiliadosPage,
});

function AdminAfiliadosPage() {
  const { profile } = useAffiliateStore();
  const [search, setSearch] = useState("");

  const sampleAffiliates = [
    {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      level: profile.level,
      status: "Ativo",
      phone: profile.phone || "(11) 98765-4321",
      role: profile.role,
      date: "Hoje",
    },
    {
      id: "VLS-18492",
      name: "Juliana Rocha",
      email: "juliana.rocha@email.com",
      level: "Afiliada Prata",
      status: "Ativo",
      phone: "(21) 99876-1234",
      role: "affiliate",
      date: "Ontem",
    },
    {
      id: "VLS-33910",
      name: "Camila Silveira",
      email: "camila.s@email.com",
      level: "Afiliada Ouro",
      status: "Ativo",
      phone: "(31) 98712-4567",
      role: "affiliate",
      date: "3 dias atrás",
    },
    {
      id: "VLS-59124",
      name: "Fernanda Lima",
      email: "fernanda.lima@email.com",
      level: "Afiliada Diamante",
      status: "Ativo",
      phone: "(41) 99123-8899",
      role: "affiliate",
      date: "5 dias atrás",
    },
  ];

  const filtered = sampleAffiliates.filter(
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
                <th className="p-4 pr-6">Data de Entrada</th>
              </tr>
            </thead>
            <tbody className="divide-y text-foreground">
              {filtered.map((a) => (
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
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        a.role === "admin"
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {a.role === "admin" ? <Shield className="h-3 w-3" /> : null}
                      {a.role === "admin" ? "Administrador" : "Afiliada"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <UserCheck className="h-3 w-3" /> {a.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-xs text-muted-foreground">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

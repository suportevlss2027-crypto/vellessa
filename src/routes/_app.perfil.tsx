import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Copy, Save } from "lucide-react";
import { PageHeader, ThemeToggle } from "@/components/AppShell";
import { useAffiliateStore } from "@/lib/affiliate-store";

export const Route = createFileRoute("/_app/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Vellessa Afiliados" },
      { name: "description", content: "Seus dados e preferências na plataforma Vellessa Afiliados." },
      { property: "og:title", content: "Meu perfil — Vellessa Afiliados" },
      { property: "og:description", content: "Seus dados e preferências." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { profile, updateProfile, copyText } = useAffiliateStore();

  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    instagram: profile.instagram,
    pix_key: profile.pix_key || "",
  });

  useEffect(() => {
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      instagram: profile.instagram,
      pix_key: profile.pix_key || "",
    });
  }, [profile]);

  const initials = profile.name
    ? profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("")
    : (profile.first ? profile.first[0]?.toUpperCase() : "AF");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const first = formData.name.split(" ")[0] || formData.name;
    updateProfile({
      ...formData,
      first,
    });
  };

  return (
    <>
      <PageHeader eyebrow="Configurações da Conta" title="Meu perfil" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl bg-hero-gradient p-8 text-center gold-hairline shadow-soft flex flex-col items-center justify-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-gold-gradient font-display text-3xl font-semibold text-primary-foreground shadow-gold">
            {initials}
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">{profile.name}</h2>
          <p className="text-sm font-semibold text-gold">{profile.level}</p>

          <div className="mt-4 flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 font-mono text-xs text-muted-foreground">
            <span>Matrícula de Membro: {profile.id}</span>
            <button
              type="button"
              onClick={() => copyText(profile.id, "ID de Matrícula copiado!")}
              title="Copiar ID de Matrícula"
              aria-label="Copiar ID de Matrícula"
              className="text-muted-foreground hover:text-gold transition"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Comissão padrão na Logzz: <span className="font-semibold text-gold">50% a 60%</span>
          </p>
        </div>

        <form
          className="space-y-6 rounded-3xl border bg-card p-6 md:p-8 shadow-xs"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">Nome completo</span>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail de acesso</span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp</span>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Chave PIX (Para repasses e bonificações)
              </span>
              <input
                value={formData.pix_key}
                onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                className="h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
              />
            </label>
          </div>

          {/* Link Oficial de Indicação / Conexão Logzz */}
          <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
              Seu Link Rápido de Afiliado Vellessa na Logzz
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                readOnly
                value={`https://app.logzz.com.br/afiliados/cadastro?ref=${profile.id || "vellessa"}`}
                className="h-10 flex-1 rounded-xl border border-white/10 bg-background/80 px-3 font-mono text-xs text-muted-foreground outline-none select-all"
              />
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `https://app.logzz.com.br/afiliados/cadastro?ref=${profile.id || "vellessa"}`,
                    "Link de afiliação copiado com sucesso!"
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-primary-foreground shadow-gold hover:brightness-105 transition shrink-0"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar Link
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Utilize este link de afiliação para conectar sua conta da Logzz e garantir o rastreio das suas comissões.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4 border">
            <div>
              <p className="font-medium text-foreground">Tema da plataforma</p>
              <p className="text-sm text-muted-foreground">Alterne entre os modos claro e escuro</p>
            </div>
            <ThemeToggle />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:brightness-105 transition"
          >
            <Save className="h-4 w-4" /> Salvar alterações
          </button>
        </form>
      </div>
    </>
  );
}

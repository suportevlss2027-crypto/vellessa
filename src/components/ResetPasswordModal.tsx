import React, { useState } from "react";
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useAffiliateStore } from "@/lib/affiliate-store";

export function ResetPasswordModal() {
  const { isRecoveryMode, setIsRecoveryMode, updatePassword, authLoading } = useAffiliateStore();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isRecoveryMode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem. Digite novamente.");
      return;
    }

    setSubmitting(true);
    const ok = await updatePassword(newPassword.trim());
    setSubmitting(false);

    if (ok) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleClose = () => {
    setIsRecoveryMode(false);
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gold/30 bg-card p-6 sm:p-8 shadow-2xl">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />

        {/* Botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Ícone de Destaque */}
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient shadow-gold">
          <KeyRound className="h-7 w-7 text-primary-foreground" />
        </div>

        <div className="text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            Segurança da Conta
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Redefinir sua Senha
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Crie uma nova senha segura para acessar sua conta de membro e painel administrativo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">
              Nova Senha
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border/70 bg-background pl-11 pr-11 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-foreground">
              Confirmar Nova Senha
            </span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border/70 bg-background pl-11 pr-11 text-sm outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/20 placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient font-bold text-primary-foreground shadow-gold text-sm transition hover:brightness-105 disabled:opacity-60 cursor-pointer"
          >
            {submitting || authLoading ? (
              "Gravando nova senha..."
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Salvar Nova Senha e Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-white/5 bg-surface/30 p-3 text-center text-[11px] text-muted-foreground">
          Após redefinir, você poderá utilizar esta nova senha em todos os seus dispositivos.
        </div>
      </div>
    </div>
  );
}

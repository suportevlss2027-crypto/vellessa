import React, { useEffect } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Flame,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { type DynamicModule } from "@/lib/affiliate-store";

interface AffiliateDetailModalProps {
  affiliate: {
    id: string;
    rawId?: string;
    name: string;
    email: string;
    phone?: string;
    instagram?: string;
    level: string;
    role?: string;
    status?: string;
    date?: string;
    createdAt?: string;
    lastLoginAt?: string;
    loginCount?: number;
    completedLessonIds?: string[];
    lastLessonWatchedTitle?: string;
    lastLessonWatchedAt?: string;
  };
  modulesList: DynamicModule[];
  onClose: () => void;
}

export function formatRelativeTime(dateString?: string): { text: string; color: string } {
  if (!dateString) return { text: "Nunca acessou", color: "text-muted-foreground" };
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return { text: "Agora mesmo", color: "text-emerald-400" };
  }
  if (diffHours < 24) {
    return {
      text: `Hoje às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      color: "text-emerald-400",
    };
  }
  if (diffDays === 1) {
    return { text: "Ontem", color: "text-blue-400" };
  }
  if (diffDays < 7) {
    return { text: `Há ${diffDays} dias`, color: "text-blue-400" };
  }
  if (diffDays < 30) {
    return { text: `Há ${diffDays} dias`, color: "text-amber-400" };
  }
  return { text: `Inativo há mais de 30 dias`, color: "text-rose-400" };
}

export function AffiliateDetailModal({
  affiliate,
  modulesList,
  onClose,
}: AffiliateDetailModalProps) {
  // Trava de rolagem no body da página
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Coleta todas as aulas cadastradas
  const allLessons = modulesList.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
  );

  const completedIds = affiliate.completedLessonIds || [];
  const completedCount = allLessons.filter((l) => completedIds.includes(l.id)).length;
  const totalCount = allLessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const lastAccess = formatRelativeTime(affiliate.lastLoginAt);
  const loginCount = affiliate.loginCount || 1;

  // Mensagem personalizada de WhatsApp para mentoria
  const cleanPhone = (affiliate.phone || "").replace(/\D/g, "");
  const mentorMessage =
    progressPct >= 70
      ? `Olá ${affiliate.name.split(" ")[0]}! Aqui é da equipe Vellessa. Vi que você já concluiu ${progressPct}% das aulas da Academia! Meus parabéns! Gostaria de uma mentoria rápida para otimizar suas campanhas na Logzz?`
      : progressPct > 0
      ? `Olá ${affiliate.name.split(" ")[0]}! Aqui é da equipe Vellessa. Notei que você já iniciou o treinamento da Academia Vellessa (${progressPct}% concluído). Posso te ajudar a tirar alguma dúvida da aula para acelerar seus resultados?`
      : `Olá ${affiliate.name.split(" ")[0]}! Aqui é da equipe Vellessa. Vi que você se cadastrou na nossa plataforma de afiliados, mas ainda não começou as aulas da Academia. Precisa de algum apoio para dar o primeiro passo?`;

  const waLink = cleanPhone
    ? `https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encodeURIComponent(
        mentorMessage
      )}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl border border-white/10 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. HEADER FIXO */}
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 shrink-0 bg-card/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-gradient text-lg font-bold text-primary-foreground shadow-gold shrink-0">
              {affiliate.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">{affiliate.name}</h2>
                <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                  {affiliate.level}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>{affiliate.email}</span>
                <span>·</span>
                <span className="font-mono text-gold">{affiliate.id}</span>
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

        {/* 2. CORPO ROLÁVEL COM SCROLLBAR ELEGANTE */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 overscroll-contain custom-scrollbar">
          {/* 4 Cards de Métricas de Engajamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Progresso das Aulas */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-2">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-gold" /> Progresso de Aulas
              </span>
              <p className="text-xl font-bold text-foreground">
                {progressPct}%
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gold-gradient h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                {completedCount} de {totalCount} aulas
              </p>
            </div>

            {/* Card 2: Último Acesso */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold" /> Último Acesso
              </span>
              <p className={`text-sm font-semibold truncate ${lastAccess.color}`}>
                {lastAccess.text}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {affiliate.lastLoginAt
                  ? new Date(affiliate.lastLoginAt).toLocaleDateString("pt-BR")
                  : "Sem histórico"}
              </p>
            </div>

            {/* Card 3: Frequência & Sessões */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-gold" /> Total de Acessos
              </span>
              <p className="text-xl font-bold text-foreground">
                {loginCount} {loginCount === 1 ? "sessão" : "sessões"}
              </p>
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  loginCount >= 10
                    ? "bg-emerald-500/10 text-emerald-400"
                    : loginCount >= 3
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {loginCount >= 10 ? "Alta Frequência" : loginCount >= 3 ? "Regular" : "Iniciante"}
              </span>
            </div>

            {/* Card 4: Data de Cadastro */}
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-4 space-y-1.5">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" /> Cadastrado em
              </span>
              <p className="text-sm font-semibold text-foreground">
                {affiliate.date ||
                  (affiliate.createdAt
                    ? new Date(affiliate.createdAt).toLocaleDateString("pt-BR")
                    : "—")}
              </p>
              <p className="text-[10px] text-muted-foreground">Membro da Comunidade</p>
            </div>
          </div>

          {/* Barra de Ação Rápida: Mentoria WhatsApp */}
          {cleanPhone ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Apoio Direto no WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Envie uma mensagem contextualizada para impulsionar os resultados de {affiliate.name.split(" ")[0]}.
                  </p>
                </div>
              </div>
              <a
                href={waLink!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 text-xs shadow-md transition shrink-0"
              >
                <MessageCircle className="h-4 w-4" /> Enviar Mensagem de Apoio
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-muted/10 p-3.5 text-xs text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground/60" />
              <span>Afiliado(a) não possui número de WhatsApp cadastrado no perfil.</span>
            </div>
          )}

          {/* Trilha de Aulas e Módulos: Raio-X Detalhado */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Raio-X da Trilha de Capacitação
              </h3>
              <span className="text-xs font-mono text-muted-foreground">
                {completedCount} concluídas de {totalCount} aulas
              </span>
            </div>

            {modulesList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhum módulo cadastrado na plataforma ainda.
              </p>
            ) : (
              <div className="space-y-3 divide-y divide-border/20">
                {modulesList.map((m, mIdx) => {
                  const modLessons = m.lessons;
                  const modCompleted = modLessons.filter((l) => completedIds.includes(l.id)).length;
                  const modTotal = modLessons.length;
                  const modPct = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

                  return (
                    <div key={m.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                            Módulo {mIdx + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-foreground">{m.title}</h4>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {modCompleted}/{modTotal} ({modPct}%)
                        </span>
                      </div>

                      <div className="grid gap-1.5 pl-2">
                        {modLessons.map((l) => {
                          const isDone = completedIds.includes(l.id);
                          return (
                            <div
                              key={l.id}
                              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition border ${
                                isDone
                                  ? "bg-emerald-950/20 border-emerald-500/20 text-foreground"
                                  : "bg-muted/20 border-transparent text-muted-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {isDone ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={`font-medium ${isDone ? "text-foreground" : ""}`}>
                                  {l.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                                <span>{l.duration}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                    isDone
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {isDone ? "Concluída" : "Pendente"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. FOOTER FIXO (Sempre Visível) */}
        <div className="flex justify-end px-6 py-4 border-t border-border/40 shrink-0 bg-card/95 backdrop-blur-sm z-10">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-5 py-2 text-xs font-semibold hover:bg-muted transition text-foreground"
          >
            Fechar Raio-X
          </button>
        </div>
      </div>
    </div>
  );
}

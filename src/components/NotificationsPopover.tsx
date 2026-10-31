import React from "react";
import { Bell, CheckCheck, Pin, X } from "lucide-react";
import { useAffiliateStore } from "@/lib/affiliate-store";

interface NotificationsPopoverProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsPopover({ open, onClose }: NotificationsPopoverProps) {
  const { announcements, unreadAnnouncementsCount, markAllNotificationsRead } = useAffiliateStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 sm:p-6 sm:pt-20 bg-black/20 backdrop-blur-[2px] animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-2xl animate-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gold" />
            <h3 className="font-semibold text-foreground">Notificações e Avisos</h3>
            {unreadAnnouncementsCount > 0 && (
              <span className="rounded-full bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                {unreadAnnouncementsCount} novas
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar notificações"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-3.5 transition ${
                a.pinned
                  ? "bg-hero-gradient gold-hairline"
                  : a.read
                  ? "bg-background/40 opacity-80"
                  : "bg-accent/40 border-gold/40"
              }`}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  {a.pinned && <Pin className="h-3 w-3 text-gold" />}
                  {a.author}
                </span>
                <span>{a.time}</span>
              </div>
              <h4 className="mt-1.5 text-sm font-semibold text-foreground">{a.title}</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 flex items-center justify-between">
          <button
            onClick={markAllNotificationsRead}
            disabled={unreadAnnouncementsCount === 0}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gold hover:underline disabled:opacity-50 disabled:hover:no-underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar todas como lidas
          </button>
          <span className="text-[11px] text-muted-foreground">Equipe Vellessa</span>
        </div>
      </div>
    </div>
  );
}

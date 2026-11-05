import React, { useState, useRef } from "react";
import { Upload, Link2, Sparkles, X, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { images } from "@/data/content";

interface MediaUploadFieldProps {
  label?: string;
  description?: string;
  value?: string;
  onChange: (value: string) => void;
  onFileSelect?: (file: File) => void;
  aspectRatio?: "video" | "square" | "portrait";
  acceptVideo?: boolean;
}

const PRESET_GALLERY = [
  { id: "serum", label: "Sérum Vellessa Oficial", src: images.serum },
  { id: "cover3", label: "Ativos e Gotas", src: images.cover3 },
];

export function MediaUploadField({
  label,
  description,
  value,
  onChange,
  onFileSelect,
  aspectRatio = "video",
  acceptVideo = false,
}: MediaUploadFieldProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "gallery" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "portrait"
      ? "aspect-[4/5]"
      : "aspect-video";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onFileSelect) {
      onFileSelect(file);
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && (!acceptVideo || !isVideo)) {
      toast.error(
        acceptVideo
          ? "Selecione uma imagem (PNG, JPG, WebP) ou vídeo (MP4, WebM)."
          : "Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP)."
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("O arquivo selecionado excede o limite máximo permitido (50MB).");
      return;
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onChange(result);
          toast.success("Foto carregada com sucesso!");
        }
      };
      reader.readAsDataURL(file);
    } else if (isVideo) {
      // Gera thumbnail do vídeo usando canvas
      const videoEl = document.createElement("video");
      const objUrl = URL.createObjectURL(file);
      videoEl.src = objUrl;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.currentTime = 0.5;

      videoEl.onloadeddata = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = videoEl.videoWidth || 640;
          canvas.height = videoEl.videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const thumb = canvas.toDataURL("image/jpeg", 0.85);
            onChange(thumb);
            toast.success("Capa do vídeo capturada com sucesso!");
          }
        } catch {
          // fallback para dataUrl do arquivo
          const reader = new FileReader();
          reader.onload = (ev) => {
            const res = ev.target?.result as string;
            if (res) onChange(res);
          };
          reader.readAsDataURL(file);
        } finally {
          URL.revokeObjectURL(objUrl);
        }
      };

      videoEl.onerror = () => {
        URL.revokeObjectURL(objUrl);
        toast.info("Vídeo processado. Você pode definir uma capa manual se desejar.");
      };
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput("");
    toast.success("Link de imagem aplicado!");
  };

  const handleSelectPreset = (src: string) => {
    onChange(src);
    toast.success("Imagem oficial da Vellessa selecionada!");
  };

  return (
    <div className="space-y-2">
      {(label || value) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label className="text-xs font-semibold text-foreground">{label}</label>
          ) : <span />}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] text-red-400 hover:text-red-300 transition flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Remover imagem
            </button>
          )}
        </div>
      )}

      {description && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}

      {/* Preview se já tiver valor */}
      {value ? (
        <div className="relative group overflow-hidden rounded-2xl border border-gold/30 bg-card/60 p-2 shadow-xs backdrop-blur-sm">
          <div className={`relative ${aspectClass} w-full overflow-hidden rounded-xl bg-black/40`}>
            <img
              src={value}
              alt="Pré-visualização"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold"
              >
                Trocar Foto
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full bg-zinc-900/90 border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500/80 transition"
              >
                Remover
              </button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptVideo ? "image/*,video/*" : "image/*"}
            className="hidden"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-card/40 p-3.5 backdrop-blur-sm space-y-3">
          {/* Tabs */}
          <div className="flex rounded-xl bg-muted/40 p-1 text-[11px] font-medium text-muted-foreground">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                activeTab === "upload"
                  ? "bg-gold/15 text-gold font-bold shadow-xs border border-gold/30"
                  : "hover:text-foreground"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Computador</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("gallery")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                activeTab === "gallery"
                  ? "bg-gold/15 text-gold font-bold shadow-xs border border-gold/30"
                  : "hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fotos Oficiais</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${
                activeTab === "url"
                  ? "bg-gold/15 text-gold font-bold shadow-xs border border-gold/30"
                  : "hover:text-foreground"
              }`}
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>Link (URL)</span>
            </button>
          </div>

          {/* Tab 1: Upload do Computador */}
          {activeTab === "upload" && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={acceptVideo ? "image/*,video/*" : "image/*"}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-border/50 hover:border-gold/50 rounded-xl p-5 text-center transition group bg-card/30 hover:bg-card/60"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold/10 text-gold mx-auto group-hover:scale-110 transition shadow-xs">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-2 text-xs font-semibold text-foreground">
                  Clique ou arraste {acceptVideo ? "uma mídia (foto ou vídeo)" : "uma foto"} do seu computador
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {acceptVideo
                    ? "PNG, JPG, WebP ou vídeos MP4 / WebM (máx. 50MB)"
                    : "PNG, JPG, WebP de alta resolução (máx. 8MB)"}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Galeria Oficial Vellessa */}
          {activeTab === "gallery" && (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">
                Escolha uma das artes originais em alta definição da marca:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {PRESET_GALLERY.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.src)}
                    className="group relative aspect-video overflow-hidden rounded-lg border border-white/10 hover:border-gold transition text-left"
                  >
                    <img
                      src={item.src}
                      alt={item.label}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-semibold text-white truncate drop-shadow-xs">
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: URL Direta */}
          {activeTab === "url" && (
            <form onSubmit={handleApplyUrl} className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/sua-foto.jpg"
                className="flex-1 h-9 rounded-xl border border-white/10 bg-background/80 px-3 text-xs outline-none focus:border-gold transition"
              />
              <button
                type="submit"
                disabled={!urlInput.trim()}
                className="h-9 px-3.5 rounded-xl bg-gold-gradient text-primary-foreground font-semibold text-xs shadow-gold hover:brightness-105 transition disabled:opacity-40"
              >
                Aplicar
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default MediaUploadField;

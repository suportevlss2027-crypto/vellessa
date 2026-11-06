import React, { useState, useEffect, useRef } from "react";
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { detectVideoDuration, formatSecondsToDuration } from "@/lib/video-duration";

interface VideoPlayerProps {
  cover: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  onAutoComplete?: () => void;
  onDurationDetected?: (duration: string) => void;
}

function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // YouTube (Padrão, Não Listado, Shorts e Embed)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Google Drive
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // Loom
  if (trimmed.includes("loom.com/share/")) {
    return trimmed.replace("loom.com/share/", "loom.com/embed/");
  }

  // Panda Video / VTurb / Player Embed
  if (trimmed.includes("pandavideo") || trimmed.includes("vturb") || trimmed.includes("/embed") || trimmed.includes("player.")) {
    return trimmed;
  }

  return null;
}

export function VideoPlayer({
  cover,
  title,
  duration,
  videoUrl,
  onAutoComplete,
  onDurationDetected,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true); // Inicia mutado para garantir autoplay sem bloqueio do navegador
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentDuration, setCurrentDuration] = useState(duration || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (duration) {
      setCurrentDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    if (videoUrl && (!currentDuration || currentDuration === "10:00" || currentDuration === "--:--")) {
      detectVideoDuration(videoUrl).then((res) => {
        if (res.duration) {
          setCurrentDuration(res.duration);
          if (onDurationDetected) {
            onDurationDetected(res.duration);
          }
        }
      });
    }
  }, [videoUrl, currentDuration, onDurationDetected]);

  // Parse duration string "MM:SS" into seconds
  const totalSeconds = (() => {
    const raw = currentDuration || "05:00";
    const parts = raw.split(":").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
      return parts[0]! * 60 + parts[1]!;
    }
    if (parts.length === 3 && !isNaN(parts[0]!) && !isNaN(parts[1]!) && !isNaN(parts[2]!)) {
      return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
    }
    return 300; // 5 min fallback
  })();

  useEffect(() => {
    // Reset playback when video title/duration changes
    setIsPlaying(false);
    setCurrentTime(0);
  }, [title, duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalSeconds) {
            setIsPlaying(false);
            onAutoComplete?.();
            return totalSeconds;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, speed, totalSeconds, onAutoComplete]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = totalSeconds > 0 ? (currentTime / totalSeconds) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(Math.floor(newPct * totalSeconds));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]!);
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = Boolean(
    videoUrl &&
      (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(videoUrl.trim()) ||
        videoUrl.includes("/storage/v1/object/public/") ||
        videoUrl.startsWith("blob:") ||
        videoUrl.startsWith("data:video/"))
  );

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl select-none"
    >
      {isPlaying && embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : isPlaying && isDirectVideo ? (
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          controls
          playsInline
          muted={isMuted}
          className="absolute inset-0 h-full w-full object-contain bg-black"
          onError={() => {
            console.warn("Erro ao reproduzir stream direto de vídeo na aula.");
          }}
          onEnded={() => {
            setIsPlaying(false);
            onAutoComplete?.();
          }}
        />
      ) : (
        <>
          {/* Background Poster / Visual Player */}
          {cover ? (
            <img
              src={cover}
              alt={title}
              className={`h-full w-full object-cover transition-all duration-700 ${
                isPlaying ? "scale-105 opacity-60 filter contrast-125" : "opacity-90"
              }`}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
              <span className="font-display text-2xl font-bold tracking-widest text-gold/30">VELESSA</span>
            </div>
          )}

          {/* Ambient gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

          {/* Center Big Play/Pause Button */}
          {!isPlaying && (
            <div className="absolute inset-0 grid place-items-center">
              <button
                onClick={togglePlay}
                aria-label="Reproduzir vídeo da aula"
                className="grid h-20 w-20 place-items-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold transition hover:scale-110 active:scale-95"
              >
                <Play className="ml-1 h-8 w-8 fill-current" />
              </button>
            </div>
          )}

          {/* Top Title Overlay */}
          <div className="absolute left-6 top-6 right-6 flex items-center justify-between text-white/90">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10">
              Academia Vellessa · HD 1080p
            </span>
            {isPlaying && (
              <span className="flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold backdrop-blur-md border border-gold/30">
                <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                Reproduzindo
              </span>
            )}
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
            {/* Scrubber / Progress Bar */}
            <div
              onClick={handleSeek}
              className="relative h-2 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-3"
              title="Clique para avançar/retroceder"
            >
              <div
                className="h-full rounded-full bg-gold-gradient transition-all"
                style={{ width: `${progressPct}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 h-3.5 w-3.5 rounded-full bg-white shadow-md transition opacity-0 group-hover:opacity-100"
                style={{ left: `${progressPct}%` }}
              />
            </div>

            {/* Action Controls */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 transition text-white"
                  aria-label={isPlaying ? "Pausar" : "Reproduzir"}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                </button>

                <button
                  onClick={() => setCurrentTime(0)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 transition text-white"
                  title="Reiniciar aula"
                  aria-label="Reiniciar aula"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 transition text-white"
                  aria-label={isMuted ? "Ativar som" : "Desativar som"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <span className="text-xs font-mono text-white/80">
                  {formatSeconds(currentTime)} / {currentDuration || duration || "--:--"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={cycleSpeed}
                  className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold hover:bg-white/25 transition"
                  title="Velocidade de reprodução"
                >
                  {speed}x
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/25 transition text-white"
                  aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Utilitário de detecção automática de metadados e duração de vídeos
 * Suporta YouTube (padrão, unlisted e shorts), vídeos diretos (MP4/WebM) e Vimeo.
 */

// Declaração global para YouTube IFrame API
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytScriptLoading = false;
let ytReadyPromise: Promise<void> | null = null;

function ensureYouTubeApiReady(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  if (ytReadyPromise) {
    return ytReadyPromise;
  }

  ytReadyPromise = new Promise((resolve) => {
    const existingScript = document.getElementById("youtube-iframe-api-script");
    if (!existingScript && !ytScriptLoading) {
      ytScriptLoading = true;
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) previousReady();
      resolve();
    };

    // Fallback de polling caso o script já tenha carregado antes do hook
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 150);

    // Timeout de segurança (5s)
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });

  return ytReadyPromise;
}

export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match && match[1] ? match[1] : null;
}

export function formatSecondsToDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "--:--";
  const totalSecs = Math.round(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Detecta a duração real de um vídeo do YouTube em segundo plano
 */
async function detectYouTubeDuration(videoId: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    await ensureYouTubeApiReady();
    if (!window.YT || !window.YT.Player) return null;

    return new Promise((resolve) => {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.width = "1px";
      container.style.height = "1px";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);

      let player: any = null;
      let hasResolved = false;

      const cleanup = () => {
        if (hasResolved) return;
        hasResolved = true;
        try {
          if (player && typeof player.destroy === "function") {
            player.destroy();
          }
        } catch {}
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      };

      // Timeout máximo de 4.5s para não travar a UI
      const timer = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 4500);

      try {
        player = new window.YT.Player(container, {
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            rel: 0,
            disablekb: 1,
            fs: 0,
          },
          events: {
            onReady: (event: any) => {
              clearTimeout(timer);
              try {
                const durationSecs = event.target.getDuration();
                cleanup();
                if (durationSecs && durationSecs > 0) {
                  resolve(formatSecondsToDuration(durationSecs));
                } else {
                  resolve(null);
                }
              } catch {
                cleanup();
                resolve(null);
              }
            },
            onError: () => {
              clearTimeout(timer);
              cleanup();
              resolve(null);
            },
          },
        });
      } catch {
        clearTimeout(timer);
        cleanup();
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Detecta a duração de vídeo direto (MP4, WebM)
 */
async function detectDirectVideoDuration(url: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;

    const timer = setTimeout(() => {
      video.src = "";
      resolve(null);
    }, 4000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const dur = video.duration;
      video.src = "";
      if (dur && !isNaN(dur) && dur > 0) {
        resolve(formatSecondsToDuration(dur));
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      video.src = "";
      resolve(null);
    };
  });
}

/**
 * Função principal: recebe uma URL qualquer e tenta calcular a duração real
 */
export async function detectVideoDuration(url: string): Promise<{
  duration: string | null;
  platform: "YouTube" | "Panda / VTurb" | "Vimeo" | "MP4 Direto" | "Outro";
}> {
  if (!url || !url.trim()) {
    return { duration: null, platform: "Outro" };
  }

  const trimmed = url.trim();
  const ytId = extractYouTubeId(trimmed);

  if (ytId) {
    const duration = await detectYouTubeDuration(ytId);
    return { duration, platform: "YouTube" };
  }

  if (trimmed.includes("pandavideo") || trimmed.includes("vturb")) {
    return { duration: null, platform: "Panda / VTurb" };
  }

  if (trimmed.includes("vimeo.com")) {
    return { duration: null, platform: "Vimeo" };
  }

  if (trimmed.match(/\.(mp4|webm|mov)($|\?)/i)) {
    const duration = await detectDirectVideoDuration(trimmed);
    return { duration, platform: "MP4 Direto" };
  }

  return { duration: null, platform: "Outro" };
}

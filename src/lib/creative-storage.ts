import { supabase, isSupabaseConfigured } from "./supabase";
import {
  storeRawFile,
  getRawFile,
  deleteRawFile,
  deleteRawFiles,
  generateImageThumbnail,
  generateVideoThumbnail,
} from "./file-storage";
import { type Creative } from "@/data/content";

const BUCKET_NAME = "criativos";

export interface CreativeUploadResult {
  fileUrl: string;
  storageType: "supabase" | "indexeddb";
  storagePath?: string;
  isCloud: boolean;
}

/**
 * Converte DataURL base64 para Blob
 */
function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

/**
 * Faz upload do arquivo do criativo.
 * 1. Tenta enviar para o Supabase Storage (bucket "criativos").
 * 2. Se o bucket não existir, erro de rede ou Supabase não configurado, faz fallback transparente
 *    para o IndexedDB do navegador (que suporta dezenas de GB sem estourar o localStorage).
 */
export async function uploadCreativeFile(
  id: string,
  file: File
): Promise<CreativeUploadResult> {
  // Tentativa 1: Supabase Storage
  if (isSupabaseConfigured && supabase) {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `files/${id}_${cleanName}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (!error && data) {
        const { data: pubData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(path);

        return {
          fileUrl: pubData.publicUrl,
          storageType: "supabase",
          storagePath: path,
          isCloud: true,
        };
      } else if (error) {
        console.warn(
          `[CreativeStorage] Falha no Supabase Storage (${error.message}). Utilizando fallback seguro IndexedDB.`
        );
      }
    } catch (err) {
      console.warn(
        "[CreativeStorage] Exceção ao conectar no Supabase Storage. Utilizando fallback IndexedDB:",
        err
      );
    }
  }

  // Tentativa 2: IndexedDB nativo (alta capacidade local, zero consumo de localStorage)
  await storeRawFile(id, file);
  return {
    fileUrl: `indexeddb://${id}`,
    storageType: "indexeddb",
    isCloud: false,
  };
}

/**
 * Gera miniatura ultra-leve para a galeria e salva na nuvem ou como string leve (15KB).
 */
export async function processCreativeThumbnail(
  id: string,
  file: File
): Promise<string> {
  let thumbDataUrl: string | null = null;

  try {
    if (file.type.startsWith("video/")) {
      thumbDataUrl = await generateVideoThumbnail(file);
    } else if (file.type.startsWith("image/")) {
      thumbDataUrl = await generateImageThumbnail(file, 400, 400);
    }
  } catch (err) {
    console.warn("[CreativeStorage] Erro ao extrair thumbnail:", err);
  }

  if (!thumbDataUrl) return "";

  // Tenta persistir a miniatura no Supabase se disponível
  if (isSupabaseConfigured && supabase) {
    try {
      const blob = dataUrlToBlob(thumbDataUrl);
      if (blob) {
        const path = `thumbs/${id}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, blob, {
            contentType: "image/jpeg",
            cacheControl: "86400",
            upsert: true,
          });

        if (!error) {
          const { data: pubData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);
          return pubData.publicUrl;
        }
      }
    } catch (e) {
      // Ignora e usa a dataUrl de 15KB
    }
  }

  return thumbDataUrl;
}

/**
 * Envia um Blob ou File bruto para o bucket 'criativos' do Supabase Storage.
 * Retorna a URL pública CDN ou null se falhar.
 */
export async function uploadCreativeToSupabase(
  id: string,
  fileOrBlob: Blob | File,
  originalName?: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const rawExt = fileOrBlob.type.split("/")[1] || (fileOrBlob.type.includes("video") ? "mp4" : "jpg");
    const cleanExt = rawExt === "jpeg" ? "jpg" : rawExt.replace(/[^a-zA-Z0-9]/g, "");
    const cleanName = (originalName || `${id}.${cleanExt}`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `files/${id}_${cleanName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, fileOrBlob, {
        cacheControl: "86400",
        upsert: true,
        contentType: fileOrBlob.type || (cleanExt === "mp4" ? "video/mp4" : "image/jpeg"),
      });

    if (error) {
      console.warn(`[CreativeStorage] Falha ao enviar para Supabase Storage (${error.message})`);
      return null;
    }

    const { data: pubData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return pubData.publicUrl || null;
  } catch (err) {
    console.error("[CreativeStorage] Erro no upload para Supabase:", err);
    return null;
  }
}

/**
 * Detecta se uma URL externa é de serviço de vídeo embutido (Google Drive, YouTube, Vimeo, Loom, Panda)
 * e retorna a URL adequada para renderização em iframe, ou null se não for embed.
 */
export function getEmbedVideoUrl(url?: string): string | null {
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

/**
 * Detecta de forma abrangente e confiável se um criativo é de formato de vídeo.
 */
export function isCreativeVideo(creative: Creative): boolean {
  if (!creative) return false;
  if (creative.type === "Reels") return true;
  if (creative.format && /vídeo|video|reels/i.test(creative.format)) return true;
  if (creative.fileType && creative.fileType.startsWith("video/")) return true;
  if (creative.fileUrl && /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(creative.fileUrl.trim())) return true;
  if (creative.fileUrl && Boolean(getEmbedVideoUrl(creative.fileUrl))) return true;
  if (creative.externalDownloadUrl && (Boolean(getEmbedVideoUrl(creative.externalDownloadUrl)) || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(creative.externalDownloadUrl.trim()))) return true;
  if (creative.title && /\.(mp4|webm|mov|m4v|ogg)$/i.test(creative.title.trim())) return true;
  return false;
}

/**
 * Resolve o link para download direto do arquivo pelo afiliado ou admin.
 */
export async function resolveCreativeDownload(
  creative: Creative
): Promise<{
  url: string;
  fileName: string;
  isBlobUrl?: boolean;
  isVideo?: boolean;
  isEmbed?: boolean;
  embedUrl?: string | null;
} | null> {
  const isVideo = isCreativeVideo(creative);

  const sanitizeName = (title: string, ext = "bin") => {
    return `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${ext}`;
  };

  const getExtension = () => {
    if (creative.fileType) {
      const parts = creative.fileType.split("/");
      if (parts[1]) {
        const ext = parts[1].toLowerCase().replace(/[^a-z0-9]/g, "");
        if (ext === "jpeg") return "jpg";
        return ext;
      }
    }
    if (isVideo) return "mp4";
    return "jpg";
  };

  // 1. Link externo (Google Drive, Canva, Dropbox, etc.)
  if (creative.externalDownloadUrl) {
    const embed = getEmbedVideoUrl(creative.externalDownloadUrl);
    return {
      url: creative.externalDownloadUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
      isVideo: isVideo || Boolean(embed),
      isEmbed: Boolean(embed),
      embedUrl: embed,
    };
  }

  // 2. Arquivo na Nuvem (Supabase CDN ou URL pública)
  if (creative.fileUrl && (creative.fileUrl.startsWith("http://") || creative.fileUrl.startsWith("https://"))) {
    const embed = getEmbedVideoUrl(creative.fileUrl);
    return {
      url: creative.fileUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
      isVideo: isVideo || Boolean(embed),
      isEmbed: Boolean(embed),
      embedUrl: embed,
    };
  }

  // 3. Arquivo local no IndexedDB (busca por indexeddb:// ou fallback pelo id do criativo)
  const isIndexedDb = creative.fileUrl?.startsWith("indexeddb://");
  const rawId = isIndexedDb ? creative.fileUrl!.replace("indexeddb://", "") : creative.id;
  try {
    const rawBlob = await getRawFile(rawId);
    if (rawBlob) {
      // Garante tipo MIME de vídeo se for vídeo sem header ou com tipo genérico
      let finalBlob = rawBlob;
      if (isVideo && (!rawBlob.type || !rawBlob.type.startsWith("video/"))) {
        finalBlob = new Blob([rawBlob], { type: "video/mp4" });
      }
      const blobUrl = URL.createObjectURL(finalBlob);
      let detectedExt = getExtension();
      if (finalBlob.type?.startsWith("video/")) {
        detectedExt = finalBlob.type.split("/")[1] || "mp4";
      } else if (finalBlob.type?.startsWith("image/")) {
        detectedExt = finalBlob.type.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
      }
      return {
        url: blobUrl,
        fileName: sanitizeName(creative.title, detectedExt),
        isBlobUrl: true,
        isVideo: true,
        isEmbed: false,
      };
    }
  } catch (err) {
    console.error("[CreativeStorage] Erro ao recuperar arquivo do IndexedDB:", err);
  }

  // 4. Arquivo em base64 legado
  if (creative.fileUrl && creative.fileUrl.startsWith("data:")) {
    return {
      url: creative.fileUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
      isVideo,
      isEmbed: false,
    };
  }

  // 5. Fallback para imagem APENAS SE NÃO FOR VÍDEO!
  // Se for um criativo de vídeo, NUNCA entregue uma imagem JPEG fingindo ser vídeo!
  if (!isVideo && creative.image) {
    return {
      url: creative.image,
      fileName: sanitizeName(creative.title, "jpg"),
      isBlobUrl: false,
      isVideo: false,
      isEmbed: false,
    };
  }

  return null;
}

/**
 * Remove o arquivo do Supabase Storage e do IndexedDB ao excluir o criativo.
 */
export async function deleteCreativeAssets(creative: Creative): Promise<void> {
  // Limpa Supabase
  if (creative.storagePath && isSupabaseConfigured && supabase) {
    try {
      await supabase.storage.from(BUCKET_NAME).remove([creative.storagePath]);
    } catch (err) {
      console.warn("[CreativeStorage] Falha ao deletar arquivo do Supabase:", err);
    }
  }

  // Limpa IndexedDB
  try {
    await deleteRawFile(creative.id);
  } catch {}
}

/**
 * Remove múltiplos arquivos em lote.
 */
export async function deleteBatchCreativeAssets(creatives: Creative[]): Promise<void> {
  const pathsToDelete: string[] = [];
  const idsToDelete: string[] = [];

  for (const c of creatives) {
    if (c.storagePath) pathsToDelete.push(c.storagePath);
    idsToDelete.push(c.id);
  }

  if (pathsToDelete.length > 0 && isSupabaseConfigured && supabase) {
    try {
      await supabase.storage.from(BUCKET_NAME).remove(pathsToDelete);
    } catch (err) {
      console.warn("[CreativeStorage] Falha ao deletar arquivos em lote do Supabase:", err);
    }
  }

  if (idsToDelete.length > 0) {
    try {
      await deleteRawFiles(idsToDelete);
    } catch {}
  }
}

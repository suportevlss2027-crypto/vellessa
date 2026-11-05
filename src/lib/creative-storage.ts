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
 * Resolve o link para download direto do arquivo pelo afiliado ou admin.
 */
export async function resolveCreativeDownload(
  creative: Creative
): Promise<{ url: string; fileName: string; isBlobUrl?: boolean } | null> {
  const sanitizeName = (title: string, ext = "bin") => {
    return `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${ext}`;
  };

  const getExtension = () => {
    if (creative.fileType) {
      const parts = creative.fileType.split("/");
      if (parts[1]) return parts[1];
    }
    return "jpg";
  };

  // 1. Link externo (Google Drive, Canva, Dropbox, etc.)
  if (creative.externalDownloadUrl) {
    return {
      url: creative.externalDownloadUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
    };
  }

  // 2. Arquivo na Nuvem (Supabase CDN ou URL pública)
  if (creative.fileUrl && (creative.fileUrl.startsWith("http://") || creative.fileUrl.startsWith("https://"))) {
    return {
      url: creative.fileUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
    };
  }

  // 3. Arquivo local no IndexedDB
  if (creative.fileUrl && creative.fileUrl.startsWith("indexeddb://")) {
    const rawId = creative.fileUrl.replace("indexeddb://", "") || creative.id;
    try {
      const blob = await getRawFile(rawId);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        return {
          url: blobUrl,
          fileName: sanitizeName(creative.title, getExtension()),
          isBlobUrl: true,
        };
      }
    } catch (err) {
      console.error("[CreativeStorage] Erro ao recuperar arquivo do IndexedDB:", err);
    }
  }

  // 4. Arquivo em base64 legado
  if (creative.fileUrl && creative.fileUrl.startsWith("data:")) {
    return {
      url: creative.fileUrl,
      fileName: sanitizeName(creative.title, getExtension()),
      isBlobUrl: false,
    };
  }

  // 5. Fallback para imagem da capa se não houver arquivo anexado
  if (creative.image) {
    return {
      url: creative.image,
      fileName: sanitizeName(creative.title, "jpg"),
      isBlobUrl: false,
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

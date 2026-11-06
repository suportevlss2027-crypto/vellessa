// Gerenciador nativo de arquivos brutos via IndexedDB e Supabase Storage para materiais da plataforma Vellessa
import { supabase, isSupabaseConfigured } from "./supabase";

const DB_NAME = "vellessa_materials_db";
const STORE_NAME = "materials_files";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB não está disponível neste navegador."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeRawFile(id: string, file: Blob | File): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error("Erro ao salvar arquivo bruto no IndexedDB:", error);
    throw error;
  }
}

export async function getRawFile(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error("Erro ao recuperar arquivo do IndexedDB:", error);
    return null;
  }
}

export async function deleteRawFile(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error("Erro ao excluir arquivo do IndexedDB:", error);
  }
}

export async function deleteRawFiles(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      ids.forEach((id) => {
        store.delete(id);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Erro ao excluir múltiplos arquivos do IndexedDB:", error);
  }
}

/**
 * Envia arquivo bruto para o bucket "materiais" no Supabase Storage.
 * Retorna a URL pública de acesso CDN ou null em caso de falha.
 */
export async function uploadMaterialToSupabase(
  id: string,
  file: Blob | File,
  originalName?: string
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const fileName = originalName || (file instanceof File ? file.name : `material_${id}`);
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `files/${id}_${cleanName}`;

    const { data, error } = await supabase.storage
      .from("materiais")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (!error && data) {
      const { data: pubData } = supabase.storage
        .from("materiais")
        .getPublicUrl(path);

      return pubData.publicUrl;
    } else if (error) {
      console.warn(`[FileStorage] Supabase storage upload warning (${error.message})`);
    }
  } catch (err) {
    console.warn("[FileStorage] Exceção ao enviar para Supabase Storage:", err);
  }
  return null;
}

/**
 * Remove arquivo do bucket "materiais" no Supabase Storage caso exista.
 */
export async function deleteMaterialFromSupabase(paths: string[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !paths || paths.length === 0) return;
  try {
    await supabase.storage.from("materiais").remove(paths);
  } catch (err) {
    console.warn("[FileStorage] Falha ao remover arquivos do Supabase Storage:", err);
  }
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val.toString().replace(".", ",")} ${sizes[i]}`;
}

/**
 * Gera uma miniatura leve (dataURL) para imagens usando Canvas API.
 */
export async function generateImageThumbnail(file: File | Blob, maxWidth = 320, maxHeight = 320): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve("");
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        resolve(dataUrl);
      } catch {
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
    img.src = url;
  });
}

/**
 * Gera uma miniatura leve do primeiro frame de um vídeo HTML5.
 */
export async function generateVideoThumbnail(file: File | Blob): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    let hasResolved = false;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    }, 4000);

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration > 0 ? video.duration / 4 : 0.5);
    };

    video.onseeked = () => {
      if (hasResolved) return;
      hasResolved = true;
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        const maxW = 320;
        const maxH = 320;
        let w = video.videoWidth || 320;
        let h = video.videoHeight || 180;
        if (w > h) {
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
        } else {
          if (h > maxH) {
            w = Math.round((w * maxH) / h);
            h = maxH;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          try {
            const dataUrl = canvas.toDataURL("image/webp", 0.75);
            cleanup();
            resolve(dataUrl);
            return;
          } catch {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
            cleanup();
            resolve(dataUrl);
            return;
          }
        }
      } catch (e) {
        console.warn("Falha ao gerar frame de vídeo:", e);
      }
      cleanup();
      resolve(null);
    };

    video.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve(null);
      }
    };

    video.src = url;
  });
}

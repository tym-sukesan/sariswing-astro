import { supabase } from "../supabase";

/** Storage パス先頭（news / schedule / discography） */
export type ImageUploadPrefix = "news" | "schedule" | "discography";

export const IMAGE_UPLOAD_BUCKET =
  (import.meta.env.PUBLIC_STORAGE_BUCKET as string | undefined)?.trim() || "images";

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const IMAGE_MAX_LONG_EDGE = 1600;
export const IMAGE_ENCODE_QUALITY = 0.82;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

let webpEncodeSupported: boolean | null = null;

function extensionFromFile(file: File) {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".jpeg")) return ".jpg";
  if (lower.endsWith(".jpg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";

  return null;
}

export function validateImageUploadMime(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("JPG / PNG / WebP のみアップロードできます。");
  }

  const ext = extensionFromFile(file);
  if (!ext) {
    throw new Error("対応していないファイル形式です。");
  }

  return ext;
}

function computeTargetSize(width: number, height: number, maxEdge: number) {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function detectWebPEncodeSupport() {
  if (webpEncodeSupported !== null) return webpEncodeSupported;
  if (typeof document === "undefined") {
    webpEncodeSupported = false;
    return false;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  webpEncodeSupported = await new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(Boolean(blob && blob.type === "image/webp")),
      "image/webp",
      IMAGE_ENCODE_QUALITY
    );
  });

  return webpEncodeSupported;
}

async function imageHasTransparency(bitmap: ImageBitmap) {
  const sampleWidth = Math.min(bitmap.width, 256);
  const sampleHeight = Math.min(bitmap.height, 256);
  const canvas = document.createElement("canvas");
  canvas.width = sampleWidth;
  canvas.height = sampleHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(bitmap, 0, 0, sampleWidth, sampleHeight);
  const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight);

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }

  return false;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("画像の変換に失敗しました。"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function encodeCanvas(canvas: HTMLCanvasElement, mimeType: string, hasAlpha: boolean) {
  const qualitySteps =
    mimeType === "image/png"
      ? [undefined]
      : [IMAGE_ENCODE_QUALITY, 0.72, 0.62, 0.52, 0.42];

  let lastBlob: Blob | null = null;

  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(canvas, mimeType, quality);
    lastBlob = blob;
    if (blob.size <= IMAGE_UPLOAD_MAX_BYTES) {
      return blob;
    }
  }

  if (lastBlob && lastBlob.size > IMAGE_UPLOAD_MAX_BYTES) {
    const label = hasAlpha ? "透過PNG" : "画像";
    throw new Error(
      `変換後もファイルサイズが 2MB を超えています（${label}）。解像度の低い画像をお試しください。`
    );
  }

  throw new Error("画像の変換に失敗しました。");
}

function buildProcessedFile(blob: Blob, mimeType: string, extension: string, originalName: string) {
  const baseName = originalName.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}${extension}`, { type: mimeType });
}

/**
 * アップロード前にブラウザ側でリサイズ・圧縮
 */
export async function processImageForUpload(file: File) {
  validateImageUploadMime(file);

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = computeTargetSize(
      bitmap.width,
      bitmap.height,
      IMAGE_MAX_LONG_EDGE
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("画像の処理に失敗しました。");
    }

    const hasAlpha =
      file.type === "image/png" ? await imageHasTransparency(bitmap) : false;
    const webpOk = await detectWebPEncodeSupport();

    let mimeType: string;
    let extension: string;

    if (webpOk) {
      mimeType = "image/webp";
      extension = ".webp";
      ctx.drawImage(bitmap, 0, 0, width, height);
    } else if (hasAlpha) {
      mimeType = "image/png";
      extension = ".png";
      ctx.drawImage(bitmap, 0, 0, width, height);
    } else {
      mimeType = "image/jpeg";
      extension = ".jpg";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
    }

    const blob = await encodeCanvas(canvas, mimeType, hasAlpha);
    const processedFile = buildProcessedFile(blob, mimeType, extension, file.name);

    return { file: processedFile, extension, mimeType };
  } finally {
    bitmap.close();
  }
}

export function buildImageStoragePath(prefix: ImageUploadPrefix, extension: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

  return `${prefix}/${year}-${month}/${random}${extension}`;
}

export function getPublicImageUrl(storagePath: string) {
  const { data } = supabase.storage.from(IMAGE_UPLOAD_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadAdminImage(file: File, prefix: ImageUploadPrefix) {
  const { file: processedFile, extension, mimeType } = await processImageForUpload(file);
  const storagePath = buildImageStoragePath(prefix, extension);

  const { error } = await supabase.storage
    .from(IMAGE_UPLOAD_BUCKET)
    .upload(storagePath, processedFile, {
      cacheControl: "31536000",
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`アップロードに失敗しました: ${error.message}`);
  }

  return getPublicImageUrl(storagePath);
}

/** @deprecated 変換前の拡張子検証のみ。アップロードは processImageForUpload を利用 */
export function validateImageUploadFile(file: File) {
  return validateImageUploadMime(file);
}

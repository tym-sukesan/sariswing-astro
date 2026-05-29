import { supabase } from "../supabase";

/** Storage パス先頭（news / schedule / discography） */
export type ImageUploadPrefix = "news" | "schedule" | "discography";

export const IMAGE_UPLOAD_BUCKET =
  (import.meta.env.PUBLIC_STORAGE_BUCKET as string | undefined)?.trim() || "images";

export const IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

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

export function validateImageUploadFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("JPG / PNG / WebP のみアップロードできます。");
  }

  const ext = extensionFromFile(file);
  if (!ext) {
    throw new Error("対応していないファイル形式です。");
  }

  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error("ファイルサイズは 2MB 以下にしてください。");
  }

  return ext;
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
  const extension = validateImageUploadFile(file);
  const storagePath = buildImageStoragePath(prefix, extension);

  const { error } = await supabase.storage.from(IMAGE_UPLOAD_BUCKET).upload(storagePath, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`アップロードに失敗しました: ${error.message}`);
  }

  return getPublicImageUrl(storagePath);
}

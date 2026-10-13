/**
 * Gosaki Discography cover upload.
 * Optimizes in the browser with Canvas, then writes a new WebP object under
 * site-assets/gosaki-piano/discography/ with the logged-in JWT.
 * Uses the logged-in user JWT only. Does not delete objects or write cover_image_url.
 */

export const GOSAKI_DISCOGRAPHY_COVER_BUCKET = "site-assets";
export const GOSAKI_DISCOGRAPHY_COVER_PATH_PREFIX = "gosaki-piano/discography/";
export const GOSAKI_DISCOGRAPHY_COVER_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const GOSAKI_DISCOGRAPHY_COVER_PRODUCTION_PROJECT_REF_STOP = "vsbvndwuajjhnzpohghh";
export const GOSAKI_DISCOGRAPHY_COVER_RAW_MAX_BYTES = 12 * 1024 * 1024;
export const GOSAKI_DISCOGRAPHY_COVER_MAX_EDGE = 1200;
export const GOSAKI_DISCOGRAPHY_COVER_WEBP_QUALITY = 0.85;
export const GOSAKI_DISCOGRAPHY_COVER_WEBP_QUALITY_FLOOR = 0.75;
export const GOSAKI_DISCOGRAPHY_COVER_OUTPUT_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_INPUT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GosakiDiscographyCoverPhase = "optimize" | "upload";

export type GosakiDiscographyCoverPhaseInfo = {
  beforeBytes: number;
  afterBytes?: number;
};

type CoverBitmap = {
  width: number;
  height: number;
  close?: () => void;
};

export type OptimizedDiscographyCover = {
  file: File;
  extension: ".webp";
  mimeType: "image/webp";
  beforeBytes: number;
  afterBytes: number;
};

const ALLOWED_EXTENSIONS = new Set([".jpg", ".png", ".webp"]);

export function sanitizeGosakiDiscographyCoverFolderId(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  if (!cleaned || cleaned === "." || cleaned === ".." || cleaned.includes("..")) {
    return "new";
  }
  return cleaned.slice(0, 80);
}

export function buildGosakiDiscographyCoverObjectPath(
  legacyId: string,
  extension: string,
  randomId?: string,
): string {
  const folder = sanitizeGosakiDiscographyCoverFolderId(legacyId);
  const ext = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("対応していないファイル形式です。");
  }
  const random = String(randomId ?? crypto.randomUUID().replace(/-/g, "").slice(0, 16))
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 32);
  if (random.length < 8) {
    throw new Error("画像の保存先が不正です。");
  }
  return `${GOSAKI_DISCOGRAPHY_COVER_PATH_PREFIX}${folder}/${random}${ext}`;
}

export function assertGosakiDiscographyCoverObjectPath(objectPath: string): string {
  const path = String(objectPath ?? "");
  if (
    !path.startsWith(GOSAKI_DISCOGRAPHY_COVER_PATH_PREFIX) ||
    path.includes("..") ||
    path.includes("//") ||
    path.includes("\\") ||
    path.startsWith("gosaki/discography/") ||
    path.includes("/cover.")
  ) {
    throw new Error("画像の保存先が不正です。");
  }
  const parts = path.split("/");
  if (parts.length !== 4 || parts[0] !== "gosaki-piano" || parts[1] !== "discography" || !parts[2] || !parts[3]) {
    throw new Error("画像の保存先が不正です。");
  }
  return path;
}

export function getGosakiDiscographyCoverPublicUrl(supabaseUrl: string, objectPath: string): string {
  const base = String(supabaseUrl ?? "").replace(/\/+$/, "");
  const safePath = assertGosakiDiscographyCoverObjectPath(objectPath);
  return `${base}/storage/v1/object/public/${GOSAKI_DISCOGRAPHY_COVER_BUCKET}/${safePath}`;
}

export function formatGosakiDiscographyCoverBytes(bytes: number): string {
  const size = Math.max(0, Math.round(bytes));
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  const mb = size / (1024 * 1024);
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)}MB`;
}

export function coverTargetSize(width: number, height: number, maxEdge = GOSAKI_DISCOGRAPHY_COVER_MAX_EDGE) {
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error("画像を読み込めませんでした。");
  }
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function assertCoverUploadInput(file: File) {
  if (!file || file.size <= 0) {
    throw new Error("ファイルを選択してください。");
  }
  if (file.size > GOSAKI_DISCOGRAPHY_COVER_RAW_MAX_BYTES) {
    throw new Error("ファイルサイズが大きすぎます。12MB以下の画像を選んでください。");
  }
  const type = String(file.type ?? "");
  if (ALLOWED_INPUT_TYPES.has(type)) return;
  const name = String(file.name ?? "").toLowerCase();
  const extensionOk =
    type === "" &&
    (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".webp"));
  if (!extensionOk) {
    throw new Error("JPG / PNG / WebP のみアップロードできます。");
  }
}

export function sniffCoverBytes(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function assertCoverFileSignature(file: File): Promise<void> {
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const sniffed = sniffCoverBytes(header);
  if (!sniffed) {
    throw new Error("画像ファイルの形式を確認できませんでした。");
  }
  const type = String(file.type ?? "");
  if (type && type !== sniffed) {
    throw new Error("ファイルの形式が内容と一致しません。");
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", quality);
  });
}

async function defaultDecodeCover(file: File): Promise<CoverBitmap> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("画像を読み込めませんでした。");
  }
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("画像を読み込めませんでした。");
  }
}

async function defaultEncodeCoverWebp(
  bitmap: CoverBitmap,
  size: { width: number; height: number },
  quality: number,
): Promise<Blob | null> {
  if (typeof document === "undefined") {
    throw new Error("画像を最適化できませんでした。");
  }
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を最適化できませんでした。");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, size.width, size.height);
  return canvasToBlob(canvas, quality);
}

export async function optimizeGosakiDiscographyCover(
  file: File,
  hooks?: {
    decode?: (file: File) => Promise<CoverBitmap>;
    encodeWebp?: (
      size: { width: number; height: number },
      quality: number,
      bitmap: CoverBitmap,
    ) => Promise<Blob | null>;
  },
): Promise<OptimizedDiscographyCover> {
  assertCoverUploadInput(file);
  await assertCoverFileSignature(file);
  const decode = hooks?.decode ?? defaultDecodeCover;
  let bitmap: CoverBitmap;
  try {
    bitmap = await decode(file);
  } catch (error) {
    if (error instanceof Error && error.message === "画像を読み込めませんでした。") throw error;
    throw new Error("画像を読み込めませんでした。");
  }
  try {
    const size = coverTargetSize(bitmap.width, bitmap.height);
    const encode =
      hooks?.encodeWebp ??
      ((nextSize: { width: number; height: number }, quality: number) =>
        defaultEncodeCoverWebp(bitmap, nextSize, quality));
    let blob = await encode(size, GOSAKI_DISCOGRAPHY_COVER_WEBP_QUALITY, bitmap);
    if (!blob || blob.type !== "image/webp") {
      throw new Error("このブラウザではWebPに変換できないため、アップロードを中止しました。");
    }
    if (blob.size > GOSAKI_DISCOGRAPHY_COVER_OUTPUT_MAX_BYTES) {
      blob = await encode(size, GOSAKI_DISCOGRAPHY_COVER_WEBP_QUALITY_FLOOR, bitmap);
      if (!blob || blob.type !== "image/webp") {
        throw new Error("このブラウザではWebPに変換できないため、アップロードを中止しました。");
      }
    }
    if (blob.size > GOSAKI_DISCOGRAPHY_COVER_OUTPUT_MAX_BYTES || blob.size <= 0) {
      throw new Error("最適化後も2MBを超えるため、アップロードを中止しました。");
    }
    return {
      file: new File([blob], "cover.webp", { type: "image/webp" }),
      extension: ".webp",
      mimeType: "image/webp",
      beforeBytes: file.size,
      afterBytes: blob.size,
    };
  } finally {
    bitmap.close?.();
  }
}

function assertSafeSupabaseUrl(supabaseUrl: string, productionStop: string) {
  const url = String(supabaseUrl ?? "").trim();
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("画像のアップロード先が不正です。");
  }
  if (url.includes(productionStop) || !url.includes(GOSAKI_DISCOGRAPHY_COVER_PROJECT_REF)) {
    throw new Error("画像のアップロード先が不正です。");
  }
  return url.replace(/\/+$/, "");
}

export async function uploadGosakiDiscographyCover(input: {
  file: File;
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  legacyId: string;
  productionProjectRefStop?: string;
  fetchImpl?: typeof fetch;
  onPhase?: (phase: GosakiDiscographyCoverPhase, info: GosakiDiscographyCoverPhaseInfo) => void;
  optimizeImpl?: (file: File) => Promise<{
    file: File;
    extension: string;
    mimeType: string;
    beforeBytes?: number;
    afterBytes?: number;
  }>;
}): Promise<string> {
  const productionStop =
    input.productionProjectRefStop || GOSAKI_DISCOGRAPHY_COVER_PRODUCTION_PROJECT_REF_STOP;
  const supabaseUrl = assertSafeSupabaseUrl(input.supabaseUrl, productionStop);
  const anonKey = String(input.anonKey ?? "").trim();
  const accessToken = String(input.accessToken ?? "").trim();
  if (!anonKey || !accessToken) {
    throw new Error("ログインが必要です。");
  }
  assertCoverUploadInput(input.file);
  await assertCoverFileSignature(input.file);

  input.onPhase?.("optimize", { beforeBytes: input.file.size });
  const processed = await (input.optimizeImpl ?? optimizeGosakiDiscographyCover)(input.file);
  if (
    processed.mimeType !== "image/webp" ||
    processed.extension !== ".webp" ||
    processed.file.type !== "image/webp"
  ) {
    throw new Error("このブラウザではWebPに変換できないため、アップロードを中止しました。");
  }
  const beforeBytes = processed.beforeBytes ?? input.file.size;
  const afterBytes = processed.afterBytes ?? processed.file.size;
  input.onPhase?.("upload", { beforeBytes, afterBytes });

  const processedFile = processed.file;
  const mimeType = "image/webp";
  const objectPath = assertGosakiDiscographyCoverObjectPath(
    buildGosakiDiscographyCoverObjectPath(input.legacyId, ".webp"),
  );
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const endpoint = `${supabaseUrl}/storage/v1/object/${GOSAKI_DISCOGRAPHY_COVER_BUCKET}/${encodedPath}`;
  const fetchImpl = input.fetchImpl ?? fetch;

  let res: Response;
  try {
    res = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        "x-upsert": "false",
        "Cache-Control": "31536000",
        "Content-Type": mimeType,
      },
      body: processedFile,
    });
  } catch {
    throw new Error("通信に失敗しました。");
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("アップロードする権限がありません。");
  }
  if (!res.ok) {
    throw new Error(`アップロードに失敗しました (${res.status})`);
  }

  return getGosakiDiscographyCoverPublicUrl(supabaseUrl, objectPath);
}

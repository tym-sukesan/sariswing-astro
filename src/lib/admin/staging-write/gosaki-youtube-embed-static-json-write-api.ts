/**
 * G-10c1 — Shared Save API path + safe JSON response parsing.
 */

export const G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_API_PATH =
  "/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json";

export type G10cSaveApiJsonBody = {
  ok?: boolean;
  itemsAffected?: number;
  errorCode?: string;
  error?: string;
  errorMessage?: string;
  message?: string;
};

export type G10cSaveApiParseResult =
  | { ok: true; status: number; body: G10cSaveApiJsonBody }
  | {
      ok: false;
      status: number;
      errorCode: string;
      errorMessage: string;
      rawSnippet?: string;
    };

const NON_JSON_OPERATOR_MESSAGE =
  "保存APIからJSON以外の応答が返りました。API route / fetch path を確認してください。";

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function shortSnippet(text: string, max = 120): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export async function parseG10cSaveApiJsonResponse(
  response: Response,
): Promise<G10cSaveApiParseResult> {
  const status = response.status;
  const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      ok: false,
      status,
      errorCode: "empty_response",
      errorMessage: `${NON_JSON_OPERATOR_MESSAGE} (HTTP ${status}, empty body)`,
    };
  }

  const isJsonContentType =
    contentType.includes("application/json") || contentType.includes("+json");
  const isHtml = looksLikeHtml(rawText);

  if (isHtml || (!isJsonContentType && rawText.trim().startsWith("<"))) {
    return {
      ok: false,
      status,
      errorCode: "non_json_response",
      errorMessage: `${NON_JSON_OPERATOR_MESSAGE} (HTTP ${status})`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  let body: G10cSaveApiJsonBody;
  try {
    body = JSON.parse(rawText) as G10cSaveApiJsonBody;
  } catch {
    return {
      ok: false,
      status,
      errorCode: "invalid_json_response",
      errorMessage: `${NON_JSON_OPERATOR_MESSAGE} (HTTP ${status}, JSON parse failed)`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  if (!isJsonContentType) {
    return {
      ok: false,
      status,
      errorCode: "unexpected_content_type",
      errorMessage: `${NON_JSON_OPERATOR_MESSAGE} (HTTP ${status}, Content-Type: ${contentType || "missing"})`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  return { ok: true, status, body };
}

export function mapG10cSaveApiBodyToOutcome(
  parsed: G10cSaveApiParseResult,
): { ok: boolean; itemsAffected?: number; errorCode?: string; errorMessage?: string } {
  if (!parsed.ok) {
    const suffix = parsed.rawSnippet ? ` Snippet: ${parsed.rawSnippet}` : "";
    return {
      ok: false,
      errorCode: parsed.errorCode,
      errorMessage: `${parsed.errorMessage}${suffix}`,
    };
  }

  const body = parsed.body;
  if (!parsed.status || parsed.status >= 400 || body.ok !== true) {
    const errorCode = body.errorCode ?? body.error ?? "api_error";
    const errorMessage =
      body.errorMessage ??
      body.message ??
      `API error (HTTP ${parsed.status})`;
    return { ok: false, errorCode, errorMessage };
  }

  return { ok: true, itemsAffected: body.itemsAffected };
}

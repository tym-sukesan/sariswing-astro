/**
 * G-10h4a — About profile HTML static JSON write API helpers.
 */

export const G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_API_PATH =
  "/__admin-staging-shell/musician-basic/api/about-profile-html-static-json-write.json";

export type G10h4aDryRunApiJsonBody = {
  ok?: boolean;
  dryRun?: boolean;
  wouldWrite?: boolean;
  approvalId?: string;
  siteSlug?: string;
  blockId?: string;
  targetPath?: string;
  changedFields?: string[];
  oldLength?: number;
  newLength?: number;
  lengthDelta?: number;
  blocksAffected?: number;
  htmlSafety?: {
    ok?: boolean;
    errors?: string[];
    warnings?: string[];
  };
  guardErrors?: string[];
  saveAllowed?: boolean;
  saveReadiness?: string;
  errorCode?: string;
  error?: string;
  errorMessage?: string;
  message?: string;
};

export type G10h4aDryRunApiParseResult =
  | { ok: true; status: number; body: G10h4aDryRunApiJsonBody }
  | {
      ok: false;
      status: number;
      errorCode: string;
      errorMessage: string;
      rawSnippet?: string;
    };

const NON_JSON_OPERATOR_MESSAGE =
  "dry-run API から JSON 以外の応答が返りました。API route / fetch path を確認してください。";

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function shortSnippet(text: string, max = 120): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export async function parseG10h4aDryRunApiJsonResponse(
  response: Response,
): Promise<G10h4aDryRunApiParseResult> {
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

  let body: G10h4aDryRunApiJsonBody;
  try {
    body = JSON.parse(rawText) as G10h4aDryRunApiJsonBody;
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

export type G10h4bSaveApiJsonBody = {
  ok?: boolean;
  dryRun?: boolean;
  wouldWrite?: boolean;
  blocksAffected?: number;
  changedFields?: string[];
  configPath?: string;
  blockId?: string;
  errorCode?: string;
  error?: string;
  errorMessage?: string;
  message?: string;
};

export type G10h4bSaveApiParseResult =
  | { ok: true; status: number; body: G10h4bSaveApiJsonBody }
  | {
      ok: false;
      status: number;
      errorCode: string;
      errorMessage: string;
      rawSnippet?: string;
    };

const NON_JSON_SAVE_OPERATOR_MESSAGE =
  "保存APIからJSON以外の応答が返りました。API route / fetch path を確認してください。";

export async function parseG10h4bSaveApiJsonResponse(
  response: Response,
): Promise<G10h4bSaveApiParseResult> {
  const status = response.status;
  const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      ok: false,
      status,
      errorCode: "empty_response",
      errorMessage: `${NON_JSON_SAVE_OPERATOR_MESSAGE} (HTTP ${status}, empty body)`,
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
      errorMessage: `${NON_JSON_SAVE_OPERATOR_MESSAGE} (HTTP ${status})`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  let body: G10h4bSaveApiJsonBody;
  try {
    body = JSON.parse(rawText) as G10h4bSaveApiJsonBody;
  } catch {
    return {
      ok: false,
      status,
      errorCode: "invalid_json_response",
      errorMessage: `${NON_JSON_SAVE_OPERATOR_MESSAGE} (HTTP ${status}, JSON parse failed)`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  if (!isJsonContentType) {
    return {
      ok: false,
      status,
      errorCode: "unexpected_content_type",
      errorMessage: `${NON_JSON_SAVE_OPERATOR_MESSAGE} (HTTP ${status}, Content-Type: ${contentType || "missing"})`,
      rawSnippet: shortSnippet(rawText),
    };
  }

  return { ok: true, status, body };
}

export function mapG10h4bSaveApiBodyToOutcome(
  parsed: G10h4bSaveApiParseResult,
): {
  ok: boolean;
  blocksAffected?: number;
  changedFields?: string[];
  errorCode?: string;
  errorMessage?: string;
} {
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
      body.errorMessage ?? body.message ?? `API error (HTTP ${parsed.status})`;
    return { ok: false, errorCode, errorMessage };
  }

  return {
    ok: true,
    blocksAffected: body.blocksAffected,
    changedFields: body.changedFields,
  };
}

/**
 * Shared one-click Save UX helpers for Gosaki staging admin modules.
 *
 * Contract:
 * - client arm=false → Save button disabled; no dry-run / Save POST (user or programmatic)
 * - client arm=true  → one-click may run dry-run → Save; server arm may still reject
 * - server arm=false → Save POST still sent; UI shows stopped message; didWrite=false
 */

export const GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE =
  "現在、保存機能は停止しています";

export const GOSAKI_CLIENT_SAVE_DISARMED_REASON = "保存は現在無効です";

/** Client arm is the hard UI/programmatic gate for starting Save (and its internal dry-run). */
export function isClientSaveArmed(saveArmed: boolean | undefined | null): boolean {
  return saveArmed === true;
}

/**
 * Detect server-side Save arm rejection (403 / save_not_armed).
 * didWrite must remain false for these responses.
 */
export function isGosakiSaveNotArmedResponse(
  body: unknown,
  httpStatus?: number,
): boolean {
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const reasonCode = String(
    data.reasonCode ?? data.reason_code ?? data.saveReadiness ?? "",
  ).trim();
  if (/^(save_not_armed|not_armed)$/i.test(reasonCode)) return true;
  const hay = [
    reasonCode,
    String(data.message ?? ""),
    ...(Array.isArray(data.errors) ? data.errors.map(String) : []),
  ]
    .join(" ")
    .toLowerCase();
  if (/save_not_armed|save is not armed|not armed on server/.test(hay)) return true;
  if (httpStatus === 403 && /not_armed|not armed|save.*arm/.test(hay)) return true;
  return false;
}

/** Map Save HTTP/body to a short user-facing message (no tech jargon). */
export function userMessageForSaveFailure(
  body: unknown,
  httpStatus?: number,
  fallback = "保存に失敗しました",
): string {
  if (isGosakiSaveNotArmedResponse(body, httpStatus)) {
    return GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE;
  }
  return fallback;
}

/**
 * Pure one-click arm contract (for mock asserts without browser/HTTP).
 * Returns whether dry-run / Save POSTs may start from a Save click.
 */
export function evaluateOneClickSaveStartGate(input: {
  clientArmed: boolean;
  authenticated: boolean;
  dirty: boolean;
  saveInFlight: boolean;
  dryRunInFlight: boolean;
  indeterminateLocked?: boolean;
  /** Set after server save_not_armed until the operator edits the form again. */
  saveNotArmedLocked?: boolean;
}): { canStart: boolean; buttonEnabled: boolean; reason: string } {
  if (input.saveInFlight) {
    return { canStart: false, buttonEnabled: false, reason: "保存中…" };
  }
  if (input.dryRunInFlight) {
    return { canStart: false, buttonEnabled: false, reason: "確認中…" };
  }
  if (input.indeterminateLocked) {
    return {
      canStart: false,
      buttonEnabled: false,
      reason: "結果が確認できません。自動では再試行しません。",
    };
  }
  if (input.saveNotArmedLocked) {
    return {
      canStart: false,
      buttonEnabled: false,
      reason: GOSAKI_SAVE_FEATURE_STOPPED_USER_MESSAGE,
    };
  }
  if (!input.clientArmed) {
    return {
      canStart: false,
      buttonEnabled: false,
      reason: GOSAKI_CLIENT_SAVE_DISARMED_REASON,
    };
  }
  if (!input.authenticated) {
    return { canStart: false, buttonEnabled: false, reason: "ログインが必要です" };
  }
  if (!input.dirty) {
    return { canStart: false, buttonEnabled: false, reason: "変更がありません" };
  }
  return { canStart: true, buttonEnabled: true, reason: "未保存の変更があります" };
}

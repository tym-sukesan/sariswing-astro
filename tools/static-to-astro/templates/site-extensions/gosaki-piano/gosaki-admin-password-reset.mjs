/**
 * Gosaki CMS password reset helpers.
 * No network. Does not return tokens, passwords, or raw provider errors.
 * Implicit recovery links keep the tokens in the URL hash so another device can open them.
 */

export const GOSAKI_PRODUCTION_PASSWORD_RESET_REDIRECT =
  "https://www.gosaki-piano.com/admin/reset-password/";

export const GOSAKI_PASSWORD_MIN_LENGTH = 8;

/**
 * @param {string} hash
 * @returns {{ hasError: boolean, acceptable: boolean }}
 */
export function parseRecoveryHash(hash) {
  const raw = String(hash ?? "");
  const body = raw.startsWith("#") ? raw.slice(1) : raw;
  const params = new URLSearchParams(body);
  const hasError = Boolean(params.get("error"));
  const type = params.get("type") || "";
  const accessToken = params.get("access_token") || "";
  return {
    hasError,
    acceptable: !hasError && type === "recovery" && accessToken.length > 0,
  };
}

/**
 * @param {{ status?: number, message?: string, name?: string } | null | undefined} error
 * @returns {"ok" | "rate_limit" | "network" | "generic_success" | "generic_failure"}
 */
export function classifyResetEmailFailure(error) {
  if (!error) return "ok";
  const status = Number(error.status ?? 0);
  const message = String(error.message ?? "").toLowerCase();
  const name = String(error.name ?? "").toLowerCase();

  if (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("over_email_send_rate_limit") ||
    message.includes("email rate")
  ) {
    return "rate_limit";
  }

  if (
    name.includes("retryable") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  ) {
    return "network";
  }

  if (
    message.includes("user not found") ||
    message.includes("not registered") ||
    message.includes("signups not allowed") ||
    message.includes("unable to find")
  ) {
    return "generic_success";
  }

  return "generic_failure";
}

/**
 * @param {"ok" | "rate_limit" | "network" | "generic_success" | "generic_failure"} kind
 */
export function resetEmailStatusMessage(kind) {
  if (kind === "rate_limit") {
    return "送信回数の上限に達しました。しばらく待ってからもう一度お試しください。";
  }
  if (kind === "network") {
    return "通信に失敗しました。接続を確認してもう一度お試しください。";
  }
  if (kind === "generic_failure") {
    return "送信できませんでした。しばらく待ってからもう一度お試しください。";
  }
  return "送信手続きを受け付けました。メールアドレスが登録されている場合、再設定用のメールが届きます。";
}

/**
 * Result of Auth client initialize() while a recovery hash is open.
 * Elapsed time is not an input. A slow confirmation stays pending.
 *
 * @param {{ status?: number, message?: string, name?: string } | null | undefined} error
 * @returns {"invalid" | "network" | "unknown"}
 */
export function classifyRecoveryInitFailure(error) {
  if (!error) return "unknown";
  const status = Number(error.status ?? 0);
  const message = String(error.message ?? "").toLowerCase();
  const name = String(error.name ?? "").toLowerCase();

  if (
    name.includes("retryable") ||
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  ) {
    return "network";
  }

  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 422 ||
    name.includes("implicit") ||
    name.includes("invalid") ||
    message.includes("expired") ||
    message.includes("invalid") ||
    message.includes("jwt") ||
    message.includes("no session")
  ) {
    return "invalid";
  }

  return "unknown";
}

/**
 * @param {"network" | "unknown"} kind
 */
export function recoveryInitStatusMessage(kind) {
  if (kind === "network") {
    return "通信に失敗しました。接続を確認して、このページを再読み込みしてください。";
  }
  return "確認できませんでした。このページを再読み込みしてください。";
}

/**
 * @param {{
 *   recoveryEvent?: string,
 *   initSettled?: boolean,
 *   initError?: { status?: number, message?: string, name?: string } | null,
 * }} input
 * @returns {"pending" | "form" | "invalid" | "network" | "unknown"}
 */
export function resolveRecoveryUiState(input) {
  if (input?.recoveryEvent === "PASSWORD_RECOVERY") return "form";
  if (input?.initSettled !== true) return "pending";
  if (!input.initError) return "unknown";
  return classifyRecoveryInitFailure(input.initError);
}

/**
 * @param {string} message
 */
export function formatPasswordUpdateError(message) {
  const lower = String(message ?? "").toLowerCase();
  if (
    lower.includes("expired") ||
    lower.includes("otp") ||
    lower.includes("session") ||
    lower.includes("jwt")
  ) {
    return "リンクが無効か期限切れです。もう一度送信してください。";
  }
  if (lower.includes("same")) {
    return "以前と違うパスワードにしてください。";
  }
  if (lower.includes("weak") || lower.includes("at least") || lower.includes("should be")) {
    return "パスワードの条件を満たしていません。8文字以上で、推測されにくいものにしてください。";
  }
  return "保存できませんでした。もう一度お試しください。";
}

/**
 * CMS Core v2 — Schedule TBD CREATE oneshot save (Path B; staging only).
 * Phase: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-boundary-hardening
 *
 * Public write API: executeTbdCreateOneshotSave only.
 * Low-level INSERT is module-private (not exported).
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import {
  assertStaticToAstroCmsStagingSupabaseProject,
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
  SARISWING_PRODUCTION_PROJECT_REF,
  STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  collectScheduleNonDryRunPocAuthWarnings,
  formatMockRoleDisplay,
  isSignedInStagingAuth,
} from "./schedule-non-dry-run-poc-auth";
import { getScheduleWriteSafety } from "./schedule-write-guards";
import {
  getTbdCreateOneshotConfig,
  isTbdCreateClientArmExactTrue,
  type TbdCreateOneshotConfigOptions,
} from "./gosaki-schedule-tbd-create-oneshot-config";
import {
  assertReturnedTbdCreateOneshotRow,
  assertTbdCreateOneshotApprovalId,
  assertTbdCreateOneshotPayloadOnly,
  buildTbdCreateOneshotFixedInsertPayload,
  evaluateTbdCreateOneshotPreflightCounts,
  fingerprintTbdCreateOneshotPayload,
  TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS,
  TBD_CREATE_ONESHOT_LEGACY_ID,
  TBD_CREATE_ONESHOT_MONTH,
  TBD_CREATE_ONESHOT_PHASE,
  TBD_CREATE_ONESHOT_SOURCE_ROUTE,
  TBD_CREATE_ONESHOT_TITLE,
} from "./gosaki-schedule-tbd-create-oneshot-guards";
import {
  CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID,
  type ScheduleTbdCreateOneshotInsertPayload,
} from "./schedule-write-types";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";

export type TbdCreateOneshotTerminalState =
  | "idle"
  | "in_flight"
  | "succeeded"
  | "failed"
  | "ambiguous";

let oneshotTerminalState: TbdCreateOneshotTerminalState = "idle";
let oneshotNetworkCalls = 0;

export function getTbdCreateOneshotTerminalState(): TbdCreateOneshotTerminalState {
  return oneshotTerminalState;
}

export function resetTbdCreateOneshotTerminalStateForTests(): void {
  oneshotTerminalState = "idle";
  oneshotNetworkCalls = 0;
}

/** UI catch-all when outcome is unclear outside execute(). */
export function markTbdCreateOneshotAmbiguousFromUi(): void {
  oneshotTerminalState = "ambiguous";
}

export function getTbdCreateOneshotNetworkCallCountForTests(): number {
  return oneshotNetworkCalls;
}

export type TbdCreateOneshotSaveOutcome = {
  phase: typeof TBD_CREATE_ONESHOT_PHASE;
  ok: boolean;
  operation: "tbd-create-oneshot";
  actualWrite: boolean;
  approvalId: typeof CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID;
  insertedId?: string;
  legacy_id?: string;
  terminalState: TbdCreateOneshotTerminalState;
  guardReasons: string[];
  warnings: string[];
  errorCode?: string;
  errorMessage?: string;
  ambiguous?: boolean;
  rollbackHint?: string;
  afterRecord?: Record<string, unknown>;
  authEmail?: string;
  authStatus?: string;
  mockRole?: string;
  networkCalls: number;
};

export type TbdCreateOneshotPreflightClient = {
  countTotal: () => Promise<number>;
  countMio: () => Promise<number>;
  countTbd: () => Promise<number>;
  countTargetLegacyId: () => Promise<number>;
  /** Independent schema capability probe — SELECT date_status must succeed. */
  probeDateStatusColumn: () => Promise<{ ok: boolean; errorMessage?: string }>;
};

type InternalInsertClient = {
  from: (table: "schedules") => {
    insert: (payload: ScheduleTbdCreateOneshotInsertPayload) => {
      select: (columns?: string) => {
        single: () => Promise<{
          data: ScheduleDryRunSource | null;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
  };
};

/**
 * Test-only DI. Does NOT allow preflight skip.
 * Browser / UI must omit deps (uses real staging clients).
 */
export type TbdCreateOneshotSaveDeps = {
  insertClient?: InternalInsertClient;
  preflightClient?: TbdCreateOneshotPreflightClient;
  getAuth?: typeof getStagingAuthSessionDetails;
};

const NO_ROLLBACK_HINT = "No rollback required because actualWrite is false.";
const INSERT_SUCCESS_ROLLBACK_HINT =
  "Manual rollback: DELETE FROM public.schedules WHERE id = <inserted_id> (staging only).";

type InternalInsertResult =
  | {
      ok: true;
      insertedId: string;
      payload: ScheduleTbdCreateOneshotInsertPayload;
      afterSnapshot: ScheduleDryRunSource;
      rollbackHint: string;
    }
  | {
      ok: false;
      errorCode: string;
      errorMessage: string;
      ambiguous?: boolean;
      payload: ScheduleTbdCreateOneshotInsertPayload;
      rollbackHint: string;
    };

/**
 * Module-private INSERT. Not exported — callers must use executeTbdCreateOneshotSave.
 * Re-checks staging / production / arms / fixed payload immediately before .insert().
 */
async function insertTbdCreateOneshotScheduleWriteInternal(input: {
  client: InternalInsertClient;
  url: string;
  payload: ScheduleTbdCreateOneshotInsertPayload;
  approvalId: string;
  env: ImportMetaEnv | Record<string, unknown>;
  serverArmOkFromSsr: boolean;
}): Promise<InternalInsertResult> {
  const { client, url, payload, approvalId, env, serverArmOkFromSsr } = input;

  try {
    if (String(url).includes(SARISWING_PRODUCTION_PROJECT_REF)) {
      throw new Error("production project ref rejected at INSERT boundary");
    }
    assertStaticToAstroCmsStagingSupabaseProject(url);
    const allowlist = evaluateStagingProjectAllowlist(url);
    if (
      !allowlist.allowlistPassed ||
      allowlist.projectRef !== STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF
    ) {
      throw new Error(allowlist.errorMessage ?? "staging project ref mismatch at INSERT boundary");
    }
    const hostGate = evaluateSupabaseHostGate(url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed at INSERT boundary");
    }

    if (!isTbdCreateClientArmExactTrue(env)) {
      throw new Error("client arm must be exact true at INSERT boundary");
    }
    if (serverArmOkFromSsr !== true) {
      throw new Error("serverArmOkFromSsr must be true at INSERT boundary");
    }

    const config = getTbdCreateOneshotConfig(env, { serverArmOkFromSsr: true });
    if (config.tbdWriteEnabled !== true) {
      throw new Error("tbdWriteEnabled must be true at INSERT boundary");
    }
    if (config.writeDryRunExactFalse !== true) {
      throw new Error('PUBLIC_ADMIN_WRITE_DRY_RUN must be exact "false" at INSERT boundary');
    }
    if (!config.saveEnabled) {
      throw new Error(config.armFailureReason ?? "saveEnabled false at INSERT boundary");
    }

    assertTbdCreateOneshotApprovalId(approvalId);
    assertTbdCreateOneshotPayloadOnly(payload);
    if (payload.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
      throw new Error("site_slug mismatch at INSERT boundary");
    }
    if (payload.legacy_id !== TBD_CREATE_ONESHOT_LEGACY_ID) {
      throw new Error("legacy_id mismatch at INSERT boundary");
    }
    if (payload.title !== TBD_CREATE_ONESHOT_TITLE) {
      throw new Error("title mismatch at INSERT boundary");
    }
    if (payload.month !== TBD_CREATE_ONESHOT_MONTH) {
      throw new Error("month mismatch at INSERT boundary");
    }
    if (payload.source_route !== TBD_CREATE_ONESHOT_SOURCE_ROUTE) {
      throw new Error("source_route mismatch at INSERT boundary");
    }
    if (payload.date_status !== "tbd" || payload.date !== null || payload.published !== false) {
      throw new Error("TBD create fields mismatch at INSERT boundary");
    }
    for (const key of Object.keys(payload)) {
      if (!(TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS as readonly string[]).includes(key)) {
        throw new Error(`Unknown field at INSERT boundary: ${key}`);
      }
    }
  } catch (err) {
    return {
      ok: false,
      errorCode: "insert_boundary_guard_failed",
      errorMessage: err instanceof Error ? err.message : String(err),
      payload,
      rollbackHint: NO_ROLLBACK_HINT,
    };
  }

  const { data: insertedRow, error: insertError } = await client
    .from("schedules")
    .insert(payload)
    .select("*")
    .single();

  if (insertError) {
    const ambiguous =
      /timeout|network|fetch failed|ECONNRESET|ETIMEDOUT/i.test(insertError.message) ||
      insertError.code === "57014";
    return {
      ok: false,
      errorCode: ambiguous ? "insert_ambiguous" : "insert_failed",
      errorMessage: insertError.message,
      ambiguous,
      payload,
      rollbackHint: NO_ROLLBACK_HINT,
    };
  }

  if (!insertedRow) {
    return {
      ok: false,
      errorCode: "after_select_failed",
      errorMessage: "INSERT may have succeeded but inserted row could not be loaded.",
      ambiguous: true,
      payload,
      rollbackHint: NO_ROLLBACK_HINT,
    };
  }

  const afterSnapshot = insertedRow as ScheduleDryRunSource;
  const insertedId = String(afterSnapshot.id ?? "").trim();
  if (!insertedId) {
    return {
      ok: false,
      errorCode: "inserted_id_missing",
      errorMessage: "INSERT succeeded but inserted id is missing.",
      ambiguous: true,
      payload,
      rollbackHint: NO_ROLLBACK_HINT,
    };
  }

  return {
    ok: true,
    insertedId,
    payload,
    afterSnapshot,
    rollbackHint: INSERT_SUCCESS_ROLLBACK_HINT.replace("<inserted_id>", insertedId),
  };
}

async function defaultPreflightClient(options: {
  url: string;
  anonKey: string;
}): Promise<TbdCreateOneshotPreflightClient> {
  const client = getStagingSupabaseClient(options.url, options.anonKey) as unknown as {
    from: (table: "schedules") => {
      select: (
        columns: string,
        opts?: { count?: "exact"; head?: boolean },
      ) => {
        eq?: (
          column: string,
          value: string,
        ) => Promise<{
          count: number | null;
          error: { message: string } | null;
          data?: unknown;
        }>;
      } & Promise<{
        count: number | null;
        error: { message: string } | null;
        data?: unknown;
      }>;
    };
  };

  async function countAll(): Promise<number> {
    const { count, error } = await client
      .from("schedules")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async function countEq(column: string, value: string): Promise<number> {
    const builder = client.from("schedules").select("id", { count: "exact", head: true });
    const { count, error } = await (
      builder as {
        eq: (
          c: string,
          v: string,
        ) => Promise<{ count: number | null; error: { message: string } | null }>;
      }
    ).eq(column, value);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  return {
    countTotal: countAll,
    countMio: () => countEq("site_slug", "mio-kisaragi-jazz"),
    countTbd: () => countEq("date_status", "tbd"),
    countTargetLegacyId: async () => {
      const builder = client.from("schedules").select("id", { count: "exact", head: true });
      const step1 = await (
        builder as {
          eq: (
            c: string,
            v: string,
          ) => {
            eq: (
              c: string,
              v: string,
            ) => Promise<{ count: number | null; error: { message: string } | null }>;
          };
        }
      ).eq("site_slug", STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG);
      const { count, error } = await step1.eq("legacy_id", TBD_CREATE_ONESHOT_LEGACY_ID);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
    probeDateStatusColumn: async () => {
      // Independent schema probe: SELECT date_status (not a tbd-count side effect).
      const { error } = await client
        .from("schedules")
        .select("date_status", { head: true, count: "exact" });
      if (error) {
        return { ok: false, errorMessage: error.message };
      }
      return { ok: true };
    },
  };
}

export async function executeTbdCreateOneshotSave(options: {
  url: string;
  anonKey: string;
  dryRunPreviewOk: boolean;
  previewFingerprint: string | null;
  currentFingerprint?: string | null;
  approvalId?: string;
  env?: ImportMetaEnv | Record<string, unknown>;
  configOptions?: TbdCreateOneshotConfigOptions;
  /** Test-only DI — preflight is never skipped. */
  deps?: TbdCreateOneshotSaveDeps;
}): Promise<TbdCreateOneshotSaveOutcome> {
  const approvalId =
    options.approvalId ?? CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID;
  const env = options.env ?? import.meta.env;
  const serverArmOkFromSsr = options.configOptions?.serverArmOkFromSsr === true;
  const base: TbdCreateOneshotSaveOutcome = {
    phase: TBD_CREATE_ONESHOT_PHASE,
    ok: false,
    operation: "tbd-create-oneshot",
    actualWrite: false,
    approvalId: CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID,
    terminalState: oneshotTerminalState,
    guardReasons: [],
    warnings: [],
    networkCalls: oneshotNetworkCalls,
  };

  if (oneshotTerminalState !== "idle") {
    return {
      ...base,
      guardReasons: [`oneshot terminal state is ${oneshotTerminalState}`],
      errorCode: "oneshot_already_consumed",
      errorMessage:
        oneshotTerminalState === "ambiguous"
          ? "結果不明のため再実行禁止。exact SELECT で確認してください。"
          : "one-shot は再実行できません。",
      ambiguous: oneshotTerminalState === "ambiguous",
    };
  }

  const config = getTbdCreateOneshotConfig(env, {
    serverArmOkFromSsr,
  });
  const guardReasons: string[] = [];

  try {
    assertTbdCreateOneshotApprovalId(approvalId);
  } catch (err) {
    guardReasons.push(err instanceof Error ? err.message : String(err));
  }
  if (!config.saveEnabled) {
    guardReasons.push(config.armFailureReason ?? config.defaultDisabledReason);
  }
  if (!options.dryRunPreviewOk) {
    guardReasons.push("dry-run preview required");
  }
  const previewFp = options.previewFingerprint;
  const currentFp =
    options.currentFingerprint ??
    fingerprintTbdCreateOneshotPayload(
      buildTbdCreateOneshotFixedInsertPayload() as unknown as Record<string, unknown>,
    );
  if (!previewFp) {
    guardReasons.push("preview fingerprint required");
  } else if (previewFp !== currentFp) {
    guardReasons.push("preview fingerprint mismatch");
  }

  if (guardReasons.length > 0) {
    return {
      ...base,
      guardReasons,
      errorCode: "guard_failed",
      errorMessage: guardReasons.join("; "),
    };
  }

  oneshotTerminalState = "in_flight";

  let payload: ScheduleTbdCreateOneshotInsertPayload;
  try {
    if (String(options.url).includes(SARISWING_PRODUCTION_PROJECT_REF)) {
      throw new Error("production project ref rejected");
    }
    assertStaticToAstroCmsStagingSupabaseProject(options.url);
    const hostGate = evaluateSupabaseHostGate(options.url);
    if (!hostGate.hostGatePassed) {
      throw new Error(hostGate.warningMessage ?? "Supabase host gate failed.");
    }
    payload = buildTbdCreateOneshotFixedInsertPayload();
    assertTbdCreateOneshotPayloadOnly(payload);
    if (
      fingerprintTbdCreateOneshotPayload(payload as unknown as Record<string, unknown>) !==
      previewFp
    ) {
      throw new Error("Built payload fingerprint does not match preview.");
    }
  } catch (err) {
    oneshotTerminalState = "failed";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      guardReasons: [err instanceof Error ? err.message : String(err)],
      errorCode: "preflight_failed",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  // Preflight is mandatory — never skipped (no offline bypass flag).
  const preflightClient =
    options.deps?.preflightClient ??
    (await defaultPreflightClient({ url: options.url, anonKey: options.anonKey }));

  try {
    const schemaProbe = await preflightClient.probeDateStatusColumn();
    if (!schemaProbe.ok) {
      oneshotTerminalState = "failed";
      return {
        ...base,
        terminalState: oneshotTerminalState,
        guardReasons: [
          schemaProbe.errorMessage ?? "date_status column schema probe failed",
        ],
        errorCode: "schema_probe_failed",
        errorMessage:
          schemaProbe.errorMessage ?? "date_status column is not SELECT-able",
        networkCalls: oneshotNetworkCalls,
      };
    }

    const counts = {
      totalSchedules: await preflightClient.countTotal(),
      mioRows: await preflightClient.countMio(),
      tbdRows: await preflightClient.countTbd(),
      targetLegacyIdRows: await preflightClient.countTargetLegacyId(),
    };
    const evaluated = evaluateTbdCreateOneshotPreflightCounts(counts);
    if (!evaluated.ok) {
      oneshotTerminalState = "failed";
      return {
        ...base,
        terminalState: oneshotTerminalState,
        guardReasons: evaluated.failures,
        errorCode: "preflight_drift",
        errorMessage: evaluated.failures.join("; "),
        networkCalls: oneshotNetworkCalls,
      };
    }
  } catch (err) {
    oneshotTerminalState = "ambiguous";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      ambiguous: true,
      guardReasons: [err instanceof Error ? err.message : String(err)],
      errorCode: "preflight_ambiguous",
      errorMessage:
        "Preflight SELECT 結果が不明です。再実行禁止 — exact SELECT で確認してください。",
      networkCalls: oneshotNetworkCalls,
    };
  }

  const getAuth = options.deps?.getAuth ?? getStagingAuthSessionDetails;
  const auth = await getAuth(options.url, options.anonKey);
  const mockRole = formatMockRoleDisplay(auth);
  const authStatus = auth.session.status;
  const authWarnings = collectScheduleNonDryRunPocAuthWarnings(auth);

  if (!isSignedInStagingAuth(auth)) {
    oneshotTerminalState = "failed";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      warnings: authWarnings,
      errorCode: "auth_session_missing",
      errorMessage: "Sign in as staging admin before Save.",
      authStatus,
      mockRole,
      guardReasons: ["signed-in required"],
      networkCalls: oneshotNetworkCalls,
    };
  }

  const insertClient =
    options.deps?.insertClient ??
    (getStagingSupabaseClient(
      options.url,
      options.anonKey,
    ) as unknown as InternalInsertClient);

  // Exactly one INSERT attempt after successful preflight.
  oneshotNetworkCalls += 1;
  let result: InternalInsertResult;
  try {
    result = await insertTbdCreateOneshotScheduleWriteInternal({
      client: insertClient,
      url: options.url,
      payload,
      approvalId: CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID,
      env,
      serverArmOkFromSsr,
    });
  } catch (err) {
    oneshotTerminalState = "ambiguous";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      ambiguous: true,
      networkCalls: oneshotNetworkCalls,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      legacy_id: payload.legacy_id,
      errorCode: "insert_ambiguous",
      errorMessage:
        "INSERT 結果が不明です。再実行禁止 — exact SELECT で確認してください。",
      guardReasons: [err instanceof Error ? err.message : String(err)],
    };
  }

  // Keep safety object referenced so confirmed adapter safety contract stays imported.
  void getScheduleWriteSafety;

  if (!result.ok) {
    const ambiguous = result.ambiguous === true || result.errorCode === "after_select_failed";
    oneshotTerminalState = ambiguous ? "ambiguous" : "failed";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      ambiguous,
      networkCalls: oneshotNetworkCalls,
      legacy_id: payload.legacy_id,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      rollbackHint: result.rollbackHint,
      guardReasons: [result.errorMessage],
    };
  }

  try {
    assertReturnedTbdCreateOneshotRow({
      payload,
      insertedId: result.insertedId,
      afterSnapshot: result.afterSnapshot as unknown as Record<string, unknown>,
    });
  } catch (err) {
    oneshotTerminalState = "ambiguous";
    return {
      ...base,
      terminalState: oneshotTerminalState,
      ambiguous: true,
      networkCalls: oneshotNetworkCalls,
      insertedId: result.insertedId,
      legacy_id: payload.legacy_id,
      warnings: authWarnings,
      authEmail: auth.rawEmail,
      authStatus,
      mockRole,
      errorCode: "return_row_mismatch",
      errorMessage:
        "返却行が不一致です。再実行禁止 — exact SELECT で確認してください。",
      guardReasons: [err instanceof Error ? err.message : String(err)],
      rollbackHint: result.rollbackHint,
    };
  }

  oneshotTerminalState = "succeeded";
  return {
    ...base,
    ok: true,
    actualWrite: true,
    terminalState: oneshotTerminalState,
    networkCalls: oneshotNetworkCalls,
    insertedId: result.insertedId,
    legacy_id: result.afterSnapshot.legacy_id ?? payload.legacy_id,
    afterRecord: result.afterSnapshot as unknown as Record<string, unknown>,
    warnings: authWarnings,
    authEmail: auth.rawEmail,
    authStatus,
    mockRole,
    rollbackHint: result.rollbackHint,
  };
}

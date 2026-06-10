/**
 * G-6-d — Profile update PoC adapter (staging shell only).
 * Single row, update-only, approved text columns. Anon client + RLS. No service role.
 */

import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { G6D_APPROVAL_ID } from "./staging-write-config";

export const PROFILE_POC_TABLE = "profile" as const;

/** Logical field → DB column (musician-basic-supabase-v1; confirm on staging). */
export const PROFILE_POC_ALLOWED_FIELDS: Record<string, string> = {
  display_name: "name",
  bio: "bio",
};

const PROFILE_BEFORE_SELECT = "id,name,bio" as const;

export type ProfileUpdatePocPayload = {
  rowId: string;
  values: Record<string, string>;
};

export type ProfileUpdatePocResult = {
  ok: boolean;
  dryRun: boolean;
  approvalId: string;
  targetTable: typeof PROFILE_POC_TABLE;
  targetOperation: "update";
  targetRowId: string;
  allowedFields: string[];
  rejectedFields: string[];
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  updatePayload?: Record<string, string>;
  rollbackInstruction?: string;
  error?: string;
};

function buildRollbackInstruction(
  rowId: string,
  before: Record<string, unknown>,
): string {
  const name = before.name != null ? String(before.name) : "";
  const bio = before.bio != null ? String(before.bio) : "";
  return [
    "DRAFT rollback (manual on staging):",
    `UPDATE profile SET name = '${name.replace(/'/g, "''")}', bio = '${bio.replace(/'/g, "''")}' WHERE id = '${rowId}';`,
    "Verify with read-only preview before/after.",
  ].join("\n");
}

function partitionFields(values: Record<string, string>): {
  allowed: Record<string, string>;
  rejected: string[];
  dbPayload: Record<string, string>;
} {
  const allowed: Record<string, string> = {};
  const rejected: string[] = [];
  const dbPayload: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    const column = PROFILE_POC_ALLOWED_FIELDS[key];
    if (!column) {
      rejected.push(key);
      continue;
    }
    allowed[key] = value;
    dbPayload[column] = value;
  }

  return { allowed, rejected, dbPayload };
}

export async function executeProfileUpdatePoc(options: {
  url: string;
  anonKey: string;
  dryRun: boolean;
  approvalId: string;
  values: Record<string, string>;
}): Promise<ProfileUpdatePocResult> {
  const { url, anonKey, dryRun, approvalId, values } = options;

  if (approvalId !== G6D_APPROVAL_ID) {
    return {
      ok: false,
      dryRun,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId: "",
      allowedFields: Object.keys(PROFILE_POC_ALLOWED_FIELDS),
      rejectedFields: Object.keys(values),
      error: `Approval ID mismatch. Expected ${G6D_APPROVAL_ID}.`,
    };
  }

  const { allowed, rejected, dbPayload } = partitionFields(values);

  if (Object.keys(dbPayload).length === 0) {
    return {
      ok: false,
      dryRun,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId: "",
      allowedFields: Object.keys(PROFILE_POC_ALLOWED_FIELDS),
      rejectedFields: rejected,
      error: "No approved text fields in payload.",
    };
  }

  const client = getStagingSupabaseClient(url, anonKey);

  const { data: beforeRows, error: beforeError } = await client
    .from(PROFILE_POC_TABLE)
    .select(PROFILE_BEFORE_SELECT)
    .limit(1);

  if (beforeError) {
    return {
      ok: false,
      dryRun,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId: "",
      allowedFields: Object.keys(PROFILE_POC_ALLOWED_FIELDS),
      rejectedFields: rejected,
      error: beforeError.message,
    };
  }

  const beforeRow = (beforeRows?.[0] ?? null) as Record<string, unknown> | null;
  if (!beforeRow?.id) {
    return {
      ok: false,
      dryRun,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId: "",
      allowedFields: Object.keys(PROFILE_POC_ALLOWED_FIELDS),
      rejectedFields: rejected,
      error: "No profile row found (single row required).",
    };
  }

  const targetRowId = String(beforeRow.id);
  const rollbackInstruction = buildRollbackInstruction(targetRowId, beforeRow);

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId,
      allowedFields: Object.keys(allowed),
      rejectedFields: rejected,
      before: beforeRow,
      updatePayload: dbPayload,
      rollbackInstruction,
    };
  }

  const { data: updatedRows, error: updateError } = await client
    .from(PROFILE_POC_TABLE)
    .update(dbPayload)
    .eq("id", targetRowId)
    .select(PROFILE_BEFORE_SELECT);

  if (updateError) {
    return {
      ok: false,
      dryRun: false,
      approvalId,
      targetTable: PROFILE_POC_TABLE,
      targetOperation: "update",
      targetRowId,
      allowedFields: Object.keys(allowed),
      rejectedFields: rejected,
      before: beforeRow,
      updatePayload: dbPayload,
      rollbackInstruction,
      error: updateError.message,
    };
  }

  const afterRow = (updatedRows?.[0] ?? null) as Record<string, unknown> | null;

  return {
    ok: true,
    dryRun: false,
    approvalId,
    targetTable: PROFILE_POC_TABLE,
    targetOperation: "update",
    targetRowId,
    allowedFields: Object.keys(allowed),
    rejectedFields: rejected,
    before: beforeRow,
    after: afterRow ?? undefined,
    updatePayload: dbPayload,
    rollbackInstruction,
  };
}

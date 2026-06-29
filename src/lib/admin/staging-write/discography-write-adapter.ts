/**
 * G-15b — Discography write adapter (staging only; update-only; anon client).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import { DISCOGRAPHY_ADMIN_SELECT } from "./staging-discography-read";
import {
  assertDiscographyWriteApprovalId,
  assertDiscographyWriteTargetId,
  assertDiscographyScalarSliceWriteGuards,
  getDiscographyScalarSliceEntryByApprovalId,
} from "./discography-write-guards";
import { scheduleUpdatedAtEquals } from "./schedule-write-utils";
import {
  getDiscographyWriteSafety,
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID,
  type DiscographyUpdateWritePayload,
  type DiscographyWriteAdapterResult,
  type DiscographyWriteClient,
  type DiscographyWriteFailureResult,
  type DiscographyWriteResult,
  type DiscographyWriteApprovalIdUnion,
} from "./discography-write-types";

const SUCCESS_ROLLBACK_HINT_PURCHASE_URL =
  "Manual rollback required if needed. Restore purchase_url on public.discography by legacy_id.";
const SUCCESS_ROLLBACK_HINT_ARTIST =
  "Manual rollback required if needed. Restore artist on public.discography by legacy_id.";
const SUCCESS_ROLLBACK_HINT_G16A_ARTIST =
  "Manual rollback required if needed. Restore artist on discography-001 by legacy_id.";
const SUCCESS_ROLLBACK_HINT_G17C_LABEL =
  "Manual rollback required if needed. Restore label on discography-004 by legacy_id.";
const NO_ROLLBACK_HINT = "No rollback required because actualWrite is false.";

function buildFailure(
  partial: Pick<
    DiscographyWriteFailureResult,
    | "errorCode"
    | "errorMessage"
    | "targetId"
    | "approvalId"
    | "beforeSnapshot"
    | "payload"
  >,
): DiscographyWriteFailureResult {
  return {
    module: "discography",
    operation: "update",
    targetTable: "discography",
    dryRun: false,
    actualWrite: false,
    rollbackHint: NO_ROLLBACK_HINT,
    safety: getDiscographyWriteSafety(false),
    ...partial,
  };
}

function mapRow(row: Record<string, unknown>): GosakiDiscographyRecord {
  return {
    id: String(row.id ?? ""),
    legacy_id: String(row.legacy_id ?? ""),
    title: String(row.title ?? ""),
    artist: row.artist != null ? String(row.artist) : null,
    release_date: row.release_date != null ? String(row.release_date) : null,
    year: typeof row.year === "number" ? row.year : null,
    catalog_number: row.catalog_number != null ? String(row.catalog_number) : null,
    label: row.label != null ? String(row.label) : null,
    description: row.description != null ? String(row.description) : null,
    cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
    purchase_url: row.purchase_url != null ? String(row.purchase_url) : null,
    streaming_url: row.streaming_url != null ? String(row.streaming_url) : null,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
    published: row.published != null ? Boolean(row.published) : null,
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
    tracks: [],
  };
}

function computeChangedFields(
  before: GosakiDiscographyRecord,
  after: GosakiDiscographyRecord,
  payload: DiscographyUpdateWritePayload,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(payload) as (keyof DiscographyUpdateWritePayload)[]) {
    const beforeValue = before[key as keyof GosakiDiscographyRecord];
    const afterValue = after[key as keyof GosakiDiscographyRecord];
    if (String(beforeValue ?? "") !== String(afterValue ?? "")) {
      changed.push(String(key));
    }
  }
  return changed;
}

export async function updateDiscographyWrite(input: {
  client: DiscographyWriteClient;
  approvalId: DiscographyWriteApprovalIdUnion;
  targetId: string;
  beforeSnapshot: GosakiDiscographyRecord;
  payload: DiscographyUpdateWritePayload;
  expectedBeforeUpdatedAt?: string | null;
  writeScope?: { legacyId: string };
}): Promise<DiscographyWriteAdapterResult> {
  const {
    client,
    approvalId,
    targetId,
    beforeSnapshot,
    payload,
    expectedBeforeUpdatedAt,
    writeScope,
  } = input;

  try {
    assertDiscographyWriteApprovalId(approvalId);
    assertDiscographyWriteTargetId(targetId, beforeSnapshot);
    const registryEntry = getDiscographyScalarSliceEntryByApprovalId(approvalId);
    if (!registryEntry) {
      throw new Error(`Discography write slice not implemented for approvalId: ${approvalId}`);
    }
    assertDiscographyScalarSliceWriteGuards(registryEntry, {
      approvalId,
      payload,
      row: beforeSnapshot,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return buildFailure({
      approvalId: approvalId as DiscographyWriteApprovalIdUnion,
      targetId: targetId || undefined,
      beforeSnapshot,
      payload,
      errorCode: "guard_failed",
      errorMessage: message,
    });
  }

  if (expectedBeforeUpdatedAt != null && expectedBeforeUpdatedAt !== "") {
    const { data: currentRow, error: selectError } = await client
      .from("discography")
      .select("updated_at,legacy_id")
      .eq("id", beforeSnapshot.id)
      .single();

    if (selectError) {
      return buildFailure({
        approvalId,
        targetId: beforeSnapshot.id,
        beforeSnapshot,
        payload,
        errorCode: "optimistic_lock_select_failed",
        errorMessage: selectError.message,
      });
    }

    const currentUpdatedAt =
      currentRow?.updated_at != null ? String(currentRow.updated_at) : null;
    if (!scheduleUpdatedAtEquals(currentUpdatedAt, expectedBeforeUpdatedAt)) {
      return buildFailure({
        approvalId,
        targetId: beforeSnapshot.id,
        beforeSnapshot,
        payload,
        errorCode: "optimistic_lock_failed",
        errorMessage: `expectedBeforeUpdatedAt (${expectedBeforeUpdatedAt}) does not match current updated_at (${currentUpdatedAt ?? "null"}).`,
      });
    }

    if (writeScope) {
      const currentLegacyId =
        currentRow?.legacy_id != null ? String(currentRow.legacy_id) : null;
      if (currentLegacyId !== writeScope.legacyId) {
        return buildFailure({
          approvalId,
          targetId: beforeSnapshot.id,
          beforeSnapshot,
          payload,
          errorCode: "legacy_id_scope_failed",
          errorMessage: `legacy_id mismatch (expected ${writeScope.legacyId}, got ${currentLegacyId ?? "null"}).`,
        });
      }
    }
  }

  let updateQuery = client
    .from("discography")
    .update(payload)
    .eq("id", beforeSnapshot.id)
    .eq("legacy_id", writeScope?.legacyId ?? beforeSnapshot.legacy_id);

  if (expectedBeforeUpdatedAt != null && expectedBeforeUpdatedAt !== "") {
    updateQuery = updateQuery.eq("updated_at", expectedBeforeUpdatedAt);
  }

  const { data: updatedRow, error: updateError } = await updateQuery
    .select(DISCOGRAPHY_ADMIN_SELECT)
    .single();

  if (updateError) {
    return buildFailure({
      approvalId,
      targetId: beforeSnapshot.id,
      beforeSnapshot,
      payload,
      errorCode: "update_failed",
      errorMessage: updateError.message,
    });
  }

  if (!updatedRow) {
    return buildFailure({
      approvalId,
      targetId: beforeSnapshot.id,
      beforeSnapshot,
      payload,
      errorCode: "after_select_failed",
      errorMessage: "Update may have succeeded but afterSnapshot could not be loaded.",
    });
  }

  const afterSnapshot = mapRow(updatedRow as Record<string, unknown>);
  const changedFields = computeChangedFields(beforeSnapshot, afterSnapshot, payload);

  const rollbackHint =
    approvalId === G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID
      ? SUCCESS_ROLLBACK_HINT_G17C_LABEL
      : approvalId === G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID
        ? SUCCESS_ROLLBACK_HINT_G16A_ARTIST
        : approvalId === G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID
          ? SUCCESS_ROLLBACK_HINT_ARTIST
          : SUCCESS_ROLLBACK_HINT_PURCHASE_URL;

  const result: DiscographyWriteResult = {
    module: "discography",
    operation: "update",
    targetTable: "discography",
    targetId: beforeSnapshot.id,
    dryRun: false,
    actualWrite: true,
    approvalId,
    rowsAffected: 1,
    beforeSnapshot,
    payload,
    afterSnapshot,
    changedFields,
    rollbackHint,
    safety: getDiscographyWriteSafety(true),
  };

  return result;
}

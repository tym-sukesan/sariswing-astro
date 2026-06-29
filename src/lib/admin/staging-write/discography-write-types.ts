/**
 * G-15b — Discography write adapter types (staging shell; update-only).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";

/** G-15b Gosaki Discography purchase_url non-dry-run slice. */
export type DiscographyG15bPurchaseUrlNonDryRunApprovalId =
  "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";

export const G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID:
  DiscographyG15bPurchaseUrlNonDryRunApprovalId =
  "G-15b-gosaki-discography-existing-release-purchase-url-non-dry-run";

/** G-15d Gosaki Discography artist non-dry-run slice. */
export type DiscographyG15dArtistNonDryRunApprovalId =
  "G-15d-gosaki-discography-existing-release-artist-non-dry-run";

export const G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID:
  DiscographyG15dArtistNonDryRunApprovalId =
  "G-15d-gosaki-discography-existing-release-artist-non-dry-run";

/** G-16a Gosaki Discography artist non-dry-run slice (discography-001). */
export type DiscographyG16aArtistNonDryRunApprovalId =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";

export const G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID:
  DiscographyG16aArtistNonDryRunApprovalId =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";

/** G-17c Gosaki Discography label non-dry-run slice (discography-004). */
export type DiscographyG17cLabelNonDryRunApprovalId =
  "G-17c-gosaki-discography-existing-release-label-non-dry-run";

export const G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID:
  DiscographyG17cLabelNonDryRunApprovalId =
  "G-17c-gosaki-discography-existing-release-label-non-dry-run";

export type DiscographyWriteApprovalIdUnion =
  | DiscographyG15bPurchaseUrlNonDryRunApprovalId
  | DiscographyG15dArtistNonDryRunApprovalId
  | DiscographyG16aArtistNonDryRunApprovalId
  | DiscographyG17cLabelNonDryRunApprovalId;

export const DISCOGRAPHY_WRITE_APPROVAL_IDS: readonly DiscographyWriteApprovalIdUnion[] = [
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID,
];

export type DiscographyUpdateWritePayload = {
  purchase_url?: string | null;
  artist?: string | null;
  label?: string | null;
};

export type DiscographyWriteSafety = {
  supabaseWriteCalled: boolean;
  writeAdapterUsed: boolean;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
};

export function getDiscographyWriteSafety(actualWrite: boolean): DiscographyWriteSafety {
  return {
    supabaseWriteCalled: actualWrite,
    writeAdapterUsed: actualWrite,
    discographyTracksTouched: false,
    serviceRoleUsed: false,
  };
}

export type DiscographyWriteClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    update: (payload: DiscographyUpdateWritePayload) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          column2: string,
          value2: string,
        ) => {
          eq: (
            column3: string,
            value3: string,
          ) => {
            select: (columns: string) => {
              single: () => Promise<{
                data: Record<string, unknown> | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    };
  };
};

export type DiscographyWriteFailureResult = {
  module: "discography";
  operation: "update";
  targetTable: "discography";
  targetId?: string;
  dryRun: false;
  actualWrite: false;
  approvalId: DiscographyWriteApprovalIdUnion;
  beforeSnapshot: GosakiDiscographyRecord;
  payload: DiscographyUpdateWritePayload;
  errorCode: string;
  errorMessage: string;
  rollbackHint: string;
  safety: DiscographyWriteSafety;
};

export type DiscographyWriteResult = {
  module: "discography";
  operation: "update";
  targetTable: "discography";
  targetId: string;
  dryRun: false;
  actualWrite: true;
  approvalId: DiscographyWriteApprovalIdUnion;
  rowsAffected: number;
  beforeSnapshot: GosakiDiscographyRecord;
  payload: DiscographyUpdateWritePayload;
  afterSnapshot: GosakiDiscographyRecord;
  changedFields: string[];
  rollbackHint: string;
  safety: DiscographyWriteSafety;
};

export type DiscographyWriteAdapterResult =
  | DiscographyWriteResult
  | DiscographyWriteFailureResult;

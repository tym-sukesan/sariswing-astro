/**
 * G-15a2 — Gosaki Discography dry-run types (staging shell).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";

export const G15A2_PHASE =
  "G-15a2-gosaki-discography-dry-run-preview-implementation-and-preflight";

export const G15A2_TARGET_LEGACY_ID = "discography-002";

export const G15A2_TARGET_TITLE = "SKYLARK";

export const G15A2_TARGET_PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";

export const G15A2_TARGET_PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";

export const G15A2_TARGET_UPDATED_AT_BASELINE = "2026-06-05T17:39:44.201802+00:00";

export const G15A2_DRY_RUN_SLICE_APPROVAL_ID =
  "G-15a2-gosaki-discography-purchase-url-dry-run-slice";

export type DiscographyDryRunSource = GosakiDiscographyRecord;

export type DiscographyDryRunFormField =
  | "title"
  | "artist"
  | "release_date"
  | "year"
  | "catalog_number"
  | "label"
  | "description"
  | "purchase_url"
  | "streaming_url"
  | "sort_order"
  | "published";

export type DiscographyDryRunFormValues = Record<DiscographyDryRunFormField, string>;

export type DiscographyUpdatePayload = Partial<
  Record<DiscographyDryRunFormField, string | number | boolean | null>
>;

/**
 * Fixtures for CMS Core Save arm mutex evaluator (verifier-only).
 * Site-agnostic cases + Gosaki inventory-shaped evaluation cases (verifier imports Gosaki).
 */

import { MUTEX_REASON } from "./save-arm-mutex-utils.mjs";

/**
 * @typedef {{
 *   label: string,
 *   input: unknown,
 *   ok: boolean,
 *   reason: string,
 *   armedCount: number,
 *   armedFeatureIds?: string[],
 * }} MutexEvalFixture
 */

/** @type {readonly MutexEvalFixture[]} */
export const MUTEX_EVAL_FIXTURE_MATRIX = Object.freeze([
  {
    label: "empty-array",
    input: [],
    ok: true,
    reason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
    armedCount: 0,
    armedFeatureIds: [],
  },
  {
    label: "all-false",
    input: [
      { featureId: "schedule", armed: false },
      { featureId: "discography", armed: false },
    ],
    ok: true,
    reason: MUTEX_REASON.NO_OPERATIONAL_SAVE_ARM,
    armedCount: 0,
    armedFeatureIds: [],
  },
  {
    label: "single-true",
    input: [
      { featureId: "schedule", armed: false },
      { featureId: "about-supabase", armed: true },
    ],
    ok: true,
    reason: MUTEX_REASON.SINGLE_OPERATIONAL_SAVE_ARM,
    armedCount: 1,
    armedFeatureIds: ["about-supabase"],
  },
  {
    label: "two-true",
    input: [
      { featureId: "schedule", armed: true },
      { featureId: "discography", armed: true },
    ],
    ok: false,
    reason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    armedCount: 2,
    armedFeatureIds: ["schedule", "discography"],
  },
  {
    label: "youtube-contents-and-supabase-true",
    input: [
      { featureId: "youtube-contents", armed: true },
      { featureId: "youtube-supabase", armed: true },
    ],
    ok: false,
    reason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    armedCount: 2,
    armedFeatureIds: ["youtube-contents", "youtube-supabase"],
  },
  {
    label: "about-contents-and-supabase-true",
    input: [
      { featureId: "about-contents", armed: true },
      { featureId: "about-supabase", armed: true },
    ],
    ok: false,
    reason: MUTEX_REASON.MULTIPLE_OPERATIONAL_SAVE_ARMS,
    armedCount: 2,
    armedFeatureIds: ["about-contents", "about-supabase"],
  },
  {
    label: "armed-string-true",
    input: [{ featureId: "schedule", armed: "true" }],
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
  },
  {
    label: "feature-id-empty",
    input: [{ featureId: "", armed: true }],
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
  },
  {
    label: "feature-id-duplicate",
    input: [
      { featureId: "schedule", armed: false },
      { featureId: "schedule", armed: true },
    ],
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
  },
  {
    label: "null-input",
    input: null,
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
  },
  {
    label: "non-array-object",
    input: { featureId: "schedule", armed: true },
    ok: false,
    reason: MUTEX_REASON.INVALID_OPERATIONAL_SAVE_ARM_INPUT,
    armedCount: 0,
  },
]);

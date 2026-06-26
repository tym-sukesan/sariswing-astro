/** G-11c6a — Gosaki YouTube URL web-save non-dry-run constants */

export const G11C6_OPERATION_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_APPROVAL_ID = "G-11c6-gosaki-youtube-url-web-save-non-dry-run-slice";
export const G11C6_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const G11C6_PRODUCTION_PROJECT_REF = "vsbvndwuajjhnzpohghh";
export const G11C6_SAVE_ARMED_ENV = "GOSAKI_YOUTUBE_URL_SAVE_ARMED";
export const G11C6_WORKFLOW_FILE = "gosaki-youtube-url-save-staging.yml";
export const G11C6_SAVE_ENDPOINT_SUFFIX = "/functions/v1/gosaki-youtube-url-save";
export const G11C6_SAVE_ENABLED_ENV = "PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED";

/** G-11c10a — first workflow_dispatch execution gate */
export const G11C10_APPROVAL_ID = "G-11c10-gosaki-youtube-url-save-workflow-dispatch-001";
export const G11C10_OPERATION_ID = "gosaki-youtube-url-save-workflow-dispatch-001";

/** Workflow JSON patch allowlist — G-11c6 (slice) + G-11c10 (dispatch) */
export const GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_APPROVAL_IDS = [
  G11C6_APPROVAL_ID,
  G11C10_APPROVAL_ID,
];

export const GOSAKI_YOUTUBE_URL_SAVE_WORKFLOW_OPERATION_IDS = [
  G11C6_OPERATION_ID,
  G11C10_OPERATION_ID,
];

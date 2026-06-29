/**
 * G-18f — SSR page config bridge for tracklist textarea diff dry-run.
 */

import { getGosakiDiscographyG18fTracklistDryRunConfig } from "./gosaki-discography-g18f-tracklist-dry-run-config";
import { G18F_TRACKLIST_DRY_RUN_APPROVAL_ID } from "./gosaki-discography-g18f-tracklist-types";

export const G18F_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID =
  "g18f-discography-tracklist-page-config";

export interface G18fDiscographyTracklistPageServerConfig {
  tracklistPreviewEnabled: boolean;
  saveEnabled: false;
  dbWriteEnabled: false;
  dryRunRequired: boolean;
  writeApprovalId: string;
}

export function resolveG18fDiscographyTracklistPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G18fDiscographyTracklistPageServerConfig {
  const config = getGosakiDiscographyG18fTracklistDryRunConfig(env);
  return {
    tracklistPreviewEnabled: config.tracklistPreviewEnabled,
    saveEnabled: false,
    dbWriteEnabled: false,
    dryRunRequired: config.dryRun,
    writeApprovalId: G18F_TRACKLIST_DRY_RUN_APPROVAL_ID,
  };
}

/**
 * G-19b1 — SSR page config bridge for generic single-title Save slice.
 */

import { getGosakiDiscographyG19b1TracklistTitleSaveConfig } from "./gosaki-discography-g19b1-tracklist-generic-single-title-save-config";
import { G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export const G19B1_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID =
  "g19b1-discography-tracklist-page-config";

export interface G19b1DiscographyTracklistPageServerConfig {
  saveEnabled: boolean;
  dbWriteEnabled: boolean;
  dryRunRequired: boolean;
  envArmArmed: boolean;
  writeApprovalId: string;
}

export function resolveG19b1DiscographyTracklistPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G19b1DiscographyTracklistPageServerConfig {
  const config = getGosakiDiscographyG19b1TracklistTitleSaveConfig(env);
  return {
    saveEnabled: config.saveEnabled,
    dbWriteEnabled: config.saveEnabled,
    dryRunRequired: config.dryRun,
    envArmArmed: config.envArmArmed,
    writeApprovalId: G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
  };
}

/**
 * G-18g2 — SSR page config bridge for tracklist single-title Save slice.
 */

import { getGosakiDiscographyG18g2TracklistTitleSaveConfig } from "./gosaki-discography-g18g2-tracklist-title-save-config";
import { G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";

export const G18G2_DISCOGRAPHY_TRACKLIST_PAGE_CONFIG_ELEMENT_ID =
  "g18g2-discography-tracklist-page-config";

export interface G18g2DiscographyTracklistPageServerConfig {
  saveEnabled: boolean;
  dbWriteEnabled: boolean;
  dryRunRequired: boolean;
  envArmArmed: boolean;
  writeApprovalId: string;
}

export function resolveG18g2DiscographyTracklistPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G18g2DiscographyTracklistPageServerConfig {
  const config = getGosakiDiscographyG18g2TracklistTitleSaveConfig(env);
  return {
    saveEnabled: config.saveEnabled,
    dbWriteEnabled: config.saveEnabled,
    dryRunRequired: config.dryRun,
    envArmArmed: config.envArmArmed,
    writeApprovalId: G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
  };
}

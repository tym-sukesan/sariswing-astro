/**
 * G-15a2 — SSR page config bridge for Discography dry-run / Save gates.
 */

import { getGosakiDiscographyDryRunConfig } from "./gosaki-discography-dry-run-config";

export const G15A2_DISCOGRAPHY_PAGE_CONFIG_ELEMENT_ID =
  "gosaki-discography-dry-run-page-config";

export interface G15a2DiscographyPageServerConfig {
  dryRunPreviewEnabled: boolean;
  saveEnabled: false;
  dbWriteEnabled: false;
  stagingShellEnabled: boolean;
  dataReadEnabled: boolean;
  hostGatePassed: boolean;
  writeApprovalId: string;
}

export function resolveG15a2DiscographyPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G15a2DiscographyPageServerConfig {
  const config = getGosakiDiscographyDryRunConfig(env);
  return {
    dryRunPreviewEnabled: config.dryRunPreviewEnabled,
    saveEnabled: false,
    dbWriteEnabled: false,
    stagingShellEnabled: config.stagingShellEnabled,
    dataReadEnabled: config.dataReadEnabled,
    hostGatePassed: config.hostGatePassed,
    writeApprovalId: config.approvalId,
  };
}

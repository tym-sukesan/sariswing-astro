/**
 * G-10h4d — Client-side Save caller for About bands HTML static JSON write API.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH,
  mapG10h4dSaveApiBodyToOutcome,
  parseG10h4dSaveApiJsonResponse,
} from "./gosaki-about-bands-html-static-json-write-api";
import {
  evaluateG10h4cAboutBandsHtmlSaveUiGate,
  getG10h4cAboutBandsHtmlStaticJsonWriteConfig,
} from "./gosaki-about-bands-html-static-json-write-config";
import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4D_PHASE,
  type G10h4cBandsHtmlFormValues,
} from "./gosaki-about-bands-html-static-json-write-types";

export { G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH };

export type G10h4dBandsHtmlSaveBinding = {
  changedFields: string[];
  dryRunOk: boolean;
  saveReadiness?: string;
};

export type G10h4dBandsHtmlClientSaveOutcome = {
  phase: typeof G10H4D_PHASE;
  approvalId: typeof G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  blockId: typeof G10H4C_TARGET_BLOCK_ID;
  changedFields: string[];
  blocksAffected?: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export async function executeG10h4dAboutBandsHtmlStaticJsonClientSave(options: {
  url: string;
  anonKey: string;
  formValues: G10h4cBandsHtmlFormValues;
  saveBinding: G10h4dBandsHtmlSaveBinding;
  env?: ImportMetaEnv;
}): Promise<G10h4dBandsHtmlClientSaveOutcome> {
  const writeConfig = getG10h4cAboutBandsHtmlStaticJsonWriteConfig(options.env ?? import.meta.env);
  const base = {
    phase: G10H4D_PHASE,
    approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    blockId: G10H4C_TARGET_BLOCK_ID,
    changedFields: [...options.saveBinding.changedFields],
    ok: false,
  };

  const gate = evaluateG10h4cAboutBandsHtmlSaveUiGate({
    signedIn: true,
    dryRunResult: {
      ok: options.saveBinding.dryRunOk,
      saveReadiness: options.saveBinding.saveReadiness,
      changedFields: options.saveBinding.changedFields,
    },
    env: options.env,
  });
  if (!gate.enabled) {
    return {
      ...base,
      errorCode: writeConfig.saveEnabled ? "save_gate_blocked" : "save_not_enabled",
      errorMessage: gate.reason,
    };
  }

  const auth = await getStagingAuthSessionDetails(options.url, options.anonKey);
  if (!isSignedInStagingAuth(auth)) {
    return {
      ...base,
      errorCode: "auth_required",
      errorMessage: "Staging admin session required.",
    };
  }

  const client = getStagingSupabaseClient(options.url, options.anonKey);
  const { data: sessionData } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return {
      ...base,
      errorCode: "auth_token_missing",
      errorMessage: "Staging session access token missing.",
    };
  }

  try {
    const response = await fetch(G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
        siteSlug: G10H4C_SITE_SLUG,
        blockId: G10H4C_TARGET_BLOCK_ID,
        html: options.formValues.html,
        changedFields: options.saveBinding.changedFields,
        dryRunOk: options.saveBinding.dryRunOk,
        dryRun: false,
      }),
    });

    const parsed = await parseG10h4dSaveApiJsonResponse(response);
    const mapped = mapG10h4dSaveApiBodyToOutcome(parsed);

    if (!mapped.ok) {
      return {
        ...base,
        errorCode: mapped.errorCode ?? "api_error",
        errorMessage: mapped.errorMessage ?? `API error (${response.status})`,
      };
    }

    return {
      ...base,
      ok: true,
      blocksAffected: mapped.blocksAffected,
    };
  } catch (error) {
    return {
      ...base,
      errorCode: "network_error",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * G-10c — Client-side Save caller for YouTube embed static JSON write API.
 */

import { getStagingAuthSessionDetails } from "../staging-auth/staging-auth-session";
import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { isSignedInStagingAuth } from "../staging-write/schedule-non-dry-run-poc-auth";
import { getG10cYoutubeEmbedStaticJsonWriteConfig } from "./gosaki-youtube-embed-static-json-write-config";
import { executeG10cYoutubeEmbedStaticJsonWriteDryRun } from "./gosaki-youtube-embed-static-json-write-dry-run";
import {
  G10C_PHASE,
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
  type G10cYoutubeEmbedConfigSnapshot,
  type G10cYoutubeEmbedFormValues,
  type G10cYoutubeEmbedItemSnapshot,
} from "./gosaki-youtube-embed-static-json-write-types";

export const G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_API_PATH =
  "/__admin-staging-shell/musician-basic/api/youtube-embed-static-json-write.json";

export type G10cYoutubeEmbedSaveBinding = {
  changedFields: string[];
  payloadKeys: string[];
  dryRunOk: boolean;
};

export type G10cYoutubeEmbedClientSaveOutcome = {
  phase: typeof G10C_PHASE;
  approvalId: typeof G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID;
  itemId: typeof G10C_YOUTUBE_EMBED_TARGET_ITEM_ID;
  changedFields: string[];
  payloadKeys: string[];
  itemsAffected?: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export async function executeG10cYoutubeEmbedStaticJsonClientSave(options: {
  url: string;
  anonKey: string;
  config: G10cYoutubeEmbedConfigSnapshot;
  beforeItem: G10cYoutubeEmbedItemSnapshot;
  formValues: G10cYoutubeEmbedFormValues;
  saveBinding: G10cYoutubeEmbedSaveBinding;
  env?: ImportMetaEnv;
}): Promise<G10cYoutubeEmbedClientSaveOutcome> {
  const writeConfig = getG10cYoutubeEmbedStaticJsonWriteConfig(options.env ?? import.meta.env);
  const base = {
    phase: G10C_PHASE,
    approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
    itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
    changedFields: [...options.saveBinding.changedFields],
    payloadKeys: [...options.saveBinding.payloadKeys],
    ok: false,
  };

  if (!writeConfig.saveEnabled) {
    return {
      ...base,
      errorCode: "save_not_enabled",
      errorMessage:
        writeConfig.armFailureReason ??
        "G-10c Save path disabled — env arm / approval stack not satisfied.",
    };
  }

  if (!options.saveBinding.dryRunOk) {
    return {
      ...base,
      errorCode: "dry_run_not_ok",
      errorMessage: "Dry-run must succeed before Save.",
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

  const dryRun = executeG10cYoutubeEmbedStaticJsonWriteDryRun({
    config: options.config,
    beforeItem: options.beforeItem,
    formValues: options.formValues,
    signedIn: true,
    env: options.env,
  });
  if (!dryRun.ok || dryRun.saveReadiness !== "ready_to_save") {
    return {
      ...base,
      errorCode: "dry_run_recheck_failed",
      errorMessage: dryRun.guardErrors.join("; ") || "Dry-run re-check failed.",
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
    const response = await fetch(G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_API_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
        itemId: G10C_YOUTUBE_EMBED_TARGET_ITEM_ID,
        embedCode: options.formValues.embedCode,
        published: options.formValues.published,
        changedFields: options.saveBinding.changedFields,
        payloadKeys: options.saveBinding.payloadKeys,
        dryRunOk: options.saveBinding.dryRunOk,
      }),
    });

    const body = (await response.json()) as {
      ok?: boolean;
      itemsAffected?: number;
      errorCode?: string;
      errorMessage?: string;
    };

    if (!response.ok || !body.ok) {
      return {
        ...base,
        errorCode: body.errorCode ?? "api_error",
        errorMessage: body.errorMessage ?? `API error (${response.status})`,
      };
    }

    return {
      ...base,
      ok: true,
      itemsAffected: body.itemsAffected,
    };
  } catch (error) {
    return {
      ...base,
      errorCode: "network_error",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

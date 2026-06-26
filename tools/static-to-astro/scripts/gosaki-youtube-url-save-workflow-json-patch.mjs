#!/usr/bin/env node
/**
 * G-11c8 — Gosaki YouTube URL save workflow JSON patch CLI.
 * Default: check-only (no file write). Use --apply to write (G-11c10+ only).
 *
 * Run: node tools/static-to-astro/scripts/gosaki-youtube-url-save-workflow-json-patch.mjs [options]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  G11C8_CONFIG_REL,
  formatG11c8PatchResultForLog,
  runG11c8WorkflowJsonPatch,
} from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

function printUsage() {
  console.log(`Usage: gosaki-youtube-url-save-workflow-json-patch.mjs [options]

Options:
  --config <path>                 JSON config path (default: ${G11C8_CONFIG_REL})
  --site-slug <slug>
  --module <module>
  --item-id <id>
  --youtube-url <url>
  --expected-before-embed-code <s>
  --expected-before-video-id <s>
  --approval-id <id>
  --operation-id <id>
  --request-id <id>               optional audit id
  --actor-id-hash <hash>            optional — no email
  --apply                         write JSON (default: check-only)
  --json                          JSON stdout
  -h, --help
`);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | boolean>} */
  const out = { apply: false, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
      continue;
    }
    if (arg === "--apply") {
      out.apply = true;
      continue;
    }
    if (arg === "--json") {
      out.json = true;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("-")) continue;
    const key = arg.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = next;
    i += 1;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const configRel = String(args.config ?? G11C8_CONFIG_REL);
  const configPath = path.isAbsolute(configRel) ? configRel : path.join(REPO_ROOT, configRel);

  const input = {
    site_slug: args.siteSlug,
    module: args.module,
    item_id: args.itemId,
    youtube_url: args.youtubeUrl,
    expected_before_embed_code: args.expectedBeforeEmbedCode,
    expected_before_video_id: args.expectedBeforeVideoId,
    approval_id: args.approvalId,
    operation_id: args.operationId,
    request_id: args.requestId,
    actor_id_hash: args.actorIdHash,
  };

  const { exitCode, result } = runG11c8WorkflowJsonPatch(configPath, input, {
    apply: Boolean(args.apply),
  });

  const payload = {
    ...formatG11c8PatchResultForLog(
      /** @type {Record<string, unknown>} */ (result),
    ),
    current: result.current,
    next: result.next,
    configPath: result.configPath ?? configRel,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`saveReadiness: ${payload.saveReadiness ?? "unknown"}`);
    if (payload.changedFields?.length) {
      console.log(`changedFields: ${JSON.stringify(payload.changedFields)}`);
    }
    if (payload.current) {
      console.log(`current.embedCode length: ${String(payload.current.embedCode ?? "").length}`);
    }
    if (payload.next) {
      console.log(`next.embedCode length: ${String(payload.next.embedCode ?? "").length}`);
    }
    if (payload.error) {
      console.log(`error: ${payload.error}`);
    }
    console.log(`applied: ${payload.applied ? "true" : "false"}`);
    console.log(`checkOnly: ${payload.checkOnly !== false && !payload.applied}`);
  }

  process.exit(exitCode);
}

main();

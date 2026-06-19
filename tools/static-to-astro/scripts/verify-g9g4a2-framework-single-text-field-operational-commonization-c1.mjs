/**
 * G-9g4a2 C1 — registry + types + parameterized guards + generic config (static only).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c1.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2B_SCHEDULE_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2C_SCHEDULE_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID,
  SCHEDULE_WRITE_APPROVAL_IDS,
} from "../../../src/lib/admin/staging-write/schedule-write-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const PHASE = "G-9g4a2-framework-single-text-field-operational-commonization-implementation";
const OPEN_TIME_UI_PREFIX = "site-slug-edit-g9g4a2a-open-time-only";
const OPEN_TIME_APPROVAL = "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";
const OPEN_TIME_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED";
const START_TIME_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED";
const PRICE_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED";
const START_TIME_APPROVAL = "G-9g4a2b-schedule-site-slug-start-time-only-non-dry-run";
const PRICE_APPROVAL = "G-9g4a2c-schedule-site-slug-price-only-non-dry-run";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function assertThrows(label, fn, expectedSubstring) {
  try {
    fn();
    console.error(`FAIL ${label} — expected throw`);
    failed += 1;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (expectedSubstring && !message.includes(expectedSubstring)) {
      console.error(`FAIL ${label} — got "${message}"`);
      failed += 1;
    } else {
      console.log(`PASS ${label}`);
      passed += 1;
    }
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function unique(values) {
  return new Set(values).size === values.length;
}

function parseRegistryEntries(registrySrc) {
  const entries = [];
  const blockRe =
    /fieldName:\s*"(open_time|start_time|price)"[\s\S]*?approvalId:\s*([^,\n]+)[\s\S]*?envArm:\s*([^,\n]+)[\s\S]*?uiIdPrefix:\s*"([^"]+)"[\s\S]*?reclickMode:\s*"([^"]+)"/g;
  let match;
  while ((match = blockRe.exec(registrySrc)) !== null) {
    entries.push({
      fieldName: match[1],
      approvalId: match[2].trim(),
      envArm: match[3].trim(),
      uiIdPrefix: match[4],
      reclickMode: match[5],
    });
  }
  return entries;
}

/** Mirror of schedule-write-guards.ts single-text-field helpers for standalone verify. */
const SINGLE_TEXT_FIELD_SAFE_TEXT_KEYS = [
  "venue",
  "title",
  "description",
  "open_time",
  "start_time",
  "price",
];

const SINGLE_TEXT_FIELD_METADATA_FORBIDDEN_KEYS = new Set([
  "date",
  "year",
  "month",
  "source_route",
  "source_file",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "image_url",
  "home_image_url",
  "id",
  "legacy_id",
  "site_slug",
  "created_at",
  "updated_at",
]);

function getSingleTextFieldForbiddenMutationKeys(fieldName) {
  const forbidden = new Set(SINGLE_TEXT_FIELD_METADATA_FORBIDDEN_KEYS);
  for (const key of SINGLE_TEXT_FIELD_SAFE_TEXT_KEYS) {
    if (key !== fieldName) {
      forbidden.add(key);
    }
  }
  return forbidden;
}

function assertSingleTextFieldChangedFieldsOnly(fieldName, changedFields, label = "G-9g4a2") {
  if (changedFields.length !== 1 || changedFields[0] !== fieldName) {
    throw new Error(`${label} changedFields must be exactly ["${fieldName}"].`);
  }
}

function assertSingleTextFieldNoRouteDatePublicationImageMutation(
  fieldName,
  payload,
  label = "G-9g4a2",
) {
  const forbidden = getSingleTextFieldForbiddenMutationKeys(fieldName);
  for (const key of Object.keys(payload)) {
    if (forbidden.has(key)) {
      throw new Error(`${label} forbidden payload field: ${key}`);
    }
    if (key !== fieldName) {
      throw new Error(`${label} disallowed payload field: ${key}`);
    }
  }
}

function assertSingleTextFieldPayloadOnly(
  fieldName,
  payload,
  expectedChangedFields,
  validate,
  label = "G-9g4a2",
) {
  assertSingleTextFieldChangedFieldsOnly(fieldName, expectedChangedFields, label);
  assertSingleTextFieldNoRouteDatePublicationImageMutation(fieldName, payload, label);
  const keys = Object.keys(payload);
  if (keys.length !== 1 || !keys.includes(fieldName)) {
    throw new Error(`${label} payload must be exactly { ${fieldName}: string }.`);
  }
  const value = payload[fieldName];
  if (typeof value !== "string" || !validate(value)) {
    throw new Error(`${label} ${fieldName} must be a non-empty string.`);
  }
}

function buildSingleTextFieldPayload(fieldName, rawValue, validate, label = "G-9g4a2") {
  const trimmed = rawValue.trim();
  if (!validate(trimmed)) {
    throw new Error(`${label} ${fieldName} cannot be empty.`);
  }
  return { [fieldName]: trimmed };
}

function nonEmptyTrimmedSingleTextFieldValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

const REGISTRY_ARMS = [
  { fieldName: "open_time", envArm: OPEN_TIME_ENV_ARM },
  { fieldName: "start_time", envArm: START_TIME_ENV_ARM },
  { fieldName: "price", envArm: PRICE_ENV_ARM },
];

function isEnvArmTrue(env, envArm) {
  return String(env[envArm] ?? "").trim() === "true";
}

function detectMultipleRegistryEnvArms(env) {
  const armed = REGISTRY_ARMS.filter((entry) => isEnvArmTrue(env, entry.envArm)).map(
    (entry) => entry.fieldName,
  );
  if (armed.length > 1) {
    return `Multiple single-text-field registry arms on: ${armed.join(", ")}`;
  }
  return null;
}

function collectOtherRegistryEnvArmFailures(env, exceptFieldName) {
  const failures = [];
  for (const entry of REGISTRY_ARMS) {
    if (exceptFieldName && entry.fieldName === exceptFieldName) continue;
    if (isEnvArmTrue(env, entry.envArm)) {
      failures.push(`${entry.envArm} must be off`);
    }
  }
  return failures;
}

// --- Source files ---

const registrySrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-registry.ts",
);
const genericConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-config.ts",
);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const openTimeConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-config.ts",
);
const venueConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-config.ts",
);
const g9g3gConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);
const g9g3g5ConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-restore-config.ts",
);

// --- Registry ---

const registryEntries = parseRegistryEntries(registrySrc);
const fieldNames = registryEntries.map((e) => e.fieldName);
assert("registry has open_time", fieldNames.includes("open_time"));
assert("registry has start_time", fieldNames.includes("start_time"));
assert("registry has price", fieldNames.includes("price"));
assert("registry has exactly 3 fields", registryEntries.length === 3);

function evalApprovalId(raw) {
  if (raw.includes("G9G4A2A")) return OPEN_TIME_APPROVAL;
  if (raw.includes("G9G4A2B")) return START_TIME_APPROVAL;
  if (raw.includes("G9G4A2C")) return PRICE_APPROVAL;
  return raw;
}

function resolveEnvArm(raw) {
  if (raw.includes("G9G4A2A")) return OPEN_TIME_ENV_ARM;
  if (raw.includes("G9G4A2B")) return START_TIME_ENV_ARM;
  if (raw.includes("G9G4A2C")) return PRICE_ENV_ARM;
  return raw;
}

const resolvedApprovalIds = registryEntries.map((e) => evalApprovalId(e.approvalId));
const resolvedEnvArms = registryEntries.map((e) => resolveEnvArm(e.envArm));
const uiIdPrefixes = registryEntries.map((e) => e.uiIdPrefix);
const reclickModes = registryEntries.map((e) => e.reclickMode);

assert("approvalId unique x3", unique(resolvedApprovalIds));
assert("envArm unique x3", unique(resolvedEnvArms));
assert("uiIdPrefix unique x3", unique(uiIdPrefixes));
assert("reclickMode unique x3", unique(reclickModes));

const openTimeEntry = registryEntries.find((e) => e.fieldName === "open_time");
assert("open_time approvalId unchanged", evalApprovalId(openTimeEntry.approvalId) === OPEN_TIME_APPROVAL);
assert(
  "open_time approvalId matches types constant",
  OPEN_TIME_APPROVAL === G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
);
assert("open_time envArm unchanged", resolvedEnvArms[fieldNames.indexOf("open_time")] === OPEN_TIME_ENV_ARM);
assert("open_time uiIdPrefix unchanged", openTimeEntry.uiIdPrefix === OPEN_TIME_UI_PREFIX);
assert("open_time reclickMode open-time-only", openTimeEntry.reclickMode === "open-time-only");
assert("start_time reclickMode start-time-only", reclickModes.includes("start-time-only"));
assert("price reclickMode price-only", reclickModes.includes("price-only"));

assert("validate rejects empty string", nonEmptyTrimmedSingleTextFieldValue("") === false);
assert("validate rejects whitespace only", nonEmptyTrimmedSingleTextFieldValue("   ") === false);
assert("validate accepts non-empty trimmed", nonEmptyTrimmedSingleTextFieldValue("19:00") === true);

// --- Types ---

assert(
  "G9G4A2B approvalId in SCHEDULE_WRITE_APPROVAL_IDS",
  SCHEDULE_WRITE_APPROVAL_IDS.includes(G9G4A2B_SCHEDULE_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID),
);
assert(
  "G9G4A2C approvalId in SCHEDULE_WRITE_APPROVAL_IDS",
  SCHEDULE_WRITE_APPROVAL_IDS.includes(G9G4A2C_SCHEDULE_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID),
);
assert(
  "G9G4A2A approvalId still in SCHEDULE_WRITE_APPROVAL_IDS",
  SCHEDULE_WRITE_APPROVAL_IDS.includes(G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID),
);
assert("G9G4A2B type in union", typesSrc.includes("ScheduleG9G4a2bStartTimeOnlyNonDryRunApprovalId"));
assert("G9G4A2C type in union", typesSrc.includes("ScheduleG9G4a2cPriceOnlyNonDryRunApprovalId"));

// --- Source presence ---

assert("registry module exists", registrySrc.includes("SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY"));
assert("generic config module exists", genericConfigSrc.includes("getSingleTextFieldOperationalConfig"));
assert("collectOtherRegistryEnvArmFailures exported", registrySrc.includes("collectOtherRegistryEnvArmFailures"));
assert("detectMultipleRegistryEnvArms exported", registrySrc.includes("detectMultipleRegistryEnvArms"));
assert("routine dev safety hint in registry", registrySrc.includes("SINGLE_TEXT_FIELD_OPERATIONAL_ROUTINE_DEV_SAFETY_HINT"));

assert("assertSingleTextFieldChangedFieldsOnly", guardsSrc.includes("assertSingleTextFieldChangedFieldsOnly"));
assert("assertSingleTextFieldPayloadOnly", guardsSrc.includes("assertSingleTextFieldPayloadOnly"));
assert("assertSingleTextFieldNoRouteDatePublicationImageMutation", guardsSrc.includes("assertSingleTextFieldNoRouteDatePublicationImageMutation"));
assert("assertSingleTextFieldApproval", guardsSrc.includes("assertSingleTextFieldApproval"));
assert("buildSingleTextFieldPayload", guardsSrc.includes("buildSingleTextFieldPayload"));

assert(
  "existing assertG9G4a2aOpenTimeOnlyPayloadOnly preserved",
  guardsSrc.includes("assertG9G4a2aOpenTimeOnlyPayloadOnly"),
);
assert(
  "existing buildG9G4a2aOpenTimeOnlyPayload preserved",
  guardsSrc.includes("buildG9G4a2aOpenTimeOnlyPayload"),
);
assert(
  "open_time-only config not delegated to generic config",
  !openTimeConfigSrc.includes("getSingleTextFieldOperationalConfig"),
);
assert(
  "open_time-only config still uses own getG9G4a2aOpenTimeOnlyOperationalConfig",
  openTimeConfigSrc.includes("getG9G4a2aOpenTimeOnlyOperationalConfig"),
);

// --- Generic config static ---

assert("generic config uses detectMultipleRegistryEnvArms", genericConfigSrc.includes("detectMultipleRegistryEnvArms"));
assert(
  "generic config uses collectOtherRegistryEnvArmFailures with exceptFieldName",
  genericConfigSrc.includes("collectOtherRegistryEnvArmFailures(mergedEnv, entry.fieldName)"),
);
assert("generic config exposes routineDevSafetyHint", genericConfigSrc.includes("routineDevSafetyHint"));
assert("generic config per-field changedFields", genericConfigSrc.includes("changedFields: [entry.fieldName]"));

// --- Mutual exclusion static ---

assert(
  "venue config uses collectOtherRegistryEnvArmFailures",
  venueConfigSrc.includes("collectOtherRegistryEnvArmFailures"),
);
assert(
  "g9g3g config uses collectOtherRegistryEnvArmFailures",
  g9g3gConfigSrc.includes("collectOtherRegistryEnvArmFailures"),
);
assert(
  "g9g3g5 config uses collectOtherRegistryEnvArmFailures",
  g9g3g5ConfigSrc.includes("collectOtherRegistryEnvArmFailures"),
);
assert(
  "venue config no longer hardcodes only g9g4a2a arm check",
  !venueConfigSrc.includes("g9g4a2aArmed"),
);
assert(
  "g9g3g config no longer hardcodes only g9g4a2a arm check",
  !g9g3gConfigSrc.includes("g9g4a2aArmed"),
);
assert(
  "g9g3g5 config no longer hardcodes only g9g4a2a arm check",
  !g9g3g5ConfigSrc.includes("g9g4a2aArmed"),
);

// --- Config constants ---

assert("G9G4A2B approval in site-slug-config", configSrc.includes(START_TIME_APPROVAL));
assert("G9G4A2C approval in site-slug-config", configSrc.includes(PRICE_APPROVAL));
assert("G9G4A2A approval unchanged in site-slug-config", configSrc.includes(OPEN_TIME_APPROVAL));
assert("G9G4A2B env arm in site-slug-config", configSrc.includes(START_TIME_ENV_ARM));
assert("G9G4A2C env arm in site-slug-config", configSrc.includes(PRICE_ENV_ARM));
assert("open_time uiIdPrefix unchanged in site-slug-config", configSrc.includes(OPEN_TIME_UI_PREFIX));

// --- Generic guard runtime (mirrored) ---

const validate = nonEmptyTrimmedSingleTextFieldValue;

assertThrows(
  "generic guard rejects multi-key payload",
  () =>
    assertSingleTextFieldPayloadOnly(
      "open_time",
      { open_time: "19:00", venue: "x" },
      ["open_time"],
      validate,
    ),
  "forbidden payload field: venue",
);

assertThrows(
  "generic guard rejects metadata date mutation",
  () =>
    assertSingleTextFieldPayloadOnly("price", { price: "3000", date: "2026-07-01" }, ["price"], validate),
  "forbidden payload field: date",
);

assertThrows(
  "generic guard rejects publication mutation",
  () =>
    assertSingleTextFieldPayloadOnly(
      "start_time",
      { start_time: "20:00", published: true },
      ["start_time"],
      validate,
    ),
  "forbidden payload field: published",
);

assertThrows(
  "generic guard rejects image_url mutation",
  () =>
    assertSingleTextFieldPayloadOnly(
      "open_time",
      { open_time: "19:00", image_url: "http://x" },
      ["open_time"],
      validate,
    ),
  "forbidden payload field: image_url",
);

assertThrows(
  "generic guard rejects whitespace only open_time",
  () =>
    assertSingleTextFieldPayloadOnly("open_time", { open_time: "   " }, ["open_time"], validate),
  "non-empty string",
);

assertThrows(
  "buildSingleTextFieldPayload rejects whitespace",
  () => buildSingleTextFieldPayload("price", "  ", validate),
  "cannot be empty",
);

let singleKeyOk = false;
try {
  assertSingleTextFieldPayloadOnly(
    "start_time",
    { start_time: "20:00" },
    ["start_time"],
    validate,
  );
  singleKeyOk = true;
} catch {
  singleKeyOk = false;
}
assert("generic guard accepts valid single-field payload", singleKeyOk);

const built = buildSingleTextFieldPayload("price", "  3000円  ", validate);
assert("buildSingleTextFieldPayload trims value", built.price === "3000円");

// --- Registry mutual exclusion helpers (mirrored) ---

const multiArmEnv = {
  [OPEN_TIME_ENV_ARM]: "true",
  [START_TIME_ENV_ARM]: "true",
};
const multiArmMsg = detectMultipleRegistryEnvArms(multiArmEnv);
assert("detectMultipleRegistryEnvArms detects two arms", multiArmMsg !== null);
assert(
  "detectMultipleRegistryEnvArms message lists fields",
  multiArmMsg?.includes("open_time") && multiArmMsg?.includes("start_time"),
);

const otherFailures = collectOtherRegistryEnvArmFailures({ [PRICE_ENV_ARM]: "true" });
assert("collectOtherRegistryEnvArmFailures detects price arm", otherFailures.includes(`${PRICE_ENV_ARM} must be off`));
assert(
  "collectOtherRegistryEnvArmFailures excludes own field",
  collectOtherRegistryEnvArmFailures({ [PRICE_ENV_ARM]: "true" }, "price").length === 0,
);

// --- Mutual exclusion runtime via mirrored helper + config source contract ---

const venueFailures = collectOtherRegistryEnvArmFailures({ [PRICE_ENV_ARM]: "true" });
assert(
  "venue mutual exclusion would block price arm",
  venueConfigSrc.includes("collectOtherRegistryEnvArmFailures(mergedEnv)") &&
    venueFailures.some((f) => f.includes(PRICE_ENV_ARM)),
);

const g9g3gFailures = collectOtherRegistryEnvArmFailures({ [START_TIME_ENV_ARM]: "true" });
assert(
  "g9g3g mutual exclusion would block start_time arm",
  g9g3gConfigSrc.includes("collectOtherRegistryEnvArmFailures(mergedEnv)") &&
    g9g3gFailures.some((f) => f.includes(START_TIME_ENV_ARM)),
);

const g9g3g5Failures = collectOtherRegistryEnvArmFailures({
  [OPEN_TIME_ENV_ARM]: "true",
  [PRICE_ENV_ARM]: "true",
});
assert(
  "g9g3g5 mutual exclusion would block multiple registry arms",
  g9g3g5ConfigSrc.includes("collectOtherRegistryEnvArmFailures(mergedEnv)") &&
    g9g3g5Failures.length === 2,
);

assert("phase marker G-9g4a2 in registry", registrySrc.includes("G-9g4a2"));

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

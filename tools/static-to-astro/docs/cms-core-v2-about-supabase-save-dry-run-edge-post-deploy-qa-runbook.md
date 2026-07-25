# CMS Core v2 — About Supabase Edge post-deploy QA runbook (manual)

**Phase:** `cms-core-v2-about-supabase-save-dry-run-edge-post-deploy-qa-runbook`
**Status:** **runbook ready** — operator executes manually; **Cursor does not** invoke Edge / SQL / Secrets / FTP
**Date:** 2026-07-26
**Staging:** `kmjqppxjdnwwrtaeqjta`
**Production STOP:** `vsbvndwuajjhnzpohghh`
**Function:** `gosaki-about-supabase-save-dry-run` (deployed)
**Save arm:** `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` remote **unset** — keep unset
**Prior:** [edge-deploy-preflight](./cms-core-v2-about-supabase-save-dry-run-edge-deploy-preflight.md)

```txt
ABOUT_SUPABASE_EDGE_POST_DEPLOY_QA_RUNBOOK_READY: true
EDGE_DEPLOY_EXECUTED: true
POST_DEPLOY_QA_EXECUTED: false
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED_SET: false
SERVICE_ROLE_USED: false
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
```

---

## Locked constants (from handler)

| Item | Value |
| --- | --- |
| Function URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run` |
| `siteSlug` | `gosaki-piano` |
| `pageKey` / `fieldKey` | `about` / `profile.lede` |
| Dry-run approval | `G-cms-v2-about-supabase-profile-lede-dry-run` |
| Save approval | `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice` |
| Seed `value_text` (expected) | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| Seed `published` / `sort_order` | `true` / `10` |

### Dry-run request body

```json
{
  "operation": "dryRun",
  "approvalId": "G-cms-v2-about-supabase-profile-lede-dry-run",
  "siteSlug": "gosaki-piano",
  "pageKey": "about",
  "fieldKey": "profile.lede",
  "nextValueText": "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。"
}
```

(`nextValueText` = seed → expect `noChange: true`. Any non-empty different string → `changedFields: ["value_text"]`, still `didWrite: false`.)

### Save probe body (must stay **disarmed**)

```json
{
  "operation": "save",
  "approvalId": "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice",
  "siteSlug": "gosaki-piano",
  "pageKey": "about",
  "fieldKey": "profile.lede",
  "nextValueText": "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
  "expectedBeforeUpdatedAt": "<from dry-run before.updatedAt — do not paste to chat>"
}
```

### Success response fields to check (log booleans / status only)

| Field | Dry-run 200 | Save disarmed 403 |
| --- | --- | --- |
| `ok` | `true` | `false` |
| `operation` | `dryRun` | (may be absent; body has `error`) |
| `error` | absent | `save_not_armed` |
| `didWrite` / `dbWrite` | `false` | `false` |
| `pageKey` / `fieldKey` | `about` / `profile.lede` | present in plan |
| `before` / `after` / `fingerprint` | present | may be present |
| `saveArmed` | — | `false` |

**Do not** log / paste / screenshot: email, UUID (`before.rowId`), JWT, access_token, anon key, full `Authorization` header.

---

## Prep (once)

1. Open staging Gosaki admin (owner account) and **sign in**.
2. DevTools Console — confirm `window.__gosakiAdminSupabaseClient` exists.
3. Run **baseline SELECT** (step 0 below). Note privately: `value_text` match + `updated_at` (do not paste UUID/email/token).

**Global STOP:** wrong project · production URL · desire to set Save arm · INSERT/UPDATE/DELETE · migration/RLS/seed re-run · FTP · ambiguity → stop, do not retry, ask human.

---

## Step 0 — Baseline seed row (SELECT only)

```js
(async () => {
  const client = window.__gosakiAdminSupabaseClient;
  if (!client) throw new Error("login first");
  const { data, error } = await client
    .from("site_page_fields")
    .select("site_slug,page_key,field_key,value_text,published,sort_order,updated_at")
    .eq("site_slug", "gosaki-piano")
    .eq("page_key", "about")
    .eq("field_key", "profile.lede")
    .maybeSingle();
  const expected =
    "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
  window.__aboutSbBaseline = {
    valueTextMatch: data?.value_text === expected,
    published: data?.published === true,
    sortOrder: data?.sort_order,
    updatedAtPresent: Boolean(data?.updated_at),
    updatedAt: data?.updated_at,
  };
  console.log({
    selectError: error?.message ?? null,
    site_slug: data?.site_slug,
    page_key: data?.page_key,
    field_key: data?.field_key,
    valueTextMatch: window.__aboutSbBaseline.valueTextMatch,
    published: window.__aboutSbBaseline.published,
    sortOrder: window.__aboutSbBaseline.sortOrder,
    updatedAtPresent: window.__aboutSbBaseline.updatedAtPresent,
  });
})();
```

| Success | STOP |
| --- | --- |
| `valueTextMatch: true` · `published: true` · `sortOrder: 10` · `updatedAtPresent: true` | row missing · wrong text · write attempted |

---

## Shared helper (owner JWT · no token logging)

Paste once; reuse for steps 3–6.

```js
window.__aboutSbCall = async (body) => {
  const client = window.__gosakiAdminSupabaseClient;
  if (!client) throw new Error("login first");
  const { data: sess } = await client.auth.getSession();
  const token = sess?.session?.access_token;
  if (!token) throw new Error("no session");
  const res = await fetch(
    "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: client.supabaseKey,
      },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json().catch(() => ({}));
  return {
    status: res.status,
    ok: json.ok,
    error: json.error ?? null,
    didWrite: json.didWrite,
    dbWrite: json.dbWrite,
    operation: json.operation ?? null,
    noChange: json.noChange,
    changedFields: json.changedFields,
    pageKey: json.pageKey,
    fieldKey: json.fieldKey,
    saveArmed: json.saveArmed,
    beforeUpdatedAt: json.before?.updatedAt ?? null,
    valueTextMatchBefore:
      json.before?.valueText ===
      "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
  };
};
```

---

## Step 1 — OPTIONS

```bash
curl -sS -D - -o /dev/null -X OPTIONS \
  "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run"
```

| Success | STOP |
| --- | --- |
| HTTP **200** · `Access-Control-Allow-Origin: *` · `Access-Control-Allow-Headers` includes `authorization` | production host · hang · non-CORS response |

---

## Step 2 — JWT なし → 401

```bash
curl -sS -D - -o /tmp/about-sb-unauth.json -X POST \
  "https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-about-supabase-save-dry-run" \
  -H "Content-Type: application/json" \
  -d '{"operation":"dryRun","siteSlug":"gosaki-piano","pageKey":"about","fieldKey":"profile.lede","nextValueText":"qa","approvalId":"G-cms-v2-about-supabase-profile-lede-dry-run"}'
```

Do **not** add `Authorization`. Do not paste response bodies that contain secrets.

| Success | STOP |
| --- | --- |
| HTTP **401** | 200 · any write · production URL |

---

## Step 3 — owner JWT dry-run → 200

```js
(async () => {
  const summary = await window.__aboutSbCall({
    operation: "dryRun",
    approvalId: "G-cms-v2-about-supabase-profile-lede-dry-run",
    siteSlug: "gosaki-piano",
    pageKey: "about",
    fieldKey: "profile.lede",
    nextValueText: "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
  });
  window.__aboutSbLastDry = summary;
  console.log(summary);
})();
```

| Success | STOP |
| --- | --- |
| `status: 200` · `ok: true` · `operation: "dryRun"` · `valueTextMatchBefore: true` · `pageKey/fieldKey` correct | 401/403/404/500 · production |

---

## Step 4 — `didWrite=false`

Use Step 3 summary (no extra call).

| Success | STOP |
| --- | --- |
| `didWrite: false` · `dbWrite: false` | either flag `true` |

---

## Step 5 — Save → 403 `save_not_armed`

```js
(async () => {
  const summary = await window.__aboutSbCall({
    operation: "save",
    approvalId: "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice",
    siteSlug: "gosaki-piano",
    pageKey: "about",
    fieldKey: "profile.lede",
    nextValueText: "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。",
    expectedBeforeUpdatedAt: window.__aboutSbBaseline?.updatedAt,
  });
  console.log(summary);
})();
```

| Success | STOP |
| --- | --- |
| `status: 403` · `error: "save_not_armed"` · `didWrite: false` · `saveArmed: false` | 200 · `didWrite: true` · urge to set Secret |

**Forbidden:** `supabase secrets set GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=…`

---

## Step 6 — wrong `pageKey` / `fieldKey` → 400

```js
(async () => {
  const badPage = await window.__aboutSbCall({
    operation: "dryRun",
    approvalId: "G-cms-v2-about-supabase-profile-lede-dry-run",
    siteSlug: "gosaki-piano",
    pageKey: "home",
    fieldKey: "profile.lede",
    nextValueText: "qa",
  });
  const badField = await window.__aboutSbCall({
    operation: "dryRun",
    approvalId: "G-cms-v2-about-supabase-profile-lede-dry-run",
    siteSlug: "gosaki-piano",
    pageKey: "about",
    fieldKey: "profile.bio",
    nextValueText: "qa",
  });
  console.log({ badPage, badField });
})();
```

| Success | STOP |
| --- | --- |
| both `status: 400` · `error: "only about/profile.lede is supported in this slice"` | 200 · write |

---

## Step 7 — seed row unchanged (after → before)

SELECT again into a **separate** object. Do **not** overwrite `window.__aboutSbBaseline`.

```js
(async () => {
  const client = window.__gosakiAdminSupabaseClient;
  if (!client) throw new Error("login first");
  if (!window.__aboutSbBaseline?.updatedAt) {
    throw new Error("run Step 0 baseline first");
  }
  const { data, error } = await client
    .from("site_page_fields")
    .select("site_slug,page_key,field_key,value_text,published,sort_order,updated_at")
    .eq("site_slug", "gosaki-piano")
    .eq("page_key", "about")
    .eq("field_key", "profile.lede")
    .maybeSingle();
  const expected =
    "後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。";
  const after = {
    valueTextMatch: data?.value_text === expected,
    published: data?.published === true,
    sortOrder: data?.sort_order,
    updatedAtPresent: Boolean(data?.updated_at),
    updatedAtUnchanged:
      data?.updated_at === window.__aboutSbBaseline.updatedAt,
  };
  window.__aboutSbAfter = after;
  console.log({
    selectError: error?.message ?? null,
    site_slug: data?.site_slug,
    page_key: data?.page_key,
    field_key: data?.field_key,
    valueTextMatch: after.valueTextMatch,
    published: after.published,
    sortOrder: after.sortOrder,
    updatedAtPresent: after.updatedAtPresent,
    updatedAtUnchanged: after.updatedAtUnchanged,
  });
})();
```

| Success | STOP |
| --- | --- |
| `valueTextMatch: true` · `published: true` · `sortOrder: 10` · `updatedAtPresent: true` · `updatedAtUnchanged: true` | any of those false · baseline overwritten · write attempted · no cleanup SQL · ask human |

---

## Step 8 — no impact on other Functions / production

| Check | How | Success | STOP |
| --- | --- | --- | --- |
| Production | Do **not** open / call `vsbvndwuajjhnzpohghh` | untouched | any production call |
| Other Edges | Optional: Contents About / YouTube admin still loads (no redeploy) | staging admin OK | mass failure after this QA only — ask human |
| Secrets | Confirm you did **not** set `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | still unset | arm set |

---

## Pass / fail record (safe fields only)

```txt
Step1 OPTIONS: PASS|FAIL
Step2 unauth 401: PASS|FAIL
Step3 dry-run 200: PASS|FAIL
Step4 didWrite false: PASS|FAIL
Step5 save_not_armed 403: PASS|FAIL
Step6 allowlist 400: PASS|FAIL
Step7 seed unchanged: PASS|FAIL
Step8 no production / no arm: PASS|FAIL
POST_DEPLOY_QA_EXECUTED: true|false
```

Do not attach JWT, UUID, email, or token dumps.

---

## After all PASS

Next gate (separate phase): Admin-path package bake (`PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED`) → operator manual FTP + [ftp-post-qa](./cms-core-v2-about-supabase-ftp-post-qa.md).
Keep Save arms **false**.

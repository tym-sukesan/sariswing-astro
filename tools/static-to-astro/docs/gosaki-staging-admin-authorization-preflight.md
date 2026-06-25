# G-11c4c — Gosaki staging admin authorization preflight

**Phase:** `G-11c4c-admin-authorization-preflight`  
**Status:** **preflight complete** — 403 root cause identified; remediation options documented; **no secrets / deploy / Auth mutation executed**  
**Date:** 2026-06-25  
**Prior:** G-11c4b-fix upload + browser E2E (commit `ecca35e` area); dry-run returned **403 Forbidden**

| Check | Status |
| --- | --- |
| Auth login (staging admin UI) | **OK** |
| JWT reaches Edge Function | **OK** |
| `requireAdminUser` admin gate | **NG** → **403** |
| DB / JSON write | **none** |

---

## Gates

```txt
gosakiStagingAdminAuthorizationPreflightComplete: true
phase: G-11c4c-admin-authorization-preflight
readyForG11c4dStagingAdminEmailsSecretExecution: true
supabaseSecretsSetExecuted: false
supabaseFunctionsDeployExecuted: false
authUserMetadataMutationExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
```

---

## 1. Browser E2E result (operator — G-11c4c)

**Staging admin:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`

| Step | Result |
| --- | --- |
| G-11c4b-fix UI | reflected |
| Supabase Auth configured | **yes** |
| Login | **success** |
| Dry-run POST with JWT | reached function |
| HTTP status | **403** |
| Body | `Forbidden` — admin access required |

```json
{
  "httpStatus": 403,
  "body": {
    "error": "Forbidden",
    "detail": "Admin access required (app_metadata.role=admin or email listed in ADMIN_EMAILS)"
  }
}
```

**Interpretation:**

```txt
Auth login: OK
JWT request: OK
Edge Function reachability: OK
admin authorization: NG
DB write: none
JSON write: none
```

---

## 2. `requireAdminUser` admin判定条件

Source: `supabase/functions/_shared/admin-auth.ts`

### Flow

1. `Authorization: Bearer <access_token>` required — missing → **401**
2. `auth.getUser()` with anon key + JWT — invalid → **401**
3. `isAdminUser(user)` — false → **403** (this E2E case)
4. else → `{ user }` passed to handler

### `isAdminUser(user)` — **either** condition grants admin

| # | Condition | Notes |
| --- | --- | --- |
| A | `user.app_metadata.role === "admin"` | exact string `"admin"` |
| B | `user.email` (lowercased) ∈ `ADMIN_EMAILS` allowlist | comma-separated Edge secret |

If `ADMIN_EMAILS` is unset or empty **and** role is not admin → **all authenticated users fail** at step 3.

```ts
// admin-auth.ts (summary)
if (user.app_metadata?.role === "admin") return true;
const allowlist = getAdminEmailAllowlist(); // Deno.env.get("ADMIN_EMAILS")
if (allowlist.size === 0) return false;
return allowlist.has(user.email?.trim().toLowerCase());
```

`gosaki-youtube-url-dry-run/index.ts` calls `requireAdminUser` **before** dry-run body handling — no bypass.

---

## 3. 403 原因確定

| Layer | E2E evidence |
| --- | --- |
| Gateway JWT (`verify_jwt`) | passed (would be 401 if missing) |
| `getUser()` | passed (would be 401 if invalid JWT) |
| `isAdminUser()` | **failed** |

**Root cause:** The staging user who logged in has:

- `app_metadata.role` **≠** `"admin"`, **and**
- email **not** in project Edge secret `ADMIN_EMAILS` (or `ADMIN_EMAILS` unset / empty on `static-to-astro-cms-staging`)

This matches the exact 403 `detail` string returned to the browser.

**Not the cause:** dry-run payload validation, RLS, DB permissions, or missing `service_role` (function does not use service_role).

---

## 4. `ADMIN_EMAILS` secret 方式 — 使えるか

**Yes — recommended for staging Gosaki dry-run.**

| Item | Assessment |
| --- | --- |
| Matches existing `admin-auth.ts` | **yes** — same gate as `admin-schedule`, `trigger-deploy`, etc. |
| DB / table write | **no** |
| `service_role` in browser | **no** |
| Code change | **no** |
| `supabase functions deploy` after secret only | **not required** (see §9) |
| Staging-only scope | set on `kmjqppxjdnwwrtaeqjta` only |

### Documented command (NOT executed in G-11c4c)

Use the **same email address** the operator used to log in on staging admin (do not log the value):

```bash
# STAGING ONLY — Operator explicit approval required (G-11c4d+)
supabase secrets set ADMIN_EMAILS="<staging-admin-email>" \
  --project-ref kmjqppxjdnwwrtaeqjta
```

Multiple admins (comma-separated, no spaces required but trim-safe in code):

```bash
supabase secrets set ADMIN_EMAILS="admin1@example.com,admin2@example.com" \
  --project-ref kmjqppxjdnwwrtaeqjta
```

### Preflight verification (read-only — G-11c4d operator)

```bash
# Names only — do not paste secret values
supabase secrets list --project-ref kmjqppxjdnwwrtaeqjta
```

Expect `ADMIN_EMAILS` to appear after execution phase.

### Rollback (documented — not executed)

```bash
# Remove allowlist entry — Operator approval only
supabase secrets unset ADMIN_EMAILS --project-ref kmjqppxjdnwwrtaeqjta
```

Or set to empty/disallowed emails. Function returns 403 for non-admin users again.

---

## 5. `app_metadata.role=admin` 方式との比較

| | **ADMIN_EMAILS** (recommended) | **app_metadata.role=admin** |
| --- | --- | --- |
| Mechanism | Edge project secret env var | Per-user Auth metadata |
| DB `public.*` write | **no** | **no** |
| Auth user mutation | **no** | **yes** (`auth.users` metadata) |
| `service_role` / Admin API | **not required** for secret set | typically Dashboard SQL or Admin API |
| Redeploy function | **no** (secret-only) | **no** |
| Aligns with Gosaki static admin | **yes** — login email maps 1:1 | yes but heavier ops |
| Multi-user | comma-separated emails | per-user metadata updates |
| Production risk if mis-targeted | low if ref gated | medium — wrong project/user |

**G-11c4c recommendation:** prefer **`ADMIN_EMAILS` on staging project `kmjqppxjdnwwrtaeqjta`** for the operator account that already logs in successfully.

---

## 6. 推奨手順案（次フェーズ G-11c4d — 未実行）

### Operator approval required

```txt
承認します。この操作を1回だけ実行してください。
```

### Steps (G-11c4d execution — documented only)

1. Confirm CLI target: **`kmjqppxjdnwwrtaeqjta`** — **not** `vsbvndwuajjhnzpohghh`
2. Confirm login email used on staging admin (operator knows; do not log in chat)
3. Run **once**:

```bash
supabase secrets set ADMIN_EMAILS="<staging-admin-email>" \
  --project-ref kmjqppxjdnwwrtaeqjta
```

4. **Do not** re-run `supabase functions deploy` for secret-only change
5. Browser: reload staging admin → login → dry-run again
6. Expect **200** with `ok: true`, `dryRun: true`, `wouldWrite: false` (valid YouTube URL)
7. Confirm **no** DB row changes, **no** JSON repo changes

### If still 403 after secret set

- Email typo / case (code lowercases — case OK)
- Wrong Supabase project ref
- Stale session — sign out and sign in again
- Check Edge Function logs (Dashboard) — still `isAdminUser` false

---

## 7. Staging ref 確認

| Item | Value |
| --- | --- |
| Project name | `static-to-astro-cms-staging` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Function URL | `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-youtube-url-dry-run` |

---

## 8. Production ref 未使用確認

| Item | Value |
| --- | --- |
| Blocked production ref | `vsbvndwuajjhnzpohghh` (`sari-site`) |
| G-11c4c operations on production | **none** |

---

## 9. `supabase functions deploy` 再実行が必要か

| Change type | Redeploy `gosaki-youtube-url-dry-run`? |
| --- | --- |
| **`ADMIN_EMAILS` secret only** | **No** — runtime env injection on staging; next invocation picks up secret |
| `admin-auth.ts` source change | **Yes** — not applicable (already deployed G-11c3b) |
| `config.toml` / function code change | **Yes** — not in scope |

**G-11c4c conclusion:** secret-only remediation does **not** require redeploy.

---

## 10. Safety — G-11c4c phase

| Item | Status |
| --- | --- |
| `supabase secrets set` | **not executed** |
| Auth user metadata change | **not executed** |
| DB / SQL write | **not executed** |
| JSON write | **not executed** |
| `supabase functions deploy` | **not executed** |
| FTP / upload | **not executed** |
| Secrets / tokens in docs | **placeholders only** |

---

## 11. Local verification

```bash
node tools/static-to-astro/scripts/verify-g11c4c-admin-authorization-preflight.mjs
```

---

## 12. Next phase

`G-11c4d-staging-admin-emails-secret-execution` — operator-approved **one-time** `ADMIN_EMAILS` set on staging → browser dry-run re-test.

---

## References

- `supabase/functions/_shared/admin-auth.ts`
- `supabase/functions/gosaki-youtube-url-dry-run/index.ts`
- `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`
- `gosaki-staging-admin-auth-configured-login-button-enable-fix.md`
- `docs/production.md` § Admin access (method A/B)

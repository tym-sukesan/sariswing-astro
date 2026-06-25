# G-11c4b-fix — Gosaki staging admin auth configured login button enable

**Phase:** `G-11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable`  
**Status:** **complete** — auth UI fixed; login enabled when configured; package regenerated; **no FTP**  
**Date:** 2026-06-25  
**Prior:** G-11c4b package prep (commit `3bf783c`); operator upload showed auth UI inconsistency

| Check | Status |
| --- | --- |
| Duplicate「未設定」runtime message | **fixed** |
| Login button enabled when configured | **yes** |
| Dry-run button disabled until login | **yes** |
| Save / Publish / Deploy | **disabled** |

---

## Gates

```txt
gosakiStagingAdminAuthConfiguredLoginButtonEnableFixComplete: true
phase: G-11c4b-fix
readyForG11c4cStagingAdminAuthDryRunE2eAfterUpload: true
cursorFtpUploadExecuted: false
supabaseEdgeFunctionDeployExecuted: false
```

---

## 1. Problem

After G-11c4b upload, operator saw:

- Static **Supabase Auth: configured** banner (correct)
- Runtime **gra-auth-status** also showed「Supabase Auth 未設定 — PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY が build に必要です」
- Login button appeared **disabled**

### Root cause

1. Inline script called `getSupabaseClient()` before Supabase CDN UMD finished loading → returned `null` even when `data-gosaki-supabase-auth-configured="true"`.
2. `refreshAuthStatus()` treated `null` client as env **未設定** and wrote that message to `gra-auth-status`.
3. Login form started `hidden`; dry-run button was not gated on `signedIn`.

---

## 2. Fix

| Item | Change |
| --- | --- |
| Env vs client | Separate `supabaseAuthConfigured` (data attr) from Supabase JS availability |
| CDN wait | `waitForSupabaseClient()` polls up to 4s before session check |
| Status text |「未設定」only when `supabaseAuthConfigured === false` |
| Login form | Visible at build time when configured (`hidden={!supabaseAuthConfigured}`) |
| Login button | `disabled={!supabaseAuthConfigured}` → enabled when configured |
| Logout button | `disabled` until signed in |
| Dry-run button | `disabled` until signed in (`signedIn` flag) |

---

## 3. Build (executed)

```bash
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g11c4b-fix-gosaki-staging-admin-auth-configured-login-button-enable.mjs
```

---

## 4. Safety

| Item | Status |
| --- | --- |
| `service_role` in HTML | **no** |
| Anon key in tracked source | **no** |
| `.env` / `.env.local` changed | **no** |
| FTP / deploy / DB write | **no** |

---

## 5. Next

Operator re-upload `admin/index.html` from `output/manual-upload/gosaki-piano/public-dist/` → G-11c4c JWT dry-run E2E.

# G-11c4b — Gosaki staging admin Supabase Auth public env wiring package prep

**Phase:** `G-11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep`  
**Status:** **complete** — staging public env wired into admin package; auth configured in HTML; **no FTP / no deploy / no writes**  
**Date:** 2026-06-25  
**Prior:** G-11c4a endpoint wiring (commit `d116842`); operator upload showed auth unset

| Check | Status |
| --- | --- |
| `PUBLIC_SUPABASE_URL` in package build | **yes** (staging host) |
| `PUBLIC_SUPABASE_ANON_KEY` in package build | **yes** (public anon in HTML data attr) |
| `data-gosaki-supabase-auth-configured="true"` | **yes** |
| Supabase Auth 未設定 warning in built HTML | **removed** |
| FTP / upload | **no** |

---

## Gates

```txt
gosakiStagingAdminSupabaseAuthPublicEnvWiringPackagePrepComplete: true
phase: G-11c4b
readyForG11c4cStagingAdminAuthDryRunE2eAfterUpload: true
supabaseEdgeFunctionDeployExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
cursorFtpUploadExecuted: false
workflowDispatchExecuted: false
```

---

## 1. Problem (G-11c4a upload)

Operator upload after G-11c4a showed:

- dry-run endpoint: **configured**
- Staging Auth: **Supabase Auth 未設定** — `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` missing at build time

JWT dry-run E2E blocked until package rebuilt with public env.

---

## 2. Env loading design

| Component | Role |
| --- | --- |
| `scripts/lib/gosaki-staging-admin-public-env.mjs` | Read repo `.env` + `.env.local` (read-only); merge `process.env`; validate staging host |
| `scripts/build-gosaki-staging-admin-package.mjs` | One-shot convert + verify + manual-upload package with public env |
| `gosaki-staging-read-only-admin.ts` | `resolveG11c4aSupabaseUrl` / `resolveG11c4aSupabaseAnonKey` at Astro build |
| `GosakiStagingReadOnlyAdminPage.astro` | Bakes `data-gosaki-supabase-url`, `data-gosaki-supabase-anon-key`, `data-gosaki-supabase-auth-configured` |

### Required public env (values not committed)

| Variable | Source |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | `.env.local` — must be `https://kmjqppxjdnwwrtaeqjta.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env.local` — staging **anon** only |
| `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT` | optional — defaults to staging function URL |

### Blocked

- `vsbvndwuajjhnzpohghh` production host
- `SUPABASE_SERVICE_ROLE_KEY` / `service_role` in browser
- Anon key literals in tracked templates / docs / scripts

---

## 3. Admin UI (G-11c4b)

When auth env present at build:

- Static banner: **Supabase Auth: configured — ログインして dry-run を実行できます**
- `data-gosaki-supabase-auth-configured="true"`
- Login form enabled via client script
- Save / Publish / Deploy remain **disabled**

When auth env missing at build (safe fallback):

- Warning: Supabase Auth 未設定
- dry-run blocked client-side

---

## 4. Build command (executed)

```bash
node tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs
```

Env presence at build (values not logged):

```txt
PUBLIC_SUPABASE_URL: SET (staging host verified)
PUBLIC_SUPABASE_ANON_KEY: SET
PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT: UNSET → staging default used
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g11c4b-gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.mjs
```

---

## 5. Package output

- `output/static-public/gosaki-piano/public-dist/admin/index.html`
- `output/manual-upload/gosaki-piano/public-dist/admin/index.html`
- `output/manual-upload/gosaki-piano/gosaki-piano-manual-upload.zip`

Operator upload of `admin/index.html` (or full package) required for live staging E2E — **not executed in G-11c4b**.

---

## 6. Safety confirmations

| Item | Status |
| --- | --- |
| Production Supabase (`vsbvndwuajjhnzpohghh`) | **not used** |
| `service_role` in HTML / sources | **no** |
| `.env` / `.env.local` modified | **no** |
| Additional Edge Function deploy | **no** |
| DB / JSON write | **no** |
| FTP | **no** |
| `src/pages/admin` | **unchanged** |

---

## 7. Next phase

`G-11c4c-gosaki-staging-admin-auth-dry-run-e2e-after-upload` — operator re-upload `admin/` + browser login + JWT dry-run POST verification.

---

## References

- G-11c4a: `gosaki-staging-admin-youtube-dry-run-endpoint-wiring-local-prep.md`
- G-11c3b: `gosaki-youtube-url-dry-run-edge-function-deploy-execution-result.md`
- `scripts/lib/gosaki-staging-admin-public-env.mjs`

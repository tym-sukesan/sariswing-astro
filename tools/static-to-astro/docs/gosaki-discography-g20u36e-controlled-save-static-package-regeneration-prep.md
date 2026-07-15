# G-20u36e — Gosaki Discography controlled Save static package regeneration prep

**Phase:** `G-20u36e-controlled-save-static-package-regeneration-prep`  
**Status:** **complete** — prep only · **package not generated** · **output/manual-upload not updated** · **no FTP**  
**Date:** 2026-07-14  
**Prior:** [ui-visible-verification-result](./gosaki-discography-g20u36e-controlled-save-ui-visible-verification-result.md) · [post-close-result](./gosaki-discography-g20u36e-controlled-save-post-close-result.md)

| Check | Status |
| --- | --- |
| Static package regeneration prep | **yes** |
| Package generation | **no** · 未実行 |
| output/manual-upload updated | **no** · 変更なし |
| FTP / upload | **no** · 未実行 |
| Save / SQL / Edge deploy | **no** |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |

---

## Gates

```txt
gosakiDiscographyControlledSaveStaticPackageRegenerationPrepared: true
phase: G-20u36e-controlled-save-static-package-regeneration-prep
packageGenerated: false
outputManualUploadUpdated: false
ftpUploadExecuted: false
saveExecuted: false
sqlExecuted: false
edgeDeployExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u36e-controlled-save-static-package-regeneration-execution
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production STOP:** `vsbvndwuajjhnzpohghh` — **never use**.

**Why prep before generate:** UI-visible check showed Admin/Public still on **old baked snapshot**. DB Save + permission close are **PASS**. Regenerate package at **current HEAD** so convert reads latest Supabase titles into public HTML + admin snapshot JSON.

---

## 1. Context — DB vs UI

| Layer | Status |
| --- | --- |
| First controlled Save (Edge) | **PASS** · title = `On a Clear Day [CMS Kit staging G-20u36e]` |
| Permission close + post-close SELECT | **PASS** |
| Packaged STG Admin `/admin/` | **old title visible** · build-time JSON snapshot lag |
| Public `/discography/` | **old title visible** · convert/build baked HTML lag |
| Conclusion | **Not DB failure** · **static package regeneration required** |

**DB final state (reference):**

| Item | Value |
| --- | --- |
| discography-002 / track 1 | `On a Clear Day [CMS Kit staging G-20u36e]` |
| track_count | **8** |
| track_7_title | `Like a Lover` |
| title UPDATE grant | **0** (closed) |
| G-20u36e restrictive policy | **removed** |

---

## 2. Pipeline survey (read-only)

| Step | Script / path | Role |
| --- | --- | --- |
| Full staging build | `npm run build:gosaki:staging` | convert → static-public → manual-upload package |
| Convert + Supabase read | `scripts/build-site-package.mjs` → `loadDiscographyDataForBuild` | Anon SELECT at **build time** into `discographyBundle` |
| Public Discography patch | `patchDiscographyPageMainHtml` / `patchGosakiDiscographySupabaseFields` | Patches `/discography/` track titles in Wix HTML |
| Admin snapshot JSON | `scripts/lib/gosaki-staging-read-only-admin.mjs` → `buildDiscographyEditorPrototypeSnapshot` | Writes `src/data/gosaki-read-only-admin-discography-editor.json` |
| Admin page | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` | Embeds snapshot into `/admin/` textareas |
| public-dist source | `output/static-public/gosaki-piano/public-dist/` | Build output before packaging |
| Manual upload package | `output/manual-upload/gosaki-piano/` | `public-dist/` + `MANIFEST.json` + README/CHECKLIST |
| Freshness | `verify:package-freshness:gosaki:staging` | `MANIFEST.sourceCommit` must match current HEAD |
| Preflight | `preflight:gosaki:staging` | Site package + upload safety checks |

**Prior docs:** `gosaki-manual-staging-upload-package.md` · `gosaki-discography-g20u36c-admin-discography-dry-run-staging-package-rebuild-preflight.md` · `gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.md`

---

## 3. Planned commands (not executed)

### Recommended — full regeneration

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging
```

- Registry-driven: **convert** (Supabase discography read + patch) → **static-public** → **manual-upload package**
- Site: `gosaki-piano` · profile: `staging`
- Includes read-only admin (`includeReadOnlyAdmin: true`)
- Writes `output/manual-upload/gosaki-piano/` including `public-dist/` + `MANIFEST.json`
- **No FTP**

### Optional — packaging only (only if public-dist already rebuilt at same HEAD)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run manual-upload:package:gosaki:staging
```

Prefer **`build:gosaki:staging`** so convert re-reads Supabase and patches Discography + admin snapshot together.

### Dry-run plan only (safe · no writes)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run build:gosaki:staging:dry-run
```

Prints plan only — **not** a substitute for fresh package generate.

### Post-generate checks (execution phase — not this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:package-freshness:gosaki:staging
npm run preflight:gosaki:staging
npm run verify:manual-upload
```

### Do not use

| Command / profile | Why |
| --- | --- |
| `build:gosaki:production` / `manual-upload:package:gosaki:production` | production profile · wrong target |
| Any FTP / `lftp` / `mirror` / CLI upload `--apply` | G-7f suspended · manual FileZilla only |
| Generate while dirty tree or before prep commit on main | freshness / HEAD mismatch risk |

---

## 4. Package freshness rules

| # | Condition | Upload if fail |
| --- | --- | --- |
| 1 | `git status` clean before generate | **NG** |
| 2 | `HEAD` = `origin/main` before generate | **NG** |
| 3 | Package generated **after** this prep doc is on `main` at that HEAD | **NG** if prep uncommitted |
| 4 | After generate: `MANIFEST.sourceCommit` = `git rev-parse HEAD` | **NG** if mismatch |
| 5 | After generate: `MANIFEST.generatedAt` = this run's timestamp (not an old package) | **NG** if stale |
| 6 | Commit after package generate without regenerating | **NG** |
| 7 | Code/docs change after package generate without regenerating | **NG** |

**Manifest file:** `output/manual-upload/gosaki-piano/MANIFEST.json`  
**Freshness verifier:** `verify:package-freshness:gosaki:staging` — **STOP** if `sourceCommit !==` current HEAD.

**Sequencing:** commit/push this prep → clean HEAD → `build:gosaki:staging` → freshness PASS → manual upload (later phase).

---

## 5. Post-generation verification (execution phase)

**Primary title marker (PASS criterion):**

```txt
On a Clear Day [CMS Kit staging G-20u36e]
```

**Note on old title:** New title **contains** substring `On a Clear Day`. Do **not** use bare `On a Clear Day` grep alone as FAIL — use **full marker string** as primary PASS check.

| # | Check | Where |
| --- | --- | --- |
| 1 | Marker title present | `output/manual-upload/gosaki-piano/public-dist/discography/index.html` |
| 2 | Marker title present | `output/manual-upload/gosaki-piano/public-dist/admin/index.html` (embedded snapshot) |
| 3 | `Like a Lover` still present | public `discography/index.html` + admin HTML |
| 4 | track_count ≈ **8** for discography-002 / SKYLARK | snapshot or public track list section (8 lines / 8 items) |
| 5 | `MANIFEST.sourceCommit` = current `git rev-parse HEAD` | `output/manual-upload/gosaki-piano/MANIFEST.json` |
| 6 | `MANIFEST.generatedAt` is current run | same MANIFEST |
| 7 | `preflight:gosaki:staging` | **PASS** |
| 8 | `verify:package-freshness:gosaki:staging` | **PASS** |

**Optional grep (execution phase):**

```bash
cd ~/sariswing-astro/tools/static-to-astro
grep -F 'On a Clear Day [CMS Kit staging G-20u36e]' output/manual-upload/gosaki-piano/public-dist/discography/index.html
grep -F 'On a Clear Day [CMS Kit staging G-20u36e]' output/manual-upload/gosaki-piano/public-dist/admin/index.html
grep -F 'Like a Lover' output/manual-upload/gosaki-piano/public-dist/discography/index.html
```

---

## 6. Manual FTP safety rules (upload — later phase · not this phase)

| Item | Value |
| --- | --- |
| Local source | `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** |
| Remote target | `/cms-kit-staging/gosaki-piano/` |
| STG URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Method | Operator **FileZilla** (or equivalent GUI) — **manual only** |
| Upload | **Inside** `public-dist/` — not wrapper folder as remote root |
| Overwrite | **OK** |
| **Forbidden** | CLI FTP `--apply` · `lftp` · `mirror` · `mirror --delete` · remote sync delete · Cursor/agent FTP |
| Freshness | Must PASS immediately before upload |
| Production | **never** |

After upload, re-check:

- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` — marker title visible
- `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` — marker title in track list textarea

**Do not** click Save / Deploy / probe write buttons during upload verification.

---

## 7. STOP conditions

| # | Condition |
| --- | --- |
| 1 | `git status` not clean before generate |
| 2 | `HEAD` ≠ `origin/main` |
| 3 | `MANIFEST.sourceCommit` ≠ current HEAD after generate |
| 4 | Package from older commit uploaded |
| 5 | Local upload source is not `public-dist/` contents |
| 6 | Remote target is not `/cms-kit-staging/gosaki-piano/` |
| 7 | Production ref / production path mixed in |
| 8 | FTP delete / sync delete / mirror required |
| 9 | CLI FTP required |
| 10 | Additional Save / operation=save / SQL / Edge deploy in this phase |

---

## 8. What was NOT done this phase

| Item | Status |
| --- | --- |
| `build:gosaki:staging` / package generate | **no** |
| output/manual-upload update | **no** |
| FTP / upload | **no** |
| Save / operation=save | **no** |
| SQL / DB write | **no** |
| Edge redeploy | **no** |
| production change | **no** |
| service_role | **no** |

---

## 9. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-static-package-regeneration-execution
```

Operator: clean HEAD → `build:gosaki:staging` → verify marker title in package → freshness PASS → manual FTP (separate phase).

# G-20u36e — Gosaki Discography controlled Save UI-visible verification

**Phase:** `G-20u36e-controlled-save-ui-visible-verification`  
**Status:** **complete** — UI-visible verification **prep only** · operator manual check · **no Save / package / FTP**  
**Date:** 2026-07-14  
**Prior:** [post-close-result](./gosaki-discography-g20u36e-controlled-save-post-close-result.md)

| Check | Status |
| --- | --- |
| Verification prep only | **yes** |
| Save executed | **no** · 未実行 (追加 Save 禁止) |
| DB write | **no** · なし |
| SQL executed | **no** · 未実行 |
| Edge deploy | **no** · なし |
| Package 生成 | **no** · なし |
| FTP / upload | **no** · なし |
| service_role | **not used** · 不使用 |
| Production changed | **no** · production未変更 |

---

## Gates

```txt
gosakiDiscographyControlledSaveUiVisibleVerificationPrepared: true
phase: G-20u36e-controlled-save-ui-visible-verification
uiVisibleVerificationPrepOnly: true
saveExecuted: false
dbDataWriteExecuted: false
sqlExecuted: false
edgeDeployExecuted: false
packageGenerated: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
adminPublicReflectionDeltaDocumented: true
recommendedNextPhase: G-20u36e-controlled-save-ui-visible-verification-result-record
alternateNextPhase: Gosaki Discography controlled Save completion handoff
```

**STG base:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/`  
**STG admin:** `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`  
**Staging DB title (final):** `On a Clear Day [CMS Kit staging G-20u36e]`  
**Also confirm:** `Like a Lover` (track 7)

---

## 1. What to verify (operator · browser only)

| Surface | URL | Expectation after Save |
| --- | --- | --- |
| Packaged STG admin Discography editor | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` | May still show **old** track-list snapshot (build-time JSON). Do **not** click Save. |
| Public Discography | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` | May still show **old** titles (baked HTML). Old ≠ DB miss — means package re-gen + manual upload needed. |
| Local musician-basic admin shell (optional) | `http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/` | **Can** show **new** title on reload (SSR live Supabase SELECT) if local shell is running with staging env. |

**Search strings (view-source / page text):**

- `On a Clear Day [CMS Kit staging G-20u36e]`
- `Like a Lover`

**Do not:** click Save · Deploy · FTP · dryRun that writes · any write button.

---

## 2. Manual check procedure

### A. Packaged STG admin

1. Open `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/`
2. Open Discography / SKYLARK / track list area (read-only editor snapshot).
3. Search page for:
   - `On a Clear Day [CMS Kit staging G-20u36e]`
   - `Like a Lover`
4. Record: **visible / not visible**.
5. Do **not** press Save / Run / Deploy.

### B. Public STG Discography

1. Open `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/`
2. Find album that contains track list for discography-002 / SKYLARK (first track historically `On a Clear Day`).
3. Search for new staging marker title + `Like a Lover`.
4. Record: **visible / not visible**.
5. If only old title appears → note as **static package lag** (not a Save failure).

### C. Optional local live-admin shell

1. Only if already running with staging Supabase anon + `ENABLE_ADMIN_STAGING_SHELL`.
2. Open Discography admin · select discography-002 · reload.
3. Track list textarea may show **new** title from live SELECT.
4. Still **do not** Save.

---

## 3. Code survey (read-only) — admin / public reflection delta

| Surface | Data source | Immediate after DB Save? | Follow-up if not visible |
| --- | --- | --- | --- |
| Local `__admin-staging-shell/musician-basic/admin/discography/` | Live Supabase anon SELECT (`loadDiscographyForAdminRead` / `staging-discography-read.ts`) | **Yes** (SSR reload) | None for visibility |
| Packaged STG `/admin/` | Build-time snapshot JSON (`gosaki-read-only-admin-discography-editor.json` → textarea `trackListText`) | **No** | Convert/package + **manual upload** of packaged admin |
| Public `/discography/` | Convert-time patch of Wix HTML from Supabase titles (`patchDiscographyPageMainHtml` / `patchGosakiDiscographySupabaseFields`) then static build | **No** | Convert (Supabase patch) → `manual-upload:package` → operator upload `discography/index.html` |

**Key files (read-only reference):**

- Packaged admin: `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` · `scripts/lib/gosaki-staging-read-only-admin.mjs`
- Local live admin: `templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro` · `src/lib/admin/staging-write/staging-discography-read.ts`
- Public patch: `scripts/lib/supabase-discography-read.mjs` · `scripts/lib/site-generator-hooks.mjs`
- Edge (already used for Save; not for this UI check): `supabase/functions/gosaki-discography-save-dry-run/`

**Delta方針:** DB already holds the new title (Save + post-close PASS). STG **public** and **packaged admin** lag until static regeneration / manual upload — that is **expected**, not a failed Save.

---

## 4. PASS / STOP for this verification (operator result phase)

### Prep-phase judgment (this doc)

Prep complete when URLs, strings, and admin/public delta are documented. Operator check results → next **result-record** phase.

### Expected operator outcomes (future result record)

| Outcome | Meaning |
| --- | --- |
| Local live admin shows new title | Live path OK |
| Packaged admin and/or public still old | Static lag — schedule package + manual upload (later phase) |
| Public shows new without reupload | Unexpected · re-check cache / wrong URL |
| Any write button pressed | **STOP** · record incident |

---

## 5. What was NOT done this phase

- Additional Save / `operation=save`
- SQL / DB write
- Edge redeploy
- Package generation
- FTP / upload
- Rollback / REVOKE / DROP POLICY
- production change
- service_role

---

## 6. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-ui-visible-verification-result-record
alternateNextPhase: Gosaki Discography controlled Save completion handoff
```

Operator runs browser checks above · paste visible/not-visible results · still **no** package/FTP unless a later explicit phase.

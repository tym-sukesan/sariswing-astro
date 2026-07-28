# CMS Core v2 — About Supabase profile.lede Save roundtrip result

- **Phase:** `cms-core-v2-about-supabase-profile-lede-save-roundtrip-result`
- **Status:** **COMPLETE / PASS**
- **Date:** 2026-07-28
- **Planning:** [Save roundtrip planning](./cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.md)
- **Adapter:** [client adapter implementation](./cms-core-v2-about-supabase-profile-lede-save-client-adapter-implementation.md)
- **Staging:** `kmjqppxjdnwwrtaeqjta` **only**
- **Production:** `vsbvndwuajjhnzpohghh` **STOP / untouched**
- **Function:** `gosaki-about-supabase-save-dry-run`
- **siteSlug / pageKey / fieldKey:** `gosaki-piano` / `about` / `profile.lede`
- **Table:** `public.site_page_fields` · column `value_text` only
- **FTP:** operator **manual** FileZilla only · `readyForAnyFutureFtpApply: false`
- **This record phase (Cursor):** docs + AI context only · **no** package / FTP / Edge / DB / Secret / commit

---

## Gates

```txt
phase: cms-core-v2-about-supabase-profile-lede-save-roundtrip-result
ABOUT_SUPABASE_PROFILE_LEDE_SAVE_ROUNDTRIP_RESULT_COMPLETE: true
ABOUT_SUPABASE_PROFILE_LEDE_SAVE_ROUNDTRIP_PASSED: true
IMPLEMENTATION_COMMIT: 359a04a3e960d23fe4948ee53cab7580b924f86f
VERIFIER_FIX_COMMIT: fe4732b1552934f83ebd7cbbb2b49ef98da95aaa
ARMED_PACKAGE_VERIFY_PASS: true
ARMED_PACKAGE_FTP_PASS: true
DRY_RUN_PASS: true
UNARMED_SAVE_REJECTED: true
FORWARD_SAVE_PASS: true
RESTORE_SAVE_PASS: true
REMOTE_ARM_RESTORED_FALSE: true
SUPABASE_ACCESS_TOKEN_UNSET: true
DISARMED_PACKAGE_VERIFY_PASS: true
DISARMED_PACKAGE_FTP_PASS: true
FINAL_SAVE_UI_ARMED: false
FINAL_WRITE_BACKEND: supabase
FINAL_SAVE_DISABLED: true
FINAL_DB_BASELINE: true
PUBLIC_ABOUT_JSON_SOT: true
CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ: false / unset
SAVE_ARM_ENABLED: false
GOSAKI_ABOUT_SUPABASE_SAVE_ARMED: false
PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED: false
SERVICE_ROLE_USED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
disarmedPackageSourceCommit: fe4732b1552934f83ebd7cbbb2b49ef98da95aaa
readyForAboutSupabasePublicBuildReadPlanning: true
```

---

## 1. Commits

| Role | SHA |
| --- | --- |
| Implementation (Save client adapter) | `359a04a3e960d23fe4948ee53cab7580b924f86f` |
| Verifier fix / package `sourceCommit` (armed + final disarmed) | `fe4732b1552934f83ebd7cbbb2b49ef98da95aaa` |

---

## 2. Values (locked)

| Role | `value_text` |
| --- | --- |
| Baseline / restore | `後藤 沙紀 1990年7月9日 A型 岡山県岡山市生まれ。` |
| Temporary forward (一時PoC文言) | `[CMS Kit staging] About profile.lede Save roundtrip PoC` |

Approval IDs (unchanged from planning):

- Dry-run: `G-cms-v2-about-supabase-profile-lede-dry-run`
- Save: `G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice`

---

## 3. Armed package + FTP — PASS

| Check | Result |
| --- | --- |
| Armed package verify | **PASS** (`verify:manual-upload:about-save-ui-armed` / `--expect-about-save-ui-armed`) |
| Operator FileZilla | full `public-dist/` → `/cms-kit-staging/gosaki-piano/` |
| Auto FTP / mirror `--delete` | **not used** |
| Remote arm at FTP time | still unset / false until Save window |

---

## 4. Dry-run — PASS

| Field | Result |
| --- | --- |
| `ok` | `true` |
| `operation` | `dryRun` |
| `after.valueText` | 一時PoC文言 |
| `didWrite` / `dbWrite` / `networkWrite` | **false** |

---

## 5. Unarmed Save 拒否 — PASS

| Field | Result |
| --- | --- |
| HTTP / error | **403** `save_not_armed` |
| Write flags | **false** |

---

## 6. Remote arm window (staging only) — temporary true → restored false

1. Staging-only: `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=true` (temporary)
2. Forward Save → restore Save (below)
3. Restored: `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED=false`
4. `SUPABASE_ACCESS_TOKEN` **unset** after ops

Production secrets / production ref: **not touched**.

---

## 7. Forward Save — PASS

| Field | Result |
| --- | --- |
| `operation` | `save` |
| `didWrite` | `true` |
| `dbWrite` | `true` |
| Value | baseline → 一時PoC文言 |
| `updatedAt` | **advanced** |

---

## 8. Restore Save — PASS

| Field | Result |
| --- | --- |
| `operation` | `save` |
| `didWrite` | `true` |
| `dbWrite` | `true` |
| Value | 一時PoC文言 → baseline |
| `updatedAt` | **advanced** |

Final DB: **baseline** restored.

---

## 9. Disarmed package + FTP — PASS

| Check | Result |
| --- | --- |
| Default `verify:manual-upload` | **PASS** |
| `PACKAGE_RUN.sourceCommit` | `fe4732b1552934f83ebd7cbbb2b49ef98da95aaa` |
| `aboutSaveUiArmed` | `false` |
| `aboutWriteBackend` | `supabase` |
| `publicAboutBuildRead` | `false` |
| Operator FileZilla | full `public-dist/` overwrite to staging |

---

## 10. Final browser Console — PASS

| Field | Value |
| --- | --- |
| `saveUiArmed` | `"false"` |
| `writeBackend` | `"supabase"` |
| `saveDisabled` | `true` |

Public `/about/`: still **JSON SoT** · `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` **false/unset**.

---

## 11. Side effects / STOP confirmation

| Item | Status |
| --- | --- |
| production | **未操作** |
| Contents About non-dry-run arm | **false** |
| service_role | **not used** |
| auto FTP | **not used** |
| public About build-read | **not enabled** |
| Schedule / Discography / YouTube Save | **out of scope / unchanged** |

---

## 12. Recommended next phases

1. **Primary (Kit Core):** `cms-core-v2-about-supabase-public-build-read-planning` — public About prefer `site_page_fields` + JSON fallback（Save roundtrip PASS 後の次）
2. **並行可:** Contents YouTube 退役 planning（`contentsYoutubeCutoverExecuted: false`）
3. **並行可（Gosaki ops）:** クライアント staging 共有・feedback
4. **並行可:** production hosting **read-only planning**
5. **まだしない:** remote Save arm 再 ON · Save UI armed package 再 bake · production · auto FTP · migration/RLS/seed 再実行

---

## 13. This record phase verification

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:manual-upload
node scripts/verify-cms-core-v2-about-supabase-profile-lede-save-roundtrip-planning.mjs
node scripts/verify-cms-core-v2-about-supabase-save-client-adapter.mjs
git diff --check
```

**Not run in this record phase:** package generate · FTP · Secret · DB write · Edge deploy · commit / push.

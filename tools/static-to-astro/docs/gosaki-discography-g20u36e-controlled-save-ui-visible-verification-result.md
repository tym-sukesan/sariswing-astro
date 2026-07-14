# G-20u36e — Gosaki Discography controlled Save UI-visible verification result

**Phase:** `G-20u36e-controlled-save-ui-visible-verification-result-record`  
**Status:** **complete** — operator browser check recorded · new title **not** on packaged STG UI · **static snapshot lag** · **no package / FTP**  
**Date:** 2026-07-14  
**Prior:** [ui-visible-verification prep](./gosaki-discography-g20u36e-controlled-save-ui-visible-verification.md) · [post-close-result](./gosaki-discography-g20u36e-controlled-save-post-close-result.md)

| Check | Status |
| --- | --- |
| Admin new title visible | **no** · 見えない |
| Public new title visible | **no** · 見えない |
| `Like a Lover` visible | **yes** · Admin + Public |
| Old title `On a Clear Day` visible | **yes** · Admin + Public |
| DB Save | remains **PASS** |
| Permission close | remains **PASS** |
| Likely cause | **static package / build-time snapshot lag** |
| Package regeneration | **not executed** · なし |
| FTP / upload | **not executed** · なし |
| Additional Save / SQL / Edge | **not executed** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyControlledSaveUiVisibleVerificationResultRecorded: true
phase: G-20u36e-controlled-save-ui-visible-verification-result-record
adminNewTitleVisible: false
publicNewTitleVisible: false
likeALoverVisible: true
oldTitleVisible: true
dbSaveRemainsPass: true
permissionCloseRemainsPass: true
likelyStaticSnapshotLag: true
packageRegenerationExecuted: false
ftpUploadExecuted: false
additionalSaveExecuted: false
serviceRoleUsed: false
productionChanged: false
recommendedNextPhase: G-20u36e-controlled-save-static-package-regeneration-prep
```

---

## 1. Manual check results

### Admin (packaged STG)

| Item | Value |
| --- | --- |
| URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |
| `On a Clear Day [CMS Kit staging G-20u36e]` | **見えない** |
| `Like a Lover` | **見える** |
| `On a Clear Day` | **見える** |

### Public Discography

| Item | Value |
| --- | --- |
| URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/` |
| `On a Clear Day [CMS Kit staging G-20u36e]` | **見えない** |
| `Like a Lover` | **見える** |
| `On a Clear Day` | **見える** |

---

## 2. Judgment — DB vs UI不同切り分け

| Layer | Status |
| --- | --- |
| First controlled Save (Edge) | **PASS** · `updatedRows=1` · readBack new title |
| Post-save / post-close SELECT | **PASS** · DB title = new · grants closed |
| Packaged STG Admin UI | Shows **old** title · build-time JSON snapshot likely |
| Public `/discography/` | Shows **old** title · static HTML from last package |
| Conclusion | **Not a DB Save failure** · **static snapshot lag** |

This matches prep survey: packaged admin + public do not live-read Supabase on page load.

---

## 3. Likely static package lag

| Surface | Expected data source | Observed |
| --- | --- | --- |
| Packaged `/admin/` | `gosaki-read-only-admin-discography-editor.json` (convert snapshot) | old `On a Clear Day` |
| Public `/discography/` | Convert-patched static HTML | old `On a Clear Day` |
| Staging DB | `discography_tracks` title | new marker (post-close PASS) |

**Follow-up (next phase):** static package regeneration prep → convert with Supabase read → package → **manual upload** of at least `discography/index.html` (+ packaged admin if needed).  
**This phase:** package 生成 **なし** · FTP/upload **なし**.

---

## 4. What was NOT done

- Additional Save / `operation=save`
- SQL / DB write
- Edge redeploy
- Package generation
- FTP / upload
- production change
- service_role

---

## 5. Next

```txt
recommendedNextPhase: G-20u36e-controlled-save-static-package-regeneration-prep
```

Prep convert/package/manual-upload steps only · still no FTP auto-apply · still no additional Save.

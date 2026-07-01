# G-20i2 — Gosaki production upload finalization: admin inclusion + remote path

**Phase:** `G-20i2-gosaki-production-upload-finalization-admin-and-remote-path`  
**Status:** **complete** — planning / preflight only; **package regen / FTP / DNS / DB write not executed**  
**Date:** 2026-07-01  
**Base commit:** `69d538e`  
**Client:** 後藤沙紀さん（gosaki-piano）  
**Prior:** [gosaki-production-upload-preflight.md](./gosaki-production-upload-preflight.md) (G-20i)  
**Package:** [gosaki-production-package-build-result.md](./gosaki-production-package-build-result.md) (G-20h2)

| Check | Status |
| --- | --- |
| `admin/` read-only review | **yes** |
| Inclusion policy decision | **Option B recommended** |
| Remote path final checklist | **yes** (§5) |
| G-20j go/no-go | **STOP** (§6) |
| Package regen / FTP | **no** |

---

## Gates

```txt
gosakiProductionUploadFinalizationComplete: true
phase: G-20i2-gosaki-production-upload-finalization-admin-and-remote-path
adminInclusionRecommendation: Option-B-exclude-from-first-production-upload
productionUploadFileCountRecommended: 26
productionUploadFileCountCurrentPackage: 27
hostedAdminDeferPolicy: true
readyForG20i3ProductionPackageAdminExclusion: true
readyForG20jManualProductionUpload: false
remoteDocumentRoot: TBD
remoteUploadDestination: TBD
ftpUploadExecuted: false
packageRegenExecuted: false
cursorDbWriteExecuted: false
dnsChangeExecuted: false
sslChangeExecuted: false
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Git state (verified)

| Item | Value |
| --- | --- |
| `HEAD` | `69d538e` |
| `origin/main` | `69d538e` |
| Working tree | clean at preflight start |

---

## 2. `admin/` in production package — read-only review

### 2.1 Presence

| Item | Value |
| --- | --- |
| Path | `public-dist/admin/index.html` |
| File count under `admin/` | **1** (`index.html` only) |
| Included in G-20h2 package | **yes** (27-file manifest) |

### 2.2 Purpose

| Item | Detail |
| --- | --- |
| Type | Gosaki **read-only** staging CMS shell (`data-gosaki-read-only-admin="true"`) |
| Title | `Gosaki Piano CMS（確認用・読み取り専用）` |
| Badge | `READ-ONLY — 保存不可` |
| Phase marker | G-11c6a YouTube URL dry-run UI (Save **disabled**) |
| Intended use today | Operator/staging preview — **not** client self-service production CMS |
| Hosted admin policy | **defer** — updates via operator local regen → manual upload |

### 2.3 SEO / exposure

| Check | State |
| --- | --- |
| `<meta name="robots">` | `noindex,nofollow,noarchive` |
| Canonical / og:url if uploaded | `https://www.gosaki-piano.com/admin/` |
| Public site nav link to `/admin/` | **no** (not in main site header) |
| Discoverability | URL guessable if uploaded; noindex reduces search indexing only |

### 2.4 Auth / data exposure

| Check | State |
| --- | --- |
| Supabase Auth UI | Email + password login form (staging Kit users) |
| Dry-run | YouTube URL dry-run to staging Edge Function (auth required) |
| Save buttons | **disabled** in HTML |
| `data-gosaki-supabase-url` | staging Kit host (`kmjqppxjdnwwrtaeqjta`) |
| `data-gosaki-supabase-anon-key` | **present** in HTML attribute (staging anon — public by Supabase design) |
| Staging URL in body | Link to `yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Basic auth / IP restrict | **none** in static HTML |

### 2.5 Risks if `admin/` uploaded to production (first launch)

| Risk | Severity | Note |
| --- | --- | --- |
| Confusing client-facing `/admin/` URL | **medium** | Looks like CMS but Save disabled; not production workflow |
| Staging anon key + Edge endpoints public | **medium** | RLS limits writes; still expands attack surface vs public site only |
| Auth brute-force / credential phishing surface | **low–medium** | Login form on production domain |
| Contradicts hosted-admin defer | **high** | Implies CMS live before operator workflow agreed |
| G-20g production default (`admin/` absent) | **policy** | Current 27-file package diverges from planning default |

---

## 3. Admin inclusion options comparison

| Criterion | **A: Include** | **B: Exclude (recommended)** | **C: Include + extra guards** |
| --- | --- | --- | --- |
| Fastest first public launch | similar | **best** — no extra server config | slower (basic auth / IP rules) |
| Safety / attack surface | wider | **smallest** | medium if guards configured |
| Client confusion | likely | **none** | possible |
| Aligns with hosted-admin defer | **no** | **yes** | partial |
| Aligns with G-20g default | **no** | **yes** | no |
| Operator CMS workflow | staging shell on prod URL | **local regen + manual upload** | hybrid |
| Implementation before G-20j | none | manual skip or G-20i3 | Lolipop basic auth setup |

### Recommendation: **Option B — exclude `admin/` from first production upload**

**Rationale (fastest + safest):**

1. Public site does not need `/admin/` for launch (all content is static HTML).
2. Hosted admin is explicitly **deferred**; client direct `/admin/` operation is **not** confirmed.
3. Read-only admin still exposes staging Supabase anon key + auth UI on production domain.
4. G-20g planning default: production `admin/` **absent**.
5. Operator reflection flow remains: local build → manual FTP of changed public files (proven on staging).

**Option A** only if operator explicitly wants a preview URL on production before DNS cutover — still not recommended without client sign-off.

**Option C** adds Lolipop basic auth / IP allowlist work — not fastest path.

---

## 4. G-20j前の追加対応

### 4.1 Must operator skip `admin/` manually at FTP?

| Approach | Viable? | Notes |
| --- | --- | --- |
| **Manual skip** (do not upload `admin/` folder) | **yes** | Upload **26** files; operator selects folders/files excluding `admin/` |
| **Package regen excluding admin** | **recommended** | Reduces human error; manifest + verifier lock scope |

### 4.2 Verifier should enforce admin excluded?

| Timing | Recommendation |
| --- | --- |
| **G-20j execution verifier (G-20k)** | HTTP verify: `https://www.gosaki-piano.com/admin/` should **404** or not exist after first upload |
| **Package verifier** | **G-20i3** should assert `admin/` absent from production package manifest |

### 4.3 Phase split

| Phase | Scope | Regen? |
| --- | --- | --- |
| **G-20i2** (this doc) | Decision + checklists | **no** |
| **G-20i3** (recommended next) | Production profile: `includeGosakiReadOnlyAdmin: false`; static-public copy excludes `admin/`; regen package → **26 files**; update G-20h2/G-20i verifiers | **yes** (local build only) |
| **G-20j** | Operator manual FTP | after remote path confirmed + upload scope locked |

**G-20h3** naming: optional alias for build-pipeline change inside G-20i3 — **not a separate phase required** if G-20i3 covers profile + copy + regen.

### 4.4 Upload scope after Option B

| Scope | Files |
| --- | --- |
| **Recommended G-20j upload** | **26** (all `public-dist/` except `admin/index.html`) |
| Current package on disk | **27** (includes `admin/` — do not upload unless policy changes) |

---

## 5. Remote path — final operator checklist

Complete **all** items before G-20j. Record answers in G-20j execution doc (not in repo secrets).

| # | Item | Status | Operator action |
| --- | --- | --- | --- |
| R1 | Lolipop contract plan | **TBD** | Confirm Economy (or higher) supports static HTML + FTP |
| R2 | Custom domain `www.gosaki-piano.com` on Lolipop | **TBD** | Attach domain in panel |
| R3 | **Web root for `www`** (upload destination) | **TBD** | e.g. `public_html/` or domain folder — **screenshot required** |
| R4 | FTP login root vs web root | **TBD** | Must not confuse with account `/` (G-7f lesson) |
| R5 | Upload rule: `public-dist/` **contents** only | **confirmed in docs** | Never create remote `public-dist/` folder |
| R6 | FTP host / port / user / password | **TBD** | Operator-held; never commit |
| R7 | FTP access restriction / IP allowlist | **TBD** | Unlock for operator session if needed |
| R8 | Free SSL (Let's Encrypt) on Lolipop | **TBD** | Enable before or at DNS cutover |
| R9 | DNS management owner | **TBD** | Wix vs registrar vs Lolipop |
| R10 | Apex `gosaki-piano.com` → `www` redirect | **TBD** | Confirm with client |
| R11 | Email / MX records | **TBD** | List current MX; avoid breaking mail on DNS change |
| R12 | Wix site backup / export | **TBD** | Preserve before cutover |
| R13 | Cutover window | **TBD** | Low-traffic window with client |
| R14 | TTL shortening | **TBD** | e.g. 300s 24–48h before DNS switch if registrar DNS |
| R15 | Wix fallback | **confirmed** | DNS revert restores Wix until TTL expires |

### Remote path placeholders (unchanged from G-20i)

```txt
remoteDocumentRoot: TBD
remotePublicDirectory: TBD
uploadDestination: TBD
backupDestination: TBD (local download if remote has existing files)
profile JSON: production.remotePath = TBD_G-20i
```

---

## 6. G-20j manual upload — go / STOP

### Decision: **STOP — do not execute G-20j yet**

| Gate | Status | Blocker? |
| --- | --- | --- |
| Remote path confirmed (R3 + R4 screenshot) | **TBD** | **yes — STOP** |
| Admin inclusion policy | **decided — Option B** | resolved |
| Upload scope unambiguous | **26 files, no admin** | operator must acknowledge (G-20i3 regen preferred) |
| SSL plan confirmed | **TBD** | **yes — STOP** |
| DNS / MX impact reviewed | **TBD** | **yes — STOP** |
| G-20i + G-20i2 preflight docs | **complete** | ok |
| Local package exists | **yes** (27 files) | ok — use 26-file scope |

### Conditions to lift STOP (all required)

1. Operator completes checklist §5 (R1–R15) with recorded answers.
2. Remote upload destination screenshot matches `www.gosaki-piano.com` web root.
3. Operator confirms **26-file upload** (admin excluded) OR **G-20i3** regen completes with verifier PASS.
4. Client informed: CMS updates remain operator-driven (no hosted `/admin/` at launch).

### G-20j forbidden (unchanged)

mirror / sync / delete / CLI FTP / Cursor FTP / automated deploy scripts.

---

## 7. Forbidden operations (this phase)

| Operation | Executed |
| --- | --- |
| Package regen / production build | **no** |
| FTP / upload | **no** |
| DNS / SSL change | **no** |
| DB write / Save | **no** |
| commit / push | **no** |

---

## 8. Next phases

| Phase | Scope |
| --- | --- |
| **G-20i3** (recommended) | Exclude `admin/` from production package build path + regen 26-file package |
| **Operator** | Complete remote path / DNS / SSL / MX checklist |
| **G-20j** | Manual FTP — only after STOP gates lifted |
| **G-20k** | HTTP verify incl. `/admin/` absent |

---

## 9. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20i2-gosaki-production-upload-finalization-admin-and-remote-path.mjs
```

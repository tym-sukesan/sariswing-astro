# CMS Core v2 — generalization boundary audit + first safe extraction

- **Phase:** `cms-core-v2-generalization-boundary-audit-and-first-safe-extraction`
- **Date:** 2026-07-29
- **Status:** **COMPLETE**
- **Repo HEAD / origin/main:** `87838dde0840e0977c1bba4f9a53a35c2ab7e1c1`
- **Gosaki deployed staging package (fixed):** `dc1c5b62a58d0462ad6629db4847256d316d4a38`
- **CLIENT_SHARE_READY:** **true**（維持 · package 未再生成）
- **Production:** `vsbvndwuajjhnzpohghh` **STOP**
- **This phase:** boundary audit doc + **one** Node-only YouTube URL parse helper dedupe · **no** package / FTP / DB / Save / Edge / UI / SoT / Contents retire / commit

---

## Gates

```txt
phase: cms-core-v2-generalization-boundary-audit-and-first-safe-extraction
CMS_CORE_V2_GENERALIZATION_BOUNDARY_AUDIT_COMPLETE: true
FIRST_SAFE_EXTRACTION_EXECUTED: true
FIRST_SAFE_EXTRACTION: node-youtube-url-parse-dedupe
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE: false
SAVE_ARM_CHANGED: false
CONTENTS_YOUTUBE_CUTOVER_EXECUTED: false
GOSAKI_PUBLIC_ADMIN_UI_CHANGED: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Recommended layer map

| Layer | Owns | Examples |
| --- | --- | --- |
| **CMS Core** | Pure fail-closed policy helpers, shared ref/env parse *policy docs*, build-read scaffolding shapes, PACKAGE_RUN mechanics | Staging/prod ref constants · `youtube-url-utils.mjs` (Node) · future shared `requireUser` (Deno, deferred) |
| **Feature** | Schema, allowlists, approval IDs, dry-run/Save planners, fingerprints, optimistic-lock *shape* | Schedule rows · Discography release+tracks · YouTube `site_embeds` · About `site_page_fields` |
| **Site adapter** | Site slug, registry flags, endpoint names, Contents vs Supabase dual-path wiring | `gosaki-piano` registry · Edge function names · package bake envs |
| **Presentation** | Admin UI, Save gates, user-facing copy, Wix/CSS presentation | Gosaki admin templates · About mobile CSS · public Astro sections |

**Rule:** Core = pure + policy. Feature = domain contract. Site = wiring/flags. Presentation = UI + copy.

---

## 2. Four-feature structural comparison

| Dimension | Schedule | Discography | YouTube | About |
| --- | --- | --- | --- | --- |
| Tenancy / site | `site_slug` on rows · staging ref gates | Same | `site_embeds` + `can_write_site` | `site_page_fields` + `can_write_site` |
| Admin read / hydrate | Live SELECT schedules | Live SELECT releases/tracks | Dual Contents default ∥ Supabase opt-in | Dual Contents default ∥ Supabase opt-in (+ `operation=read`) |
| dry-run / Save | Edge schedule dry-run/save · approval IDs | Edge discography · nested allowlist | Contents G-11c* ∥ Supabase items Save | Contents G-12a ∥ Supabase profile.lede |
| Save arm | Client + server env exact/false default | Same | Same (Contents + Supabase arms separate) | Same |
| Optimistic lock | Scalar `expectedBeforeUpdatedAt` | Scalar on release | **By-id** map | Scalar on lede row |
| Supabase loader | Schedule loaders | Discography loaders | `loadSiteEmbedsDataForBuild` | `loadSitePageFieldsDataForBuild` |
| Public build-read | N/A (schedule pages from DB/convert) | N/A (discography convert) | Registry/`CMS_KIT_SITE_EMBEDS_BUILD_READ` | Env `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` · registry `sitePageFields=false` |
| JSON / Contents fallback | N/A | N/A | JSON SoT + Contents Save path retained | JSON SoT + Contents path retained |
| Registry / capability | `supabaseFeatures.schedule` | `discography` | `siteEmbeds` + `cmsFeatures.youtube` | `sitePageFields=false` + `cmsFeatures.aboutContent` |
| Report / PACKAGE_RUN | Light | Light | Light (no About-style report) | Heavy: `publicAboutBuildRead`, `ABOUT_PUBLIC_BUILD_READ_REPORT`, overlayOutcome |
| Verifier | schedule seed / multi-route admin | g20u30+ discography suite | cms-core-v2 youtube + public-multi | cms-core-v2 about suite + manual-upload bake modes |
| User-facing errors | Shared Save failure helper | Shared | Shared | **Unique** `userFacingAboutErrorMessage` map |

**Schedule / Discography:** treat as **reference** for future Core patterns (auth, ref gates, arms). Do **not** force into the same table/embed abstraction as YouTube/About in this phase.

---

## 3. What can move to CMS Core (later)

- Staging / production Supabase ref constants + “contains staging / blocks production” boolean helper (after aligning error strings)
- Documented arm policy: Edge `=== "true"` (no trim) vs client `.trim() === "true"` — **do not unify without explicit phase**
- Deno `_shared` `requireUser` once OPTIONS/status contracts align (About 204 vs YouTube 200 today)
- Build-read “anon env + production stop + try/catch envelope” skeleton (not field-name unify)

---

## 4. What must stay feature / site / presentation specific

| Keep | Why |
| --- | --- |
| Tables / SELECT / allowlists / approval IDs | Domain contracts differ |
| Optimistic lock shape (scalar vs by-id) | YouTube multi-item |
| `userFacingAboutErrorMessage` | About-only snake_case codes |
| Contents dual-path + endpoint allowlists | Site adapter; Contents retire **out of scope** |
| About HTML first-`<p>` overlay / Bands injection | Presentation + convert |
| Schedule event field matrix / Discography nested tracks | Feature |
| Registry defaults / Save arm env names | Site adapter — defaults must not flip |
| Gosaki package `dc1c5b6` HTML/CSS | client-ready freeze |

---

## 5. First safe extraction (executed)

### Target

**Node-only YouTube URL parse helper dedupe**

| Item | Value |
| --- | --- |
| SoT | `scripts/lib/youtube-url-utils.mjs` — `parseYoutubeVideoId`, `buildYoutubeNocookieEmbedUrl`（site-agnostic Core） |
| Core consumer | `cms-core-v2-youtube-supabase-contract.mjs` → **direct import** + re-export |
| Site adapters | `gosaki-youtube-embed-utils.mjs` → import + re-export（resolve/render は Gosaki 残置）· `gosaki-youtube-url-dry-run-validation.mjs` → Core 直 import + re-export |
| **Not** touched | Edge handlers · Astro `gosaki-youtube-embed.ts` · Admin UI · Save arms · live SoT · About · Schedule · Discography |

### Dependency direction

```txt
youtube-url-utils.mjs          (Core SoT)
  ↑ contract / dry-run / gosaki-embed-utils
gosaki-youtube-embed-utils.mjs (site: resolve + render only beyond re-export)
```

Core **must not** import Gosaki files.

### Why this first

- Pure, already identical copies
- Behavior-preserving re-export keeps verifier / Gosaki import paths stable
- No HTML / UI / Save contract / flag default / allowlist change
- Does not touch deployed package graph
- Dependency: Core ← Feature/Site（not Core → Gosaki）

### Deferred candidates

1. Admin staging-ref base assert 4-liner (templates) — next small slice
2. Edge `requireUser` YouTube↔About — Deno `_shared` + mirror cost · OPTIONS mismatch

---

## 6. Implementation diff (this phase)

| File | Change |
| --- | --- |
| `scripts/lib/youtube-url-utils.mjs` | **New** Core SoT（parse / nocookie URL only） |
| `scripts/lib/cms-core-v2-youtube-supabase-contract.mjs` | Import Core SoT directly + re-export |
| `scripts/lib/gosaki-youtube-embed-utils.mjs` | Re-export Core; keep resolve/render |
| `scripts/lib/gosaki-youtube-url-dry-run-validation.mjs` | Import Core SoT（no duplicate parse） |
| This doc | Boundary audit + extraction record |
| AI context ×3 | Minimal phase update |

**Gosaki runtime behavior:** **unchanged** (Node tooling/verifiers only · no package regen).

---

## 7. Regression risk

| Risk | Sev | Mitigation |
| --- | --- | --- |
| Import cycle Core ↔ Gosaki / contract | P2 | `youtube-url-utils.mjs` has no site imports |
| Verifier expects inline function body in contract file | P2 | Run vertical-slice verifier (imports symbols) |
| Edge/template drift vs Node SoT | P3 | Documented; sync in later Deno/package phase |
| Accidental package regen changing client-ready | P1 avoided | **No package/FTP this phase** |

---

## 8. Next generalization order

1. **Done:** Node YouTube URL parse → Core `youtube-url-utils.mjs`（Gosaki 依存なし）
2. **Done:** Admin staging-ref assert helper → Core `supabase-staging-ref-utils.mjs`（Edge/UI 未配線）
3. Document-only arm-parse policy note (Edge vs client) — no code unify yet
4. Deno `_shared` `requireUser` after OPTIONS contract alignment
5. Build-read envelope skeleton (embeds vs page_fields still feature-specific returns)
6. **Not now:** Contents YouTube retire · Schedule/Discography schema merge · About error map merge

---

## 9. Gosaki client-ready maintained

```txt
CLIENT_SHARE_READY: true
deployedPackageSourceCommit: dc1c5b62a58d0462ad6629db4847256d316d4a38
packageRegenThisPhase: false
ftpThisPhase: false
publicUiChanged: false
adminUiChanged: false
liveYoutubeSotChanged: false
contentsYoutubeCutoverExecuted: false
```

Client preview package remains the operator-uploaded `dc1c5b6` artifact. This phase’s Node helper dedupe does **not** require re-upload for client share.

---

## 10. Verification commands (run this phase)

```bash
cd ~/sariswing-astro/tools/static-to-astro
node scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs
npm run verify:gosaki-youtube-public-multi
node scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs
# About public build-read planning/local impl verifiers (docs/source; no package generate):
node scripts/verify-cms-core-v2-about-supabase-public-build-read-planning.mjs
node scripts/verify-cms-core-v2-about-supabase-public-build-read-local-implementation.mjs
npm run verify:g20u30-gosaki-discography-dry-run-validation
npm run verify:gosaki-schedule-seed
npm run verify:url-staging
git -C ~/sariswing-astro diff --check
```

**Do not run:** `build:gosaki:*` · `manual-upload:package` · FTP · Save/dry-run · Edge deploy.

### Verification results (this phase)

| Check | Result |
| --- | --- |
| YouTube Supabase vertical slice | **PASS** |
| YouTube public multi | **PASS** (35) |
| About Supabase vertical slice | **PASS** (106) |
| About public build-read planning | **PASS** (62) |
| About public build-read local impl | **PASS** (50) |
| url-staging pipeline | **PASS** (814) |
| `git diff --check` | **PASS** |
| Shared parse helpers smoke | **PASS** |
| Discography `verify:g20u30-…` | **FAIL** (17) — **pre-existing** · **out of scope this phase** · unrelated to YouTube URL Core extraction |
| Schedule `verify:gosaki-schedule-seed` | **FAIL** (2) — **pre-existing** staging row-count drift · **out of scope this phase** · unrelated |

---

## 11. Safety

| Check | Result |
| --- | --- |
| production 未操作 | **true** |
| DB write なし | **true** |
| Save arm 変更なし | **true** |
| package / FTP なし | **true** |
| Contents retire なし | **true** |
| live YouTube SoT 不変 | **true** |
| commit / push なし（Cursor） | **true** |

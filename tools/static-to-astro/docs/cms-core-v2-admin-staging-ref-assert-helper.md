# CMS Core v2 — Admin staging-ref assert helper

- **Phase:** `cms-core-v2-admin-staging-ref-assert-helper`
- **Date:** 2026-07-29
- **Status:** **COMPLETE**
- **Repo HEAD (phase start):** `cbca3646c7d03c379e7039bd684bac2a36ced2f9`
- **Gosaki deployed staging package (fixed):** `dc1c5b62a58d0462ad6629db4847256d316d4a38`
- **CLIENT_SHARE_READY:** **true**（維持 · package 未再生成）
- **Staging ref:** `kmjqppxjdnwwrtaeqjta`
- **Production STOP:** `vsbvndwuajjhnzpohghh`
- **This phase:** Node site-agnostic staging-ref helper + thin feature wrappers · **Edge / Deno / Admin UI not wired**

---

## Gates

```txt
phase: cms-core-v2-admin-staging-ref-assert-helper
CMS_CORE_V2_ADMIN_STAGING_REF_ASSERT_HELPER_COMPLETE: true
EDGE_DENO_WIRED: false
ADMIN_UI_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE: false
SAVE_ARM_CHANGED: false
CONTENTS_YOUTUBE_CUTOVER_EXECUTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Inventory (Node / Admin tooling duplicates)

| Location | Runtime | Pattern | Error / code |
| --- | --- | --- | --- |
| `cms-core-v2-youtube-supabase-contract.mjs` | Node | constants only | — |
| `cms-core-v2-about-supabase-contract.mjs` | Node | constants only | — |
| `gosaki-schedule-dry-run-edge-core.mjs` | Node | `assertScheduleDryRunStagingUrl` | throw feature messages |
| `gosaki-discography-edge-dry-run-readback.mjs` | Node | `assertStagingSupabaseUrl` | throw feature messages |
| `gosaki-staging-admin-public-env.mjs` | Node | exact host + prod contains | `errors[]` |
| `package-run-marker.mjs` | Node | HTML/URL contains staging / not prod | `errors[]` |
| `site-cms-features.mjs` | Node | build-read soft block on prod URL | `fallbackReason: production_ref_stop` |
| Edge YouTube / About / Schedule / Discography handlers | **Deno** | includes staging/prod | `production_ref_stop` / `staging_ref_required` / throw — **out of scope** |
| Admin templates (`gosaki-staging-*-edit.ts` etc.) | Browser | endpoint includes | `production_ref_blocked` — **out of scope (UI)** |

---

## 2. Shared contract (this phase)

```txt
input: URL | host | bare ref string (empty check: no trim — whitespace-only ≠ empty)
1. empty → fail
2. production substring anywhere → fail (always before staging)
3. http(s) URL → exact hostname === {staging}.supabase.co only
   (path/query staging spoof → fail-closed unknown)
4. non-URL → staging substring allow (bare project ref parity)
5. else unknown → staging_ref_required fail-closed
```

Core codes (neutral): `empty` · `production_ref_stop` · `staging_ref_required` · `ok`.

Feature wrappers keep **existing Error message strings**.

**Pre-commit hardening (safety review):** http(s) URL allow path no longer accepts
`evil.example/?kmjqpp…` via substring. Legitimate `https://kmjqpp….supabase.co/…`
unchanged. Wrapper Error text unchanged.

---

## 3. Not shared (remain feature / site / Edge)

- Edge / Deno `requireUser` / `assertStagingSupabaseUrl` copies
- Admin browser endpoint allowlists + `production_ref_blocked` UI codes
- About `userFacingAboutErrorMessage`
- Discography nested Save schema warnings
- Package HTML artifact path checks (only constants SoT shared)

---

## 4. Helper + dependency direction

```txt
supabase-staging-ref-utils.mjs     ← Core SoT (no gosaki- imports)
  ↑ youtube / about contracts (constants re-export)
  ↑ schedule dry-run edge-core (wrapper messages)
  ↑ discography readback (wrapper messages)
  ↑ package-run-marker (constants)
  ↑ gosaki-staging-admin-public-env (constants + helpers)
  ↑ site-cms-features (production contains helper)
```

---

## 5. Implementation

| File | Change |
| --- | --- |
| `scripts/lib/supabase-staging-ref-utils.mjs` | **New** Core SoT |
| `scripts/verify-cms-core-v2-admin-staging-ref-assert-helper.mjs` | Fixture verifier |
| YouTube / About contracts | Constants re-export from Core |
| Schedule / Discography Node asserts | Call Core + preserve messages |
| package-run-marker / admin-public-env / site-cms-features | Constants / contains helper |
| `package.json` | `verify:cms-core-v2-admin-staging-ref` |

---

## 6. Behavior

**Gosaki public / Admin UI / Edge / Save arm / SoT / package:** **unchanged**.

Node tooling assert **messages** preserved for Schedule / Discography wrappers.

**Intentional fail-closed tighten (URL-shaped inputs only):** spoofed http(s) hosts that
only embed the staging ref in path/query now classify as `unknown` (previously would
have passed via substring). Real staging API host URLs and bare project-ref strings
unchanged.

---

## 7. Verification

```bash
cd ~/sariswing-astro/tools/static-to-astro
npm run verify:cms-core-v2-admin-staging-ref
node scripts/verify-cms-core-v2-youtube-supabase-vertical-slice.mjs
node scripts/verify-cms-core-v2-about-supabase-vertical-slice.mjs
npm run verify:url-staging
# related Admin/package (no package generate):
# validate via fixture verifier + import smoke
git diff --check
```

Discography g20u30 / Schedule seed row-count FAIL: **pre-existing · out of scope · unrelated**.

### Results (this phase)

| Check | Result |
| --- | --- |
| `verify:cms-core-v2-admin-staging-ref` | **PASS** (53) |
| YouTube vertical slice | **PASS** (254) |
| About vertical slice | **PASS** (106) |
| url-staging | **PASS** (814) |
| import cycle smoke | **PASS** |
| `git diff --check` | **PASS** |

---

## 8. Next generalization

1. Document-only arm-parse policy (Edge `=== "true"` vs client trim) — no unify yet
2. Edge `requireUser` / staging-ref after OPTIONS alignment (separate approval)
3. Admin browser endpoint gate helper (UI-preserving) — later
4. Contents YouTube retire — **not now**

---

## 9. Safety

| Check | Result |
| --- | --- |
| production 未操作 | **true** |
| Edge / Deno 未配線 | **true** |
| Admin UI 未変更 | **true** |
| package / FTP なし | **true** |
| commit / push なし（Cursor） | **true** |
| CLIENT_SHARE_READY 維持 | **true** |

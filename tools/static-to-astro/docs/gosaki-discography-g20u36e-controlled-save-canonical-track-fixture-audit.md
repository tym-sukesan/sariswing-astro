# G-20u36e — Gosaki Discography controlled Save canonical track fixture audit

**Phase:** `G-20u36e-controlled-save-canonical-track-fixture-audit`  
**Status:** **complete** — audit + fixture correction · **no dryRun HTTP / Save / SQL / DB write**  
**Date:** 2026-07-13  
**Base commit:** `0fc431a`  
**Prior:** [gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md](./gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md)

| Check | Status |
| --- | --- |
| Canonical track 7 | **`Like a Lover`** (staging DB + snapshot confirmed) |
| Fixture audit | **complete** |
| Current fixture/payload aligned | **yes** |
| dryRun HTTP sent | **no** |
| Save executed | **no** |
| SQL / DB write | **no** |
| Edge deploy | **no** |
| service_role | **not used** |

---

## Gates

```txt
gosakiDiscographyControlledSaveCanonicalTrackFixtureAuditPassed: true
phase: G-20u36e-controlled-save-canonical-track-fixture-audit
auditOnly: true
canonicalTrack7Title: Like a Lover
historicalArtifactTitle: Like a Lover（テスト）
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
dryRunHttpSent: false
edgeDeployExecuted: false
adminUiChanged: false
ftpUploadExecuted: false
serviceRoleUsed: false
readyForG20u36eControlledSaveDryrunPayloadLiveVerify: true
```

**Staging ref:** `kmjqppxjdnwwrtaeqjta` · **Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Search scope

Searched `tools/static-to-astro/**` for:

- `Like a Lover（テスト）`
- `SKYLARK_TRACKS_CURRENT`
- `track_7_title` / `tracksText` (G-20u36e docs)
- `discography-002`

---

## 2. Classification

### A. Historical — left unchanged (document past phases)

| Area | Examples | Reason |
| --- | --- | --- |
| G-18g2 Save chain docs | `gosaki-discography-g18g2-*` | Records `Like a Lover` → `Like a Lover（テスト）` PoC |
| G-18h / G-19 public reflection | `gosaki-discography-g18h-*`, `g19c`, `g19d` | Upload/reflection at test-title era |
| G-19a planning doc | `gosaki-discography-g19a-tracklist-generic-textarea-dry-run.md` | Written when DB had test title |
| G-19b / G-19b1 docs + verifiers | `g19b*`, `G18G2_TRACK7_TITLE` constants | Historical Save slice guards |
| G-20 production cleanup | `gosaki-production-test-text-cleanup-*` | Cleanup from test → canonical |
| Supabase SQL templates | `gosaki-discography-g18g2-*`, `g19b1-*`, `g20*` | Historical rollback/preflight SQL |
| AI context deep history | `handoff-to-chatgpt.md` G-18g2+ sections | Phase archive |

### B. Current expected / fixture / payload / verifier — **corrected**

| File | Change |
| --- | --- |
| `scripts/lib/discography-g19a-generic-dry-run-lib.mjs` | `SKYLARK_TRACKS_CURRENT[6]` → `Like a Lover` |
| `scripts/lib/gosaki-discography-edge-dry-run-readback.mjs` | **indirect** — imports `SKYLARK_TRACKS_CURRENT` |
| `scripts/verify-g19a-gosaki-discography-tracklist-generic-textarea-dry-run.mjs` | Canonical vs historical constants split |
| `docs/gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md` | Fixture note updated |

### C. Artifact explanation — retained intentionally

| File | Role |
| --- | --- |
| `gosaki-discography-g20u36e-controlled-save-plan.md` | Notes G-18g2 test string was preflight artifact |
| `gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md` | Documents correction from test string to canonical |
| `scripts/verify-g20u36e-controlled-save-snapshot-select-result.mjs` | Asserts artifact documented; preflight tracksText canonical |

### Already canonical (no change needed)

| File | Status |
| --- | --- |
| `gosaki-discography-g20u36e-controlled-save-preflight.md` | track 7 = `Like a Lover` · dryRun Step A/B `tracksText` |
| `gosaki-discography-g20u36e-controlled-save-plan.md` | expectedBefore track 7 = `Like a Lover` |
| `verify-g20u36d-readback-live-verify-retry-3.mjs` | Live matching uses **DB prefetch** (not fixture) |

### Out of scope (not modified — noted)

| File | Note |
| --- | --- |
| `src/lib/admin/staging-write/gosaki-discography-g19a-tracklist-generic-types.ts` | `G19A_SKYLARK_TRACK_7_CURRENT` still test era — **src/** forbidden this phase |
| G-18g2 guard modules in `src/**` | Historical before/after constants preserved |

---

## 3. Canonical track 7 confirmation

| Source | track 7 title |
| --- | --- |
| Staging DB snapshot (G-20u36e) | **`Like a Lover`** |
| `SKYLARK_TRACKS_CURRENT` (after audit) | **`Like a Lover`** |
| Preflight dryRun Step A/B `tracksText` | **`Like a Lover`** |
| Controlled Save plan expectedBefore | **`Like a Lover`** |

**Historical artifact:** `Like a Lover（テスト）` — temporary G-18g2 verification string; **do not UPDATE DB** to match.

---

## 4. SKYLARK_TRACKS_CURRENT (after correction)

```txt
On a Clear Day
My Blue Heaven
How Deep Is The Ocean
Skylark
Set Sail
What a Wonderful World
Like a Lover
The Water Is Wide
```

Used by: `discography-g19a-generic-dry-run-lib.mjs` · `gosaki-discography-edge-dry-run-readback.mjs` (`DISCOGRAPHY_002_READBACK_FIXTURE` · `buildDiscography002MatchingDryRunRequest`).

---

## 5. dryRun payload tracksText (preflight locked)

**Step A (matching):** track 7 line = `Like a Lover`  
**Step B (G-20u36e1 slice):** track 7 line = `Like a Lover` (unchanged; only track 1 differs)

---

## 6. Ready for dryRun live verify?

**Yes** — current tools fixture and G-20u36e docs align with staging DB canonical track 7.

| Prerequisite | Status |
| --- | --- |
| Snapshot PASS | **yes** |
| Canonical fixture aligned | **yes** |
| Preflight payload aligned | **yes** |
| Save still blocked | **yes** (expected) |
| Edge save path | **not yet** — separate phase |

---

## 7. Explicit negatives (this phase)

| Item | Status |
| --- | --- |
| Audit + fixture correction only | **yes** |
| SQL executed | **no** |
| DB write | **no** |
| Save / operation=save | **no** |
| dryRun HTTP | **no** |
| Edge deploy | **no** |
| Admin UI changed | **no** |
| FTP | **no** |
| service_role | **not used** |
| `supabase/functions/**` edited | **no** |

---

## 8. Next phase

**Recommended:** `G-20u36e-controlled-save-dryrun-payload-live-verify`

- Step A matching dryRun (wouldWrite=false)
- Step B G-20u36e1 slice dryRun (wouldWrite=true · track 1 only)

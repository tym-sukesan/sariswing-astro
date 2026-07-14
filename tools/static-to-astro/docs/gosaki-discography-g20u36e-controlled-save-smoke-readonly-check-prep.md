# G-20u36e — Gosaki Discography controlled Save smoke / read-only check prep

**Phase:** `G-20u36e-controlled-save-smoke-readonly-check-prep`  
**Status:** **complete** — smoke/read-only prep only · **HTTP not sent** · **no Save**  
**Date:** 2026-07-14  
**Prior:** [edge-deploy-result](./gosaki-discography-g20u36e-controlled-save-edge-deploy-result.md)

| Check | Status |
| --- | --- |
| Smoke / read-only prep only | **yes** |
| HTTP sent | **no** · 未送信 |
| operation=save | **not sent** · 未送信 · **forbidden in this checklist** |
| Save executed | **no** · 未実行 |
| DB write | **no** |
| Rollback | **no** |
| service_role | **not used** |
| JWT real values in doc | **no** — use `<OPERATOR_JWT>` placeholder only |

---

## Gates

```txt
gosakiDiscographyControlledSaveSmokeReadonlyCheckPrepared: true
phase: G-20u36e-controlled-save-smoke-readonly-check-prep
smokeReadonlyPrepOnly: true
httpNotSent: true
operationSaveForbiddenInThisChecklist: true
saveExecuted: false
dbWriteExecuted: false
jwtPlaceholderOnly: true
recommendedNextPhase: G-20u36e-controlled-save-smoke-readonly-check-execution
```

**Endpoint (staging):** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`  
**Production STOP:** `vsbvndwuajjhnzpohghh`

---

## 1. Handler read-only survey (what is safe)

| Candidate | Available on this Edge Function? | Safe for smoke? |
| --- | --- | --- |
| OPTIONS preflight | **yes** (CORS) | **yes** |
| `operation=dryRun` | **yes** (`DRY_RUN_OPERATION`) | **yes** if approvalId = dry-run ID · `clientDryRun.wouldWrite=false` |
| anon readBack (when env enabled) | **yes** (SELECT-only via anon) | **yes** as part of dryRun path · no DB write |
| `operation=adminProbe` / `is_admin` on Edge | **no** — Edge has no adminProbe operation | N/A on this function |
| STG admin UI “DB admin probe” | **yes** (admin UI · separate) | **yes** · readonly RPC · not this Edge HTTP |
| `operation=save` | **exists** (controlled gate) | **NO** for smoke — forbidden until explicit Save phase |
| `dryRun=false` | N/A / wrong shape | **NO** |

---

## 2. Recommended sequence (execution phase — not this phase)

1. **OPTIONS** smoke (or minimal non-POST)  
2. **STG admin UI** readonly `is_admin` probe (if needed · not Edge `operation=save`)  
3. **Edge `operation=dryRun`** read-only (+ readBack if env on)  
4. **Pre-save SELECT-only** verification (SQL Editor · separate doc)  
5. Only then: controlled Save **judgment** (later phase)

**Do not** put `operation=save` in any smoke body.

---

## 3. Forbidden in smoke / read-only checklist

- `operation=save` (any spelling)
- Save approvalId / sliceId as a live Save attempt
- `dryRun=false` as a write enable flag
- real JWT / access_token / refresh_token values in docs or logs
- service_role
- production ref / production URL
- SQL mutation · Rollback · permission close

---

## 4. Safe HTTP command candidates (prepared · **未実行**)

JWT = placeholder only: `<OPERATOR_JWT>`  
Anon key = use Dashboard / local env at run time — **do not paste secrets into chat/docs**.

### 4.1 OPTIONS smoke

```bash
curl -i -X OPTIONS \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: authorization,content-type,apikey'
```

### 4.2 dryRun only (read-only · no Save)

```bash
curl -sS -X POST \
  'https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <OPERATOR_JWT>' \
  -H 'apikey: <STAGING_ANON_KEY>' \
  -d '{
    "operation": "dryRun",
    "siteSlug": "gosaki-piano",
    "legacyId": "discography-002",
    "approvalId": "G-20u31-gosaki-discography-save-dry-run-endpoint",
    "tracksText": "On a Clear Day\nTrack 2 placeholder\nTrack 3 placeholder\nTrack 4 placeholder\nTrack 5 placeholder\nTrack 6 placeholder\nLike a Lover\nTrack 8 placeholder",
    "release": {
      "title": "placeholder",
      "artist": "placeholder",
      "published": true
    },
    "trackPolicy": {
      "oneLineOneTrack": true,
      "blankLinesIgnored": true,
      "allowDuplicateTitles": true,
      "allowEmptyTrackList": false
    },
    "clientDryRun": {
      "wouldWrite": false
    }
  }'
```

**Notes:**  
- `approvalId` is the **dry-run** ID — **not** the Save slice approval ID.  
- Body must keep `"operation": "dryRun"`.  
- Expect `wouldWrite` / write flags false for a true no-op baseline when texts match DB; if placeholder tracksText differs, dryRun may report `wouldWrite=true` as a **prediction only** — still **no DB write**. Prefer aligning `tracksText` with live titles if you want a quieter smoke.

### 4.3 Explicitly **not** prepared (forbidden now)

```txt
# DO NOT RUN — operation=save is out of scope for smoke/read-only
# Any body with operation set to save, or any Save sliceId, is STOP for this phase.
```
---

## 5. STOP conditions

| # | Condition |
| --- | --- |
| 1 | Checklist includes `operation=save` |
| 2 | Checklist includes `dryRun=false` as write gate |
| 3 | Save payload / Save approval+slice used as live Save |
| 4 | Real JWT pasted into docs/logs |
| 5 | service_role required |
| 6 | production ref / URL |
| 7 | DB write / SQL mutation / Rollback advanced in this phase |

---

## 6. Next phase

```txt
G-20u36e-controlled-save-smoke-readonly-check-execution
```

Operator runs OPTIONS + dryRun (and optional UI admin probe) once. **No Save.**

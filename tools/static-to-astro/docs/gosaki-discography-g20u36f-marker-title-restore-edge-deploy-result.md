# G-20u36f — Gosaki Discography marker title restore Edge deploy result

**Phase:** `G-20u36f-discography-marker-title-restore-edge-deploy-result-record`  
**Status:** **complete** — operator staging deploy + smoke recorded · **no additional deploy / Save / SQL / package / FTP**  
**Date:** 2026-07-15  
**Prior:** [edge-deploy-prep](./gosaki-discography-g20u36f-marker-title-restore-edge-deploy-prep.md) · [handler-implementation](./gosaki-discography-g20u36f-marker-title-restore-handler-implementation.md)

| Check | Status |
| --- | --- |
| Edge deploy (operator) | **PASS** |
| OPTIONS smoke | **PASS** |
| dryRun restore-shaped smoke | **safe FAIL** (contract mismatch · no DB write) |
| Additional deploy | **no** |
| operation=save | **not sent** |
| Restore Save | **not sent** |
| SQL executed | **no** |
| DB write | **no** |
| Permission open | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production changed | **no** |

---

## Gates

```txt
gosakiDiscographyMarkerTitleRestoreEdgeDeployed: true
phase: G-20u36f-discography-marker-title-restore-edge-deploy-result-record
deployManualExecuted: true
deployPass: true
optionsSmokePass: true
dryRunRestoreShapedSmokeSafeFail: true
dryRunContractMismatch: true
edgeDeployedProjectRef: kmjqppxjdnwwrtaeqjta
edgeDeployedFunction: gosaki-discography-save-dry-run
dockerWarningPresent: true
dockerWarningBlockedDeploy: false
additionalDeployExecuted: false
operationSaveSent: false
restoreSaveSent: false
saveExecuted: false
sqlExecuted: false
dbWriteExecuted: false
permissionOpenExecuted: false
packageGenerationExecuted: false
ftpUploadExecuted: false
serviceRoleUsed: false
productionChanged: false
restoreSaveBlockedUntil: pre-restore-select + permission-open
recommendedNextPhase: G-20u36f-discography-marker-title-restore-preflight-select
```

**Staging Supabase project ref:** `kmjqppxjdnwwrtaeqjta` only.  
**Production ref STOP:** `vsbvndwuajjhnzpohghh` — **never use** · **unchanged**.

---

## 1. Pre-deploy local confirmation

| Check | Result |
| --- | --- |
| `handler.ts` contains `G-20u36f-gosaki-discography-marker-title-restore` | **yes** |
| `handler.ts` contains `G-20u36f-discography-002-track-1-title-restore` | **yes** |
| git status before deploy | `main...origin/main` **clean** |

---

## 2. Deploy execution (operator)

| Item | Value |
| --- | --- |
| Executor | **operator** — not Cursor |
| Command | `cd ~/sariswing-astro` then `supabase functions deploy gosaki-discography-save-dry-run --project-ref kmjqppxjdnwwrtaeqjta` |
| Project ref | `kmjqppxjdnwwrtaeqjta` |
| Function | `gosaki-discography-save-dry-run` |
| Warning | `WARNING: Docker is not running` |
| Warning blocked deploy | **no** — deploy still **success** |
| Result line | `Deployed Functions on project kmjqppxjdnwwrtaeqjta: gosaki-discography-save-dry-run` |
| Judgment | **PASS** |

### Uploaded files

- `supabase/functions/gosaki-discography-save-dry-run/index.ts`
- `supabase/functions/gosaki-discography-save-dry-run/handler.ts`

---

## 3. OPTIONS smoke (operator)

**Endpoint:** `https://kmjqppxjdnwwrtaeqjta.supabase.co/functions/v1/gosaki-discography-save-dry-run`

| Observation | Result |
| --- | --- |
| HTTP status | **HTTP/2 200** |
| Body | `ok` |
| `access-control-allow-origin` | `*` |
| `access-control-allow-headers` | includes `authorization`, `x-client-info`, `apikey`, `content-type` |
| `access-control-allow-methods` | `POST, OPTIONS` |
| `sb-project-ref` | `kmjqppxjdnwwrtaeqjta` |
| Served by | `supabase-edge-runtime` |
| Judgment | **PASS** |

---

## 4. dryRun restore-shaped smoke (operator · safe FAIL)

| Item | Value |
| --- | --- |
| Sent | `operation=dryRun` with **G-20u36f restore-shaped body** (not `operation=save`) |
| `ok` | **false** |
| `operation` | `dryRun` |
| `status` | **400** |
| `wouldWrite` | **false** |
| `didWrite` | **false** |
| `dbWrite` | **false** |
| `networkWrite` | **false** |
| `saveEnabled` | **false** |

### Errors (validation · no DB write)

- `release.title must be a non-empty string`
- `release.artist must be a non-empty string`
- `release.published must be boolean`
- `tracksText must be a string`
- `clientDryRun.wouldWrite must be false (browser never writes)`

### readBack (SELECT-only · no write)

| Field | Value |
| --- | --- |
| `enabled` | **true** |
| `source` | `supabase-select` |
| `releaseFound` | **true** |
| `trackCount` | **8** |
| `legacyId` | `discography-002` |
| `siteSlug` | `gosaki-piano` |

### Judgment

**Safe FAIL / contract mismatch** — restore-shaped payload is **not compatible** with existing generic dryRun validation. This is **not a DB write** and **does not prove restore Save failure**, because controlled restore uses the **`operation=save` allowlist path**.

**Do not retry dryRun with `operation=save`.** Do not send restore Save yet.

**Proceed to:** pre-restore SELECT before any permission open or Save.

---

## 5. What was NOT done

| Item | Status |
| --- | --- |
| Additional Edge deploy | **no** |
| `operation=save` HTTP | **no** |
| G-20u36f restore Save | **no** |
| SQL / GRANT / POLICY | **no** |
| Permission open | **no** |
| DB write | **no** |
| Package generation | **no** |
| FTP / upload | **no** |
| service_role | **not used** |
| Production change | **no** |

---

## 6. Next

```txt
recommendedNextPhase: G-20u36f-discography-marker-title-restore-preflight-select
```

Pre-restore SELECT-only verification (from planning doc) before permission open or controlled restore Save.

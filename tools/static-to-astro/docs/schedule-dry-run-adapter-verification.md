# Schedule Dry-run Adapter Verification

**Phase:** `G-6-e3-schedule-dry-run-adapter-verification`  
**Prerequisite:** [schedule-dry-run-adapter-implementation.md](./schedule-dry-run-adapter-implementation.md) (commit `379ca95`)

## 1. Purpose

This document verifies the Schedule dry-run adapter implementation.

It does not implement UI changes.  
It does not implement real write behavior.  
It does not write schedule records.  
It does not change database schema.  
It does not connect `/admin`.  
It does not touch production data.

## 2. Implementation under verification

**Verified implementation:**

- `schedule-dry-run-adapter.ts`
- `schedule-dry-run-guards.ts`
- `schedule-dry-run-types.ts`
- `schedule-dry-run-validation.ts`
- `staging-schedule-dry-run-ui.ts` adapter integration

**Implementation commit:** `379ca95`

## 3. Expected adapter behavior

**Update dry-run:**

- `operation: update`
- `module: schedule`
- `targetTable: schedules`
- `targetId` present
- `dryRun: true`
- `actualWrite: false`
- `beforeSnapshot` present
- `payload` present
- `validation` present
- `safety` object present

**Duplicate dry-run:**

- `operation: duplicate`
- `module: schedule`
- `targetTable: schedules`
- `sourceId` present
- `dryRun: true`
- `actualWrite: false`
- `legacy_id: null`
- `published: false`
- `show_on_home: false`
- `home_order: null`
- `safety` object present

## 4. Safety expectations

- adapter accepts no DB client
- adapter accepts no dryRun mode flag
- `actualWrite: false` is hard-coded
- `dryRun: true` is hard-coded
- no Supabase write method is called
- no `.insert()`
- no `.update()`
- no `.delete()`
- no `.upsert()`
- no `rpc()`
- `schedule_months` is not touched
- delete remains disabled
- non-dry-run remains disabled

## 5. Static verification commands

```bash
git status --short
git grep -n -i -E "bikusari" || true
```

```bash
git diff -- src/pages/admin
```

**Expected:** no diff

**Forbidden import check:**

```bash
git grep -n -E "@supabase/supabase-js|createClient|PUBLIC_SUPABASE|SERVICE_ROLE|service_role" \
  src/lib/admin/staging-write/schedule-dry-run-adapter.ts \
  src/lib/admin/staging-write/schedule-dry-run-types.ts \
  src/lib/admin/staging-write/schedule-dry-run-guards.ts \
  2>/dev/null || true
```

**Expected:** no output

**DB write prohibition check:**

```bash
git grep -n -E "\\.insert\\(|\\.update\\(|\\.delete\\(|\\.upsert\\(|rpc\\(" \
  src/lib/admin/staging-write/schedule-dry-run-adapter.ts \
  src/lib/admin/staging-write/schedule-dry-run-types.ts \
  src/lib/admin/staging-write/schedule-dry-run-guards.ts \
  src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts \
  2>/dev/null || true
```

**Expected:** no output

**Build:**

```bash
npm run build
```

**Report CLI:**

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-adapter-verification.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-adapter-verification/gosaki
```

### Static verification results (automated run)

| Check | Result | Notes |
|-------|--------|-------|
| `src/pages/admin` diff | PASS | no diff |
| Forbidden imports in adapter/guards/types | PASS | no matches |
| DB write methods in adapter/UI files | PASS | no matches |
| `npm run build` | PASS | success |
| Report CLI | PASS | see output dir (not committed) |

## 6. Manual browser verification plan

**Dev server:**

```bash
ENABLE_ADMIN_STAGING_SHELL=true npm run dev
```

**Open:**

```txt
/__admin-staging-shell/musician-basic/
```

**Checklist:**

- Schedule dry-run PoC section が表示される
- Upcoming/Past が表示される
- scheduleを選択できる
- edit formが表示される
- Update dry-runでpayload previewが出る
- Update result has `operation: update`
- Update result has `dryRun: true`
- Update result has `actualWrite: false`
- Update result has `safety` object
- Duplicate dry-runでpayload previewが出る
- Duplicate result has `operation: duplicate`
- Duplicate result has `dryRun: true`
- Duplicate result has `actualWrite: false`
- Duplicate payload has `legacy_id: null`
- Duplicate payload has `published: false`
- Duplicate payload has `show_on_home: false`
- Duplicate payload has `home_order: null`
- Deleteボタンがない
- Non-dry-runボタンがない
- Profile PoCが壊れていない
- Debug Panelが壊れていない

## 7. Verification result placeholders

Automated static checks have been run (see §5). Manual browser verification is deferred to the result phase.

```txt
manualBrowserVerification: pass
staticSafetyVerification: pass
buildVerification: pass
reportCliVerification: pass
```

Manual browser confirmation recorded in [schedule-dry-run-adapter-verification-result.md](./schedule-dry-run-adapter-verification-result.md).

## 8. Gate decision

```txt
readyForG6E3ScheduleDryRunAdapterManualVerification: true
readyForG6EWriteAdapterPlanning: false
readyForG6EWriteImplementation: false
readyForNonDryRunSchedulePoC: false
```

## 9. Recommended next phase

```txt
Recommended next:
G-6-e3-schedule-dry-run-adapter-verification-result — DONE (see schedule-dry-run-adapter-verification-result.md)
Next: G-6-e4-schedule-write-adapter-planning
```

**Purpose:** Record the manual browser verification result after testing the adapter-routed dry-run UI.

## 10. Final safety statement

This phase prepares verification only.

No schedule records are written.  
No database schema is changed.  
No real write adapter is implemented.  
No production data is touched.  
No `/admin` route is connected.

Schedule write implementation remains blocked.

## Report

```bash
node tools/static-to-astro/scripts/report-schedule-dry-run-adapter-verification.mjs \
  --out-dir tools/static-to-astro/output/schedule-dry-run-adapter-verification/gosaki
```

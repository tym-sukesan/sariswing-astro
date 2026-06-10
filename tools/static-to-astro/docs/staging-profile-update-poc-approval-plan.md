# Staging Profile Update PoC Approval Plan

## 1. Purpose

**G-6-d-prep is a planning and approval phase only.**

G-6-c added disabled write action UI so Save / Create / Delete / Publish are visible but not executable. G-6-d-prep defines **exactly one** first write PoC — staging profile text update — and the approval conditions required before G-6-d implementation may begin.

```txt
G-6-d-prep is a planning and approval phase only.
No database write is implemented.
No write adapter is implemented.
No save button is enabled.
canWrite remains false.
No SQL is executed.
No RLS policy is created or changed.
No Storage operation is implemented.
No Publish operation is implemented.
No /admin route is connected.
No production data is touched.
```

Follows:

- [write-operation-safety-plan.md](./write-operation-safety-plan.md) (G-6-a)
- [rls-write-policy-review-plan.md](./rls-write-policy-review-plan.md) (G-6-b)
- [disabled-write-action-scaffold.md](./disabled-write-action-scaffold.md) (G-6-c)

Staging shell route only: `/__admin-staging-shell/musician-basic/`.

## 2. Current state

At G-6-c completion:

```txt
uiOnly: true
canWrite: false
writeOperationsEnabled: false
writeAdapterImplemented: false
dbWriteImplemented: false
sqlExecuted: false
rlsPolicyChanged: false
storageConnected: false
publishConnected: false
adminRouteConnected: false
productionDataTouched: false
readyForG6D: false
readyForG6DPlanning: true
readyForG6Implementation: false
```

G-6-d-prep does not change any runtime flag. All write actions remain disabled in UI.

## 3. Approval ID

```txt
Approval ID:
G-6-d-staging-profile-update-poc
```

```txt
This approval ID is not activated in G-6-d-prep.
Implementation must not start until the user explicitly approves G-6-d with this approval ID.
```

Activation rules (future G-6-d only):

- User provides explicit approval in chat / ticket / runbook sign-off
- `PUBLIC_ADMIN_WRITE_APPROVAL_ID` must match this ID when write env gates are enabled
- Mismatch → Save remains disabled, write provider stays `disabled`

## 4. First write PoC scope

```txt
Allowed in future G-6-d only after approval:
- staging project only
- profile table only
- one existing row only
- update operation only
- text fields only
- authenticated admin/editor only
- rollback documented
```

Forbidden (G-6-d-prep and future G-6-d first PoC):

```txt
- create
- delete
- restore
- duplicate
- reorder
- publish toggle
- image upload
- public site update
- production write
- /admin route connection
```

## 5. Target table and fields

**Table:** `profile` (confirm exact table name on staging schema before G-6-d).

Candidate columns (names may differ — verify on staging):

```txt
profile:
- display_name
- catchphrase
- bio
- website_url
- social links text/json
- updated_at
- updated_by
```

Field classification:

```txt
Allowed candidate:
- safe text field
- short text
- URL text with validation

Not allowed in first PoC:
- image fields
- publish status
- deleted_at
- role fields
- auth fields
- storage paths
```

G-6-d must use an explicit allowlist of column names confirmed on staging. No wildcard `UPDATE profile SET ...`.

## 6. Why profile update first

Profile update is the lowest-risk first write PoC:

```txt
- single row
- low public-structure risk
- update-only
- easy before/after snapshot
- rollback simple
- no create/delete
- no ordering
- no media
- no publish workflow
```

Aligns with G-6-a risk matrix: profile text update = low risk, first PoC candidate.

## 7. RLS / role requirements before implementation

Preflight checklist (not executed in G-6-d-prep):

```txt
[ ] staging Supabase project confirmed
[ ] production project excluded
[ ] profile table confirmed
[ ] RLS enabled
[ ] existing read/write policies reviewed
[ ] anon write blocked
[ ] authenticated write scoped
[ ] viewer cannot write
[ ] admin/editor role source confirmed
[ ] role enforcement does not rely only on browser display
[ ] rollback fields confirmed
[ ] updated_at / updated_by behavior defined
```

**G-6-d-prep does not change RLS.**

Draft policy skeleton (reference only — **do not run**):

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-prep.
-- Future G-6-d: authenticated admin/editor may UPDATE allowlisted text columns on profile
-- WHERE id = :target_row_id AND site_id = :staging_site_id;
-- anon: no write
-- viewer role: no write
```

## 8. canWrite transition conditions

`canWrite` may become `true` only if **all** conditions are met (future G-6-d):

```txt
canWrite may become true only if:
- explicit approval ID is provided
- env gate enables staging write
- target is staging project
- target module is profile
- target operation is update
- target row is confirmed
- role is admin/editor
- RLS policy review is complete
- rollback plan is written
- UI warning is visible
```

G-6-d-prep:

```txt
canWrite remains false.
writeOperationsEnabled remains false.
```

## 9. Environment gate plan

Future G-6-d env gates (defaults must remain disabled):

```env
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_PROVIDER=disabled
PUBLIC_ADMIN_WRITE_MODULE=profile
PUBLIC_ADMIN_WRITE_APPROVAL_ID=
```

Rules:

- All defaults `false` / `disabled` / empty
- Write provider `disabled` until approval ID matches and staging project confirmed
- No service role key in browser or client bundle
- Real URLs and secrets are never committed

G-6-d-prep does not add these to runtime `.env` — documented for G-6-d implementation only.

## 10. UI enablement plan

Future G-6-d may enable **one** UI action only:

```txt
Profile module:
- Save profile text fields
```

G-6-d-prep:

```txt
The Save button remains disabled in G-6-d-prep.
No UI action is enabled.
G-6-d may enable only the profile save action after approval.
All other actions remain disabled.
```

Disabled scaffold gate mapping (unchanged until G-6-d):

| Action | Gate | G-6-d-prep status |
| --- | --- | --- |
| profile save | G-6-d-staging-profile-update-poc | disabled |
| all other writes | G-6-e … G-6-i | disabled |

## 11. Rollback plan

Before first G-6-d write, capture:

```txt
- before snapshot
- after snapshot
- target row id
- target fields
- updated_at before/after
- updated_by
- rollback SQL or manual rollback instruction
- rollback confirmation checklist
```

Draft rollback SQL (reference only — **do not run** in G-6-d-prep):

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-d-prep.
-- Rollback profile text fields to before-snapshot values
-- UPDATE profile
-- SET display_name = :before_display_name,
--     catchphrase = :before_catchphrase,
--     bio = :before_bio,
--     website_url = :before_website_url,
--     updated_at = :before_updated_at,
--     updated_by = :rollback_actor
-- WHERE id = :target_row_id;
```

Rollback confirmation checklist:

```txt
[ ] before snapshot saved
[ ] after snapshot saved
[ ] rollback SQL or manual steps tested on staging copy (G-6-d, not prep)
[ ] updated_at / updated_by verified after rollback
[ ] read-only display shows pre-write values
```

## 12. Audit / logging requirements

Future G-6-d write attempts must log (no real PII in committed docs):

```txt
- approval ID
- actor user id
- actor email if safe
- role
- target table
- target row id
- operation
- before values
- after values
- timestamp
- rollback status
```

Use staging-safe placeholders in reports. Do not commit customer emails or production identifiers.

## 13. Dry-run / disabled fallback plan

```txt
- default provider remains disabled
- dry-run mode can generate intended update payload
- dry-run must not call Supabase update
- disabled fallback must show why write is unavailable
- failed preflight keeps Save disabled
```

Dry-run output example (JSON, no DB call):

```json
{
  "mode": "dry-run",
  "approvalId": "G-6-d-staging-profile-update-poc",
  "table": "profile",
  "operation": "update",
  "rowId": "<staging-row-id>",
  "fields": { "display_name": "...", "bio": "..." },
  "wouldWrite": false
}
```

## 14. Test scenarios for future G-6-d

After G-6-d implementation (not in prep):

```txt
viewer:
- cannot see enabled Save
- cannot update

editor:
- can update only approved profile text fields
- cannot publish
- cannot delete

admin:
- can update approved profile text fields
- cannot publish in G-6-d
- cannot update non-approved fields

unauthenticated:
- cannot update

production project:
- no test performed
```

## 15. Not allowed in G-6-d

Even after approval, first G-6-d PoC excludes:

```txt
- create
- delete
- restore
- duplicate
- reorder
- publish toggle
- image upload
- media storage write
- public site update
- /admin route connection
- production write
```

## 16. G-6-d-prep completion criteria

```txt
stagingProfileUpdatePocApprovalPlanCreated: true
approvalIdDefined: true
firstWriteScopeLimited: true
targetModuleProfileOnly: true
targetOperationUpdateOnly: true
targetFieldsTextOnly: true
canWrite: false
writeOperationsEnabled: false
writeAdapterImplemented: false
dbWriteImplemented: false
saveButtonEnabled: false
sqlExecuted: false
rlsPolicyChanged: false
readyForG6DImplementation: false
readyForG6DApproval: true
readyForG6Implementation: false
```

```bash
node tools/static-to-astro/scripts/report-staging-profile-update-poc-approval-plan.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-update-poc-approval-plan/gosaki
```

## 17. Next phase recommendation

**G-6-d（完了）:** [staging-profile-update-poc-implementation.md](./staging-profile-update-poc-implementation.md) — gated staging profile update PoC; default disabled; dry-run default true; profile update only.

```txt
G-6-d must not start automatically.
The user must explicitly approve G-6-d-staging-profile-update-poc.
```

Approval plan satisfied — implementation doc and `src/lib/admin/staging-write/` added.

## 18. Final safety statement

**G-6-d-prep is a planning and approval phase only.**

```txt
G-6-d-prep is a planning and approval phase only.
No database write is implemented.
No write adapter is implemented.
No Save button is enabled.
canWrite remains false.
No SQL is executed.
No RLS policy is created or changed.
No Storage operation is implemented.
No Publish operation is implemented.
No GitHub dispatch is implemented.
No FTP deploy is implemented.
No /admin route is connected.
No production data is touched.
```

# Staging Profile Write Hardening

## 1. Purpose

**Phase:** `G-6-d-hardening`

This phase hardens the successful G-6-d staging profile write PoC before broader write expansion.

This phase hardens the successful G-6-d staging profile write PoC before broader write expansion.
It does not perform additional database writes.
It does not roll back the previous update.
It does not connect /admin.
It does not touch production data.

Cursor does not execute Supabase SQL or additional profile updates in this phase.

## 2. Current G-6-d success state

Recorded in [staging-profile-non-dry-run-result-report.md](./staging-profile-non-dry-run-result-report.md).

```txt
G-6-d first manual non-dry-run: SUCCESS
profileUpdateExecuted: true
nonDryRunExecuted: true
targetProject: static-to-astro-cms-staging
targetTable: public.profile
operation: update
rowsAffected: 1
fieldsChanged: bio
nameUnchanged: true
updatedAtChanged: true
updatedBy: NULL
productionDataTouched: false
adminRouteConnected: false
readyForG6E: false
```

Verified flow:

```txt
Astro staging shell
→ Supabase Auth (real login)
→ admin_users RLS read (authenticated self-row)
→ public.profile UPDATE policy
→ public.profile 1-row update
→ SQL Editor verification
```

## 3. Why hardening is needed

```txt
- updated_by remains NULL after successful update
- UI role display still comes from mock allowlist (example.com only)
- DB RLS uses admin_users, but UI does not query admin_users
- admin_users policies include broader-looking admin policies and need audit
- dry-run restore must be explicit after non-dry-run tests
- broader writes need a new planning/approval phase (not G-6-e implementation yet)
```

## 4. updated_by hardening plan

**Current state:**

```txt
updated_by remains NULL after successful profile update.
updated_at is set (trigger or DB default).
```

**Likely reasons:**

```txt
- write adapter updates name/bio only (profile-update-poc-adapter.ts)
- updated_by is not set from session.user.id in the adapter payload
- no DB trigger sets updated_by from auth.uid() yet
```

**Options:**

| Option | Description | Pros | Cons |
| --- | --- | --- | --- |
| **A** | Adapter sets `updated_by = session.user.id` on update | Explicit in app code; easy to test in staging shell | Client must pass user id; must stay in sync with RLS |
| **B** | DB trigger sets `updated_by = auth.uid()` on UPDATE | Consistent for all writers; harder to forget | Requires schema change + audit; trigger must not break dry-run expectations |
| **C** | Leave NULL for G-6-d; defer | No risk in hardening phase | Audit trail incomplete |

**Recommendation for G-6-d-hardening:**

```txt
G-6-d-hardening: no real DB change. Document only.
Next dedicated phase: evaluate Option B (DB trigger with auth.uid()) after RLS audit.
Fallback: Option A in adapter if trigger is not acceptable on staging schema.
```

Design preference after audit:

```txt
Prefer DB-side updated_by trigger using auth.uid() for consistency, after RLS audit.
```

## 5. role display hardening plan

**Current state:**

```txt
Debug Panel:
  Admin role: denied (not in mock allowlist — confirm admin_users in Supabase)
  Role source: mock-allowlist (admin_users not queried)

DB:
  public.profile UPDATE policy checks role via public.admin_users
```

**Options:**

| Option | Description | This phase |
| --- | --- | --- |
| **A** | Keep UI role mock-only; clarify warning copy | **Implemented / documented** |
| **B** | Read-only admin_users self-role resolver in staging shell | Deferred — after RLS audit |
| **C** | Server/Edge role resolver | Deferred |

**Implemented copy (staging shell Debug Panel / Profile PoC):**

```txt
UI role is mock-only. DB write authorization is enforced by public.admin_users RLS and profile update policy.
```

## 6. Dry-run restore checklist

After any non-dry-run test, restore dry-run mode before further staging work:

```txt
[ ] Stop dev server after one non-dry-run test
[ ] Confirm future startup uses PUBLIC_ADMIN_WRITE_DRY_RUN=true
[ ] Do not put PUBLIC_ADMIN_WRITE_DRY_RUN=false in .env.local
[ ] If .env.local contains PUBLIC_ADMIN_WRITE_DRY_RUN, it must be true
[ ] Re-run Debug Panel and confirm Dry-run mode: true before further testing
[ ] Confirm Save shows dry-run message (no DB update) when testing UI again
```

**Reminder:** `PUBLIC_ADMIN_WRITE_DRY_RUN=false` is for one manual test only. Default remains `true`.

## 7. RLS / GRANT hardening notes

**public.profile:**

```txt
GRANT SELECT ON public.profile TO anon, authenticated
GRANT UPDATE ON public.profile TO authenticated
RLS SELECT policy: Public can read profile
RLS UPDATE policy: Admins and editors can update profile
```

**public.admin_users:**

```txt
GRANT SELECT ON public.admin_users TO authenticated
RLS SELECT policy: Authenticated users can read own admin user row
  USING (user_id = auth.uid())
```

**Critical dependency:**

```txt
profile UPDATE policy depends on admin_users SELECT visibility for authenticated users.
Without authenticated SELECT on own admin_users row, profile Save fails with permission denied for table admin_users.
```

## 8. admin_users policy audit pre-check

**Policies visible on staging (record for audit — not executed in this phase):**

```txt
Authenticated users can read own admin user row
admin_users_admin_delete
admin_users_admin_insert
admin_users_admin_select
admin_users_admin_update
```

**Audit checklist (future RLS audit phase):**

```txt
- who can insert admin_users
- who can update roles
- who can delete admin_users
- whether policies rely on role in admin_users
- whether self-read policy is sufficiently narrow (user_id = auth.uid())
- whether service role is never exposed to browser
- whether admin_* policies are broader than intended for staging PoC
```

This phase: **pre-check plan only** — no policy changes by Cursor.

## 9. G-6-e gate

G-6-e implementation remains blocked until:

```txt
- G-6-d hardening recorded (this phase)
- dry-run restore confirmed after non-dry-run test
- admin_users policy audit planned or completed
- next write target scoped (module, operation, table)
- approval ID defined for next phase
- rollback plan defined
- no production route involved
```

**Gate state after G-6-d-hardening:**

```txt
readyForG6EPlanning: true
readyForG6EImplementation: false
additionalProfileUpdateExecuted: false
```

## 10. Recommended next phases

```txt
1. G-6-d-hardening (this phase) — record gaps; UI diagnostics only
2. Dry-run restore confirmation — user verifies PUBLIC_ADMIN_WRITE_DRY_RUN=true
3. RLS audit — admin_users + profile policies before broader writes
4. G-6-e-planning — scope next write target; no implementation
5. G-6-e implementation — only after separate approval ID and gate pass
```

**Recommended next:** RLS audit before G-6-e implementation.

**G-6-rls-audit（完了）:** [staging-rls-audit.md](./staging-rls-audit.md) — read-only audit plan and SQL checklist; `auditStatus: not_run`; admin_users policy review required before G-6-e implementation; no policy/grant changes by Cursor; `readyForG6EImplementation: false`.

Optional follow-up implementation phases (not this phase):

```txt
G-6-d-updated-by-support — adapter or trigger; separate approval
G-6-d-role-display-alignment — read-only admin_users self-role in UI; after RLS audit
```

## 11. Final safety statement

```txt
G-6-d-hardening does not perform additional writes.
The previous staging update remains as recorded in G-6-d-result-report.
No production data is touched.
No /admin route is connected.
Broader write expansion remains blocked until a new approved phase.
```

## Report

```bash
node tools/static-to-astro/scripts/report-staging-profile-write-hardening.mjs \
  --out-dir tools/static-to-astro/output/staging-profile-write-hardening/gosaki
```

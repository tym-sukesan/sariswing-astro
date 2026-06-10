# Write Operation Safety Plan

## 1. Purpose

G-6-a defines how CMS Kit will **eventually** enable write operations on the staging shell — after read-only phase (G-5z) and customer demo package (G-5z-f) are complete. This document is **planning only**.

**G-6-a is a planning phase only.**

- No write operation is implemented in G-6-a
- No RLS policy is created or changed
- No Storage operation is implemented
- No Publish operation is implemented
- No `/admin` route is connected
- No production data is touched

Related:

- [read-only-qa-rls-review-report.md](./read-only-qa-rls-review-report.md) (G-5z-e)
- [customer-demo-package-before-writes/README.md](./customer-demo-package-before-writes/README.md) (G-5z-f)
- [schema-mapping-rls-read-policy-review.md](./schema-mapping-rls-read-policy-review.md) (read policies)

## 2. Current state

At G-5z-f / pre-G-6-a:

| Flag | Value |
| --- | --- |
| `readOnlyPhaseComplete` | `true` |
| `readyForCustomerDemo` | `true` |
| `readyForG6Planning` | `true` |
| `readyForG6Implementation` | `false` |
| `canWrite` | `false` |
| `writeOperationsEnabled` | `false` |
| `adminRouteConnected` | `false` |
| `storageConnected` | `false` |
| `publishConnected` | `false` |
| `productionDataTouched` | `false` |

Staging shell route: `/__admin-staging-shell/musician-basic/` only.

## 3. Write operation scope

### Target modules

```txt
profile
schedule
discography
links
news
```

### Candidate operations (not implemented in G-6-a)

```txt
create
update
delete          → logical delete only (see §9)
restore
duplicate
reorder
publishToggle
draftToggle
```

**G-6-a does not implement any of these operations.**

## 4. Operation risk matrix

| operation | example module | risk level | data loss risk | public visibility risk | rollback complexity | RLS complexity | recommended phase | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| update (text) | profile bio | Low | Low | Low | Low | Medium | G-6-d | First PoC candidate |
| reorder | links | Low | Low | Low | Low | Medium | G-6-g | sort_order only |
| draftToggle | links | Low | Low | Medium | Low | Medium | G-6-g | staging only initially |
| update | schedule fields | Medium | Medium | Medium | Medium | High | G-6-d+ | date/venue validation |
| create | schedule | Medium | Low | Medium | Medium | High | G-6-e | after update PoC |
| duplicate | schedule | Medium | Low | Medium | Medium | High | G-6-g | copy + new legacy_id |
| update | discography text | Medium | Low | Medium | Medium | High | G-6-e+ | text-only first; no image |
| create | news draft | Medium | Low | High | Medium | High | G-6-e+ | table mapping confirm |
| logical delete | any module | High | Medium | High | Medium | High | G-6-f | **never physical delete** |
| restore | any module | High | Medium | High | Medium | High | G-6-f | requires soft-delete columns |
| publishToggle | schedule/news | High | Low | **Very high** | High | High | G-6-i | separate publish plan |
| image upload | profile/discography | High | Medium | Medium | High | High | G-6-h | Storage phase; not G-6-d |
| production publish | site | **Critical** | High | **Critical** | High | Critical | G-6-j+ | explicit approval only |

### Risk level guide

**Low:** update single safe text field; reorder links; draft toggle in staging only.

**Medium:** create schedule; update schedule date/time; update profile fields; duplicate schedule.

**High:** delete; restore; publish toggle; production publish; image upload.

## 5. Recommended implementation order

```txt
G-6-a: write operation safety plan          ← this document
G-6-b: RLS write policy review plan
G-6-c: disabled write action scaffold
G-6-d: staging update-only proof of concept
G-6-e: staging create operation
G-6-f: staging logical delete / restore
G-6-g: staging reorder / duplicate
G-6-h: staging media write plan
G-6-i: staging publish plan
G-6-j: production readiness gate
```

G-6-a plans G-6-b onward; it does not implement them.

## 6. Module-by-module write plan

### profile

**Planned operations:**

- update profile text fields (name, bio)
- update social / hero image URL (text field only until G-6-h)

**Notes:**

- Single row expected (limit 1 on read)
- Rollback is straightforward
- **Recommended first write PoC** (G-6-d): staging, single table, single row, update-only

### links

**Planned operations:**

- create link
- update link (label, url)
- reorder links
- draft/visible toggle (`published`)
- logical delete

**Notes:**

- Start with low-risk reorder / update
- URL validation required (https, length, no javascript: URLs)
- Before publish toggle

### schedule

**Planned operations:**

- create schedule
- update schedule
- duplicate schedule
- logical delete / restore
- publish toggle (`published`)

**Notes:**

- Date, venue, public visibility — high customer impact
- Implement **after** profile/links PoC
- Align with `schedules` table + RLS on `published`

### discography

**Planned operations:**

- create item
- update item (text fields)
- reorder item
- logical delete / restore
- cover image assignment

**Notes:**

- Image upload deferred to **G-6-h** (media phase)
- G-6 initial: **text-only update** only

### news

**Planned operations:**

- create news (draft)
- update news
- draft/published toggle
- logical delete / restore

**Notes:**

- High public visibility when `published = true`
- Table may be missing on some staging projects — confirm mapping (G-5z-c-prep: likely)
- Published toggle only after G-6-i publish plan

## 7. RLS write policy review requirements

**No write policy is created in G-6-a.**

Principles:

- RLS write policy must be reviewed **before** any real write
- Anon key must **not** allow unrestricted writes
- Role enforcement must **not** rely only on browser display
- Server-side or database-side enforcement required before meaningful writes

### RLS write review checklist

```txt
[ ] target table confirmed on staging project
[ ] RLS enabled on target table
[ ] anon write policy absent by default
[ ] authenticated write policy scoped by role
[ ] admin/editor role mapping confirmed
[ ] viewer has no writes
[ ] delete is logical delete only (no physical delete policy for editors)
[ ] updated_at / updated_by behavior defined
[ ] staging project only
[ ] production project excluded
```

### Draft policy shape (reference only)

```sql
-- DRAFT ONLY. DO NOT RUN IN G-6-a.
-- Example: authenticated users with admin role may update profile row.
-- create policy "editors_update_profile"
--   on public.profile for update
--   to authenticated
--   using ( /* role check via admin_users or JWT claim */ )
--   with check ( /* same scope */ );
```

## 8. Role / permission model for writes

| Role | Staging writes | Publish | Delete | Notes |
| --- | --- | --- | --- | --- |
| **admin** | all staging writes (after approval gates) | toggle only after G-6-i approval | logical delete after G-6-f | no production publish in G-6 |
| **editor** | create/update draft content; reorder | no | no delete unless approved phase | no publish toggle initially |
| **viewer** | none | none | none | read-only |

**Critical:** browser role display (G-5y-e-a mock) is **informational only**. Enforcement via RLS + server-side allowlist (see [private-server-side-allowlist-plan.md](./private-server-side-allowlist-plan.md)) before writes matter.

## 9. Data safety / rollback policy

Before any write implementation:

| Measure | Requirement |
| --- | --- |
| Delete style | **Logical delete** preferred (`deleted_at`, `deleted_by`); no physical delete in G-6 PoC |
| Update audit | `updated_at`, `updated_by` on mutable tables |
| Snapshots | before/after snapshot or change history recommended for updates |
| Batch rollback | rollback manifest for multi-row operations |
| Publish | preview before publish; separate approval gate |
| Recovery | documented restore procedure per module |

### First write PoC recommendation (G-6-d)

```txt
staging only
single table (profile)
single row
update-only (e.g. bio text)
no publish
no delete
rollback documented
approval ID required
canWrite enabled only for that scoped operation
```

## 10. Disabled action scaffold plan

All actions remain **disabled** in G-6-a. G-6-c will add UI scaffold with explicit disabled state.

| UI action | G-6-a status | Example disabled message (JA) |
| --- | --- | --- |
| Save | disabled | 保存はまだ無効です。RLSとrollback確認後にstaging限定で有効化します。 |
| Create | disabled | 新規作成はまだ無効です。 |
| Delete | disabled | 削除はまだ無効です。論理削除のみ将来対応予定です。 |
| Restore | disabled | 復元はまだ無効です。 |
| Duplicate | disabled | 複製はまだ無効です。 |
| Reorder | disabled | 並び替えはまだ無効です。 |
| Publish toggle | disabled | 公開切替はまだ無効です。 |
| Upload image | disabled | 画像アップロードは未接続です。 |
| Update public site | disabled | 公開サイト更新は無効です。 |

Buttons must be visibly disabled (not hidden without explanation).

## 11. Preflight checklist before first write

```txt
[ ] staging Supabase project confirmed
[ ] production project excluded
[ ] target table confirmed
[ ] target row selected (for update PoC)
[ ] RLS write policy reviewed (G-6-b complete)
[ ] role enforcement confirmed (not browser-only)
[ ] rollback procedure written
[ ] dry-run / inspect CLI exists
[ ] write limited to one operation type
[ ] UI shows staging-only warning
[ ] canWrite remains false until explicit approval ID
[ ] approval ID prepared and recorded in docs/runtime status
```

## 12. Approval gates

Each write-related phase requires an explicit approval ID (pattern from G-5z-c):

| Approval ID | Phase |
| --- | --- |
| `G-6-b-rls-write-policy-review` | RLS write policy review plan |
| `G-6-c-disabled-write-actions-scaffold` | Disabled write UI scaffold |
| `G-6-d-staging-profile-update-poc` | Staging update-only PoC |
| `G-6-e-staging-create-operation` | Staging create |
| `G-6-f-staging-logical-delete-restore` | Logical delete / restore |
| `G-6-g-staging-reorder-duplicate` | Reorder / duplicate |
| `G-6-h-staging-media-write-plan` | Media / Storage write plan |
| `G-6-i-staging-publish-plan` | Publish workflow plan |
| `G-6-j-production-readiness-gate` | Production readiness |

No phase may skip its gate.

## 13. Forbidden operations

```txt
- production DB write
- production publish
- physical delete (as default editor action)
- write without RLS review
- write without rollback plan
- write from browser-only role enforcement
- service role in browser
- FTP deploy triggered by admin UI
- GitHub dispatch without explicit approval
- /admin route connection before readiness gate
- select * in write adapters
- expanding approved read fields without separate approval
```

## 14. G-6-a completion criteria

```txt
writeOperationSafetyPlanCreated: true
writeOperationInventoryCreated: true
rlsWritePolicyReviewRequired: true
rollbackPolicyDocumented: true
approvalGatesDefined: true
disabledActionPlanCreated: true
canWrite: false
writeOperationsEnabled: false
readyForG6B: true
readyForG6Implementation: false
```

Machine-readable check:

```bash
node tools/static-to-astro/scripts/report-write-operation-safety-plan.mjs \
  --out-dir tools/static-to-astro/output/write-operation-safety-plan/gosaki
```

## 15. Next phase recommendation

**G-6-b（完了）:** [rls-write-policy-review-plan.md](./rls-write-policy-review-plan.md) — review/planning only; `readyForG6C: true`.

**G-6-c（完了）:** [disabled-write-action-scaffold.md](./disabled-write-action-scaffold.md) — UI scaffold only; all write actions disabled; `canWrite: false`, `writeOperationsEnabled: false`, `readyForG6D: false`, `readyForG6DPlanning: true`.

**Proceed to:** **G-6-d staging profile update PoC planning / approval**

**Do not yet:** G-6-d implementation without approval ID.

Sequence: G-6-c (disabled scaffold) → G-6-d (staging update-only PoC after approval).

## 16. Final safety statement

**G-6-a is a planning phase only.**

```txt
No database write is implemented.
No write adapter is implemented.
No RLS policy is created or changed.
No Storage operation is implemented.
No Publish operation is implemented.
No GitHub dispatch is implemented.
No FTP deploy is performed.
No /admin route is connected.
No production data is touched.
```

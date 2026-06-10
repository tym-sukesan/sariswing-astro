# Disabled Write Action Scaffold

## 1. Purpose

**G-6-c is a UI scaffold phase only.**

```txt
No database write is implemented.
No write adapter is implemented.
No SQL is executed.
No RLS policy is created or changed.
All write actions remain disabled.
```

G-6-c follows [write-operation-safety-plan.md](./write-operation-safety-plan.md) (G-6-a) and [rls-write-policy-review-plan.md](./rls-write-policy-review-plan.md) (G-6-b). It adds **disabled** Save / Create / Delete / Restore / Duplicate / Reorder / Publish / Upload / Update public site UI so customers and developers can see **what will exist later** without any write capability.

Staging shell route only: `/__admin-staging-shell/musician-basic/`. No `/admin/` connection.

## 2. Current state

```txt
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

Config: `config/admin/disabled-write-action-scaffold.json`

## 3. Added components

| Component | Role |
| --- | --- |
| `AdminDisabledActionButton.astro` | Disabled `<button type="button">` with gate / reason labels |
| `AdminDisabledActionNotice.astro` | Module / shell notice that writes are disabled |
| `AdminWriteGateBadge.astro` | Current gate, next gate, status badge |
| `AdminWriteActionMatrix.astro` | Module × operation matrix (all disabled) |
| `AdminWritePreflightChecklist.astro` | Pre-first-write checklist (all unchecked) |
| `ModuleDisabledWriteActionsSection.astro` | Per-module footer section wrapper |
| `AdminStagingDisabledWriteActionsSection.astro` | Staging shell overview section |

## 4. Disabled action matrix

All operations below are **disabled** in G-6-c.

| Module | Operations (disabled) |
| --- | --- |
| profile | save, update |
| links | save, create, reorder, delete |
| schedule | create, duplicate, delete, restore, publishToggle |
| discography | save, reorder, uploadImage |
| news | create, save, publishToggle, delete |
| media | uploadImage |
| publish | updatePublicSite |

Full list with gates: `config/admin/disabled-write-action-scaffold.json` → `actions[]`.

## 5. Approval gate mapping

| Module | Action | Gate |
| --- | --- | --- |
| profile | save / update | G-6-d-staging-profile-update-poc |
| links | save / reorder | G-6-g-staging-reorder-duplicate |
| links | create | G-6-e-staging-create-operation |
| links | delete | G-6-f-staging-logical-delete-restore |
| schedule | create | G-6-e-staging-create-operation |
| schedule | duplicate | G-6-g-staging-reorder-duplicate |
| schedule | delete / restore | G-6-f-staging-logical-delete-restore |
| schedule | publishToggle | G-6-i-staging-publish-plan |
| discography | save | G-6-d-staging-profile-update-poc |
| discography | reorder | G-6-g-staging-reorder-duplicate |
| discography | uploadImage | G-6-h-staging-media-write-plan |
| news | create / save | G-6-e-staging-create-operation |
| news | publishToggle | G-6-i-staging-publish-plan |
| news | delete | G-6-f-staging-logical-delete-restore |
| media | uploadImage | G-6-h-staging-media-write-plan |
| publish | updatePublicSite | G-6-i-staging-publish-plan |

## 6. Customer demo wording

```txt
この画面では、将来どの項目を保存・追加・削除できるようになるかを確認できます。
現在は安全確認中のため、ボタンはすべて無効になっています。
実際の保存・削除・公開は行われません。
```

English (staging shell banner):

```txt
Write actions are disabled. This is a staging safety review phase.
No data is saved, deleted, or published from this screen.
```

## 7. Developer safety notes

```txt
- buttons must be disabled
- no onclick handlers
- no fetch
- no form submit
- no Supabase write call
- no storage call
- no publish call
```

G-6-c components use `type="button"` and `disabled` only. No `onclick`, no `on:click`, no `fetch`, no `.insert()` / `.update()` / `.delete()` / `.upsert()`.

## 8. Next phase

**G-6-d-prep（完了）:** [staging-profile-update-poc-approval-plan.md](./staging-profile-update-poc-approval-plan.md)

**G-6-d（完了）:** [staging-profile-update-poc-implementation.md](./staging-profile-update-poc-implementation.md) — profile Save PoC gated by env + approval ID; default disabled; dry-run default true; `/admin` disconnected; production forbidden.

Other write actions in this scaffold remain disabled. Only profile text update PoC may enable when gates pass.

**G-6-d-verify（完了）:** [staging-profile-update-poc-verification-checklist.md](./staging-profile-update-poc-verification-checklist.md) — verification only; `nonDryRunExecuted: false`; manual first write after user approval.

## 9. Final safety statement

**G-6-c is a UI scaffold phase only.**

```txt
No database write is implemented.
No write adapter is implemented.
No SQL is executed.
No RLS policy is created or changed.
No Storage operation is implemented.
No Publish operation is implemented.
No GitHub dispatch is implemented.
No FTP deploy is implemented.
No /admin route is connected.
No production data is touched.
```

## Completion criteria

```txt
disabledActionComponentsCreated: true
moduleDisabledActionsVisible: true
uiOnly: true
canWrite: false
writeOperationsEnabled: false
writeAdapterImplemented: false
dbWriteImplemented: false
readyForG6D: false
readyForG6DPlanning: true
readyForG6Implementation: false
```

```bash
node tools/static-to-astro/scripts/report-disabled-write-action-scaffold.mjs \
  --out-dir tools/static-to-astro/output/disabled-write-action-scaffold/gosaki
```

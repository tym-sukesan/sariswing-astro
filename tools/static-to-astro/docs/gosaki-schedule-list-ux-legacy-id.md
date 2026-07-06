# G-22g1a — Gosaki Schedule list UX improvement: legacy_id visibility

**Phase:** `G-22g1a-gosaki-schedule-list-ux-legacy-id`  
**Status:** **complete** — UI display only; **no DB write**  
**Date:** 2026-07-06  
**Base commit:** `814a77f`  
**Prior:** [gosaki-schedule-p0-crud-next-plan.md](./gosaki-schedule-p0-crud-next-plan.md) (G-22g)

| Check | Status |
| --- | --- |
| legacy_id in schedule list | **yes** |
| selected row summary strengthened | **yes** |
| G-22f UX lesson addressed | **yes** |
| Save / DB write / FTP | **no** |

---

## Gates

```txt
gosakiScheduleListUxLegacyIdComplete: true
phase: G-22g1a-gosaki-schedule-list-ux-legacy-id
readyForG22g1bDevMockSectionIsolation: true
readyForG22g1cPreSavePanelEnhancement: true
saveExecuted: false
dbWriteExecuted: false
cursorDbWriteExecuted: false
sqlMutationExecuted: false
rollbackSqlExecuted: false
packageRegenExecuted: false
ftpUploadExecuted: false
publicReflectionExecuted: false
writeArmedDevServerStarted: false
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. Purpose

G-22f5 operator could not find `schedule-2026-07-008` because the schedule list showed date/title only. G-22g1a adds **`legacy_id` / `id` / `updated_at` / `published`** visibility in the operator list and selected-row summary so operators can identify rows by doc IDs and date/title together.

---

## 2. Git state

| Item | Value |
| --- | --- |
| Branch | `main...origin/main` |
| `HEAD` | `814a77f` |
| `origin/main` | `814a77f` |

---

## 3. UI changes — where legacy_id appears

| Location | Change |
| --- | --- |
| **公演一覧 table (desktop)** | New `legacy_id` column after date; copy-friendly `<code class="gosaki-schedule-legacy-id-code">` |
| **公演一覧 cards (mobile)** | `legacy_id` line + `updated_at` under price |
| **操作列 (desktop)** | Compact meta: `published` status + `updated_at` above「編集する」 |
| **キーワード検索** | Placeholder + filter haystack includes `legacy_id` and `id` |
| **複製元 select** | Options show `date — legacy_id — title` |
| **選択中サマリー** | New `#gosaki-schedule-operator-selected-summary` panel: legacy_id (prominent), date, title, published, id, updated_at |
| **編集フォーム** | Added read-only `id` field (`#gosaki-edit-row-id-value`) alongside existing legacy_id / updated_at |

---

## 4. Selected row summary

When a row is selected (`renderEditForm` / `selectRowById`):

- Panel title: **選択中の公演**
- Fields: `legacy_id` (emphasized), `date`, `title`, `published`, `id`, `updated_at`
- Cleared when no row selected

---

## 5. G-22f confusion — how this helps

| G-22f issue | G-22g1a response |
| --- | --- |
| List had no `legacy_id` | Dedicated column + mobile line + keyword search |
| `schedule-2026-07-008` hard to find | Search `schedule-2026-07-008` or filter 非公開 + date `2026-07-17` |
| Only date/title visible | Summary shows legacy_id + id + updated_at together |
| Dev mock UI confusion | **Deferred to G-22g1b** (minimal change this slice) |

---

## 6. Files changed

| File | Role |
| --- | --- |
| `src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts` | List render, summary, keyword filter, form id field |
| `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` | Table header/column, summary container, form id, keyword placeholder |
| `tools/static-to-astro/templates/admin-cms/styles/admin.css` | legacy_id code, summary panel, row meta, card styles |

**Not changed:** save modules, guards, write adapters, approval IDs, env arms.

---

## 7. Safety confirmation

| Check | Status |
| --- | --- |
| Save executed | **no** |
| DB write executed | **no** |
| SQL mutation | **no** |
| rollback SQL | **no** |
| GRANT/REVOKE | **no** |
| package regen | **no** |
| FTP/upload/deploy | **no** |
| write-armed dev server | **not started** |
| Save/delete/update behavior | **unchanged** (display only) |

---

## 8. Next phases

| Phase | Scope |
| --- | --- |
| **G-22g1b** | Dev/mock section isolation — reduce confusion with operator UI |
| **G-22g1c** | Pre-save panel target emphasis (write-armed legacy_id/date/title) |
| **G-22g2** | Operator procedure hints + Save result label fix |

---

**G-22g1a complete.** Recommended next: **G-22g1b** or **G-22g1c**.

# G-20r3 — Gosaki schedule August DB INSERT preflight

**Phase:** `G-20r3-gosaki-schedule-august-db-insert-preflight`  
**Status:** **complete** — preflight + SQL draft only; **no execution**  
**Date:** 2026-07-09  
**Base commit:** `75e8db6`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-product-quality-policy.md](./gosaki-schedule-product-quality-policy.md) (G-20r2b) · [gosaki-whole-site-product-quality-audit.md](./gosaki-whole-site-product-quality-audit.md) (G-20s)

| Check | Status |
| --- | --- |
| 17 INSERT targets locked | **yes** |
| 2 hold excluded | **yes** |
| sort_order plan documented | **yes** |
| rollback + verification SQL | **yes** |
| approvalId designed | **yes** |
| SQL executed | **no** |

---

## Gates

```txt
gosakiScheduleAugustDbInsertPreflightComplete: true
phase: G-20r3-gosaki-schedule-august-db-insert-preflight
baseCommit: 75e8db6
approvalId: G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice
targetProject: kmjqppxjdnwwrtaeqjta
forbiddenProject: vsbvndwuajjhnzpohghh
insertTargetCount: 17
holdExcludedCount: 2
publishedTrueCount: 14
publishedFalseCount: 3
existingRowsBefore: 60
expectedRowsAfter: 77
sortOrderBumpRows: 60
sqlDraftPath: scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql
sqlExecuted: false
dbWriteExecuted: false
saveExecuted: false
readyForG20r3aAugustBatchInsertOperatorExecution: true
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

G-20r2b 品質方針に基づき、**2026-08 schedule 17件**を staging DB `public.schedules` へ投入するための **preflight** を確定する。

| Scope | In | Out |
| --- | --- | --- |
| INSERT 対象確定 | **yes** | — |
| SQL draft | **yes** | — |
| SQL 実行 / DB write | — | **no**（G-20r3a） |
| package regen / FTP | — | **G-20r4** |
| `SCHEDULE_WRITE_APPROVAL_IDS` コード登録 | — | **G-20r3a**（SQL 経路の場合は doc 承認で代替可） |

---

## 2. approvalId

| Field | Value |
| --- | --- |
| **approvalId** | `G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice` |
| **Type** | batch INSERT（17 rows · single operator session） |
| **Env arm（任意・CMS 経路時）** | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G20R3_AUGUST_BATCH_INSERT_NON_DRY_RUN_ARMED=true` |
| **Execution path** | **推奨:** operator SQL on staging SQL editor（本 preflight draft） |
| **Operator approval form** | プロジェクト規定の「承認します。この操作を1回だけ実行してください。」 |

**G-20r3 では approvalId を doc に登録のみ。** `schedule-write-types.ts` への union 追加は **G-20r3a**（CMS Save 経路を使う場合のみ）。

---

## 3. バッチサマリ

| Item | Value |
| --- | --- |
| Candidates total | **19** |
| **INSERT 対象** | **17** |
| **hold 除外** | **2** (#8, #18) |
| **published=true** | **14** |
| **published=false** | **3** (#7, #9, #13) |
| Existing `gosaki-piano` rows | **60** (months 2026-03 … 2026-07) |
| Expected after batch | **77** |
| August rows before | **0** |

---

## 4. hold 除外（INSERT しない）

| candidate_order | legacy_id (reserved) | date | title | Reason |
| --- | --- | --- | --- | --- |
| **8** | `schedule-2026-08-008` | 2026-08-11 | `<堤智恵子 Trio>` | G-20r2b **hold** — 時刻 `開場 / 開演` のみ · 壊れた表示リスク |
| **18** | `schedule-2026-08-018` | 2026-08-29 | `<Set Sail Special Quartet>` | G-20r2b **hold** — 開場・料金空 |

**legacy_id 008 / 018 は将来追補用に予約。** 本バッチでは INSERT しない。

---

## 5. INSERT 対象 17件

| # | legacy_id | date | title | published | sort_order |
| --- | --- | --- | --- | --- | --- |
| 1 | schedule-2026-08-001 | 2026-08-01 | `<地ビールフェスト2026>` | **true** | 1 |
| 2 | schedule-2026-08-002 | 2026-08-02 | `<地ビールフェスト2026>` | **true** | 2 |
| 3 | schedule-2026-08-003 | 2026-08-06 | `<紀々音>` | **true** | 3 |
| 4 | schedule-2026-08-004 | 2026-08-07 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 4 |
| 5 | schedule-2026-08-005 | 2026-08-08 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 5 |
| 6 | schedule-2026-08-006 | 2026-08-09 | `<Awesome Songbook 2ndEP"Ep.2"発売!Tour>` | **true** | 6 |
| 7 | schedule-2026-08-007 | 2026-08-10 | `<Duo>` | **false** | 7 |
| 9 | schedule-2026-08-009 | 2026-08-15 | `<Duo>` | **false** | 9 |
| 10 | schedule-2026-08-010 | 2026-08-16 | `<Quartet>` | **true** | 10 |
| 11 | schedule-2026-08-011 | 2026-08-16 | `<新谷健介オノマトペ>` | **true** | 11 |
| 12 | schedule-2026-08-012 | 2026-08-20 | `<Brazilian Jazz Trio>` | **true** | 12 |
| 13 | schedule-2026-08-013 | 2026-08-21 | `<原田茅子Quartet>` | **false** | 13 |
| 14 | schedule-2026-08-014 | 2026-08-23 | `<子どもと一緒にジャズライブ>` | **true** | 14 |
| 15 | schedule-2026-08-015 | 2026-08-24 | `<ごさきりかこTrio>` | **true** | 15 |
| 16 | schedule-2026-08-016 | 2026-08-25 | `<ごさきりかこTrio>` | **true** | 16 |
| 17 | schedule-2026-08-017 | 2026-08-28 | `<カリビアンファンクション>` | **true** | 17 |
| 19 | schedule-2026-08-019 | 2026-08-30 | `<KHACHA BAND>` | **true** | 19 |

**共通フィールド（全17件）:**

```txt
site_slug: gosaki-piano
year: 2026
month: 2026-08
source_route: /schedule/2026-08/
source_file: schedule-2026-08.html
show_on_home: false
home_order: null
image_url: null
```

**#14 特記:** `description` に二部制 `time_raw` 全文を追記（推測分割なし）。

---

## 6. sort_order 方針

### 現状（artifact / JSON export）

| Month | sort_order range |
| --- | --- |
| 2026-07 | 1–14 |
| 2026-06 | 15–25 |
| … | … |
| 2026-03 | 48–60 |

新しい月ほど **小さい** `sort_order`。

### 推奨 **Option A**（本 preflight 採用）

| Step | Action |
| --- | --- |
| **0** | `UPDATE public.schedules SET sort_order = sort_order + 19 WHERE site_slug = 'gosaki-piano';` — **60 rows** |
| **1** | INSERT 17 rows · `sort_order` = `candidate_order`（1–7, 9–17, 19） |
| **結果** | August が 1–19 帯（8, 18 は空き）· July → 20–33 |

### 代替 Option B（非推奨）

INSERT のみ · `sort_order = max(sort_order)+10` 連番 — **July 1–14 と衝突** · 却下

### 代替 Option C（非推奨）

July のみ +19 — June 以下と August で順序破綻 — 却下

**G-20r3a 実行順:** Step 0 → Step 1（同一トランザクション推奨）→ verification

---

## 7. beforeVerification SQL（SELECT only — operator / G-20r3a）

**Project guard:** host が `kmjqppxjdnwwrtaeqjta` であることを確認。`vsbvndwuajjhnzpohghh` なら **STOP**。

```sql
-- G-20r3 beforeVerification — August month empty
SELECT count(*) AS august_count
FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-08';
-- Expected: 0

-- legacy_id collision check (17 targets)
SELECT legacy_id FROM public.schedules
WHERE site_slug = 'gosaki-piano'
  AND legacy_id IN (
    'schedule-2026-08-001','schedule-2026-08-002','schedule-2026-08-003',
    'schedule-2026-08-004','schedule-2026-08-005','schedule-2026-08-006',
    'schedule-2026-08-007','schedule-2026-08-009','schedule-2026-08-010',
    'schedule-2026-08-011','schedule-2026-08-012','schedule-2026-08-013',
    'schedule-2026-08-014','schedule-2026-08-015','schedule-2026-08-016',
    'schedule-2026-08-017','schedule-2026-08-019'
  );
-- Expected: 0 rows

-- Baseline row count
SELECT count(*) AS total_gosaki FROM public.schedules
WHERE site_slug = 'gosaki-piano';
-- Expected: 60

-- July sort_order baseline (pre-bump)
SELECT min(sort_order), max(sort_order) FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-07';
-- Expected: 1, 14
```

---

## 8. afterVerification SQL（SELECT only — G-20r3a 実行後）

```sql
-- Row count +17
SELECT count(*) FROM public.schedules WHERE site_slug = 'gosaki-piano';
-- Expected: 77

-- August published breakdown
SELECT published, count(*) FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-08'
GROUP BY published ORDER BY published;
-- Expected: true=14, false=3

-- Hold legacy_ids still absent
SELECT legacy_id FROM public.schedules
WHERE legacy_id IN ('schedule-2026-08-008','schedule-2026-08-018');
-- Expected: 0 rows

-- July sort_order post-bump
SELECT min(sort_order), max(sort_order) FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-07';
-- Expected: 20, 33

-- Anon-visible count (published=true only)
SELECT count(*) FROM public.schedules
WHERE site_slug = 'gosaki-piano' AND month = '2026-08' AND published = true;
-- Expected: 14
```

---

## 9. Rollback 方針（staging only · 未実行）

**順序:**

1. DELETE 17 `legacy_id` rows（listed in §5）
2. `UPDATE public.schedules SET sort_order = sort_order - 19 WHERE site_slug = 'gosaki-piano' AND sort_order >= 20;`

**Rollback SQL:** `scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql` 末尾（コメントアウト）

**注意:** rollback 後も hold #8/#18 は未 INSERT のまま · 再実行は G-20r3a 再承認が必要

---

## 10. SQL draft

| Item | Value |
| --- | --- |
| Path | `tools/static-to-astro/scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql` |
| Status | **DRAFT · NOT EXECUTED** |
| Contents | Step 0 UPDATE (commented) + 17 INSERT + rollback (commented) |

**Cursor / G-20r3:** 本ファイルは **作成のみ** · **実行禁止**

---

## 11. 保護対象（変更しない）

| Item | Rule |
| --- | --- |
| 既存 60 rows（03–07） | content 変更なし · sort_order +19 のみ |
| `schedule_months` | **触らない**（derived / read-only） |
| Sariswing production | **触らない** |
| hold #8, #18 | INSERT しない |
| PoC / test rows | 対象外 |

---

## 12. 次フェーズ

| Phase | Scope |
| --- | --- |
| **G-20r3a-august-batch-insert-operator-execution** | operator が staging で SQL 1回実行 · 結果 doc |
| **G-20r4-schedule-public-reflection-plan** | regen / diff / sitemap 2026-08 · upload plan |

---

## 13. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL execution | **no** |
| DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy | **no** |
| network access | **no** |
| commit / push | **no** |

---

## 14. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-schedule-august-db-insert-preflight.mjs
```

# gosaki Readiness Verifier（Phase 3-Y）

**目的:** gosaki を **staging FTP apply（G-2b）** や実用化検証へ進める前に、CMS Kit パイプライン全体が安全かを一括判定する。

**境界:** dry-run のみ。FTP 接続・本番 deploy・本番 Supabase / Storage には触れない。

関連:

- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)
- [gosaki-staging-operations.md](./gosaki-staging-operations.md)
- [gosaki-admin-operations.md](./gosaki-admin-operations.md)

---

## いつ実行するか

| タイミング | 理由 |
| --- | --- |
| **G-2b 前（必須）** | staging FTP `--apply` のゲート |
| CMS Kit 変更後 | convert / verifier 回帰 |
| クライアント handoff 前 | 公開パイプライン健全性確認 |

---

## 実行コマンド

```bash
node tools/static-to-astro/scripts/verify-gosaki-readiness.mjs \
  --report tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md
```

### オプション

| オプション | 説明 |
| --- | --- |
| `--report PATH` | レポート出力（必須） |
| `--skip-cms-loop` | CMS minimal loop をスキップ（warning） |
| `--skip-storage-plan` | Storage plan をスキップ（warning） |
| `--skip-deploy-plan` | deploy dry-run / plan verifier をスキップ（warning） |
| `--keep-output` | レポートに output 保持を明記（自動削除はしない） |

---

## チェック項目

| ID | 内容 | 期待 |
| --- | --- | --- |
| A | Git status | `gitStatusClean` 記録（dirty は warning） |
| B | 個人メール / secret scan | 実値なし、`.env.local` gitignore |
| C | site profile | musician + profile validation PASS |
| D | convert + admin cms | `--with-admin-cms --site-profile musician` + build |
| E | Supabase export | read-only、schedules 60 / discography 4 / tracks 16 |
| F | npm run build | success |
| G | static-public artifact | `safeForStaticFtp: true`、admin/api 除外 |
| H | deploy dry-run + plan | `applied: false`、`FTP connected: false`、`production rejected` |
| I | CMS minimal loop | baseline → update → export → build → cleanup |
| J | Storage asset plan | dry-run、`uploads performed: no` |
| K | production safety | prod env 拒否、prod secrets 未使用 |

---

## READY_FOR_STAGING_FTP_APPLY

レポート末尾の **`READY_FOR_STAGING_FTP_APPLY: yes/no`** が G-2b のゲート。

### yes 条件

- site profile PASS
- convert PASS
- export PASS
- build PASS
- static-public PASS
- deploy dry-run PASS
- production rejected
- CMS minimal loop PASS（skip 時は対象外）
- secret scan PASS
- FTP 未接続 / production 未接触

### no の場合

レポートの **Errors** セクションを修正し、再実行する。

---

## レポートの読み方

出力: `tools/static-to-astro/output/readiness/gosaki/GOSAKI_READINESS_REPORT.md`

- **Checks summary** — 各段階 PASS/FAIL
- **Export counts** — Supabase 行数
- **Deploy manifest** — `applied` / `ftpConnected` が false であること
- **Output policy** — `output/` は Git 非 commit

secret 実値はレポートに含めない。

---

## 失敗時の対応

| 失敗 | 対処 |
| --- | --- |
| convert / build | `CONVERSION_REPORT.md`、依存関係を確認 |
| export | `.env.local` staging URL、RLS / GRANT |
| static-public | `verify-static-public-artifact.mjs` 単体で再実行 |
| deploy dry-run | `public-dist` 再生成、manifest `safeForStaticFtp` |
| CMS loop | dev server ポート、admin password、staging Supabase |
| secret scan | tracked ファイルから実値を除去 |

---

## 安全条件

- FTP 接続しない
- `deploy-public-dist-ftp.mjs` は `--apply` なし
- 本番 FTP / Supabase / Storage / Sariswing 未使用
- root `.github/workflows/` 未変更

---

Phase 3-Y: readiness verifier のみ。G-2b apply は別フェーズ。

# Phase 3-M: Auth / RLS draft

Staging Supabase 上の CMS テーブルに対する Auth / RLS 方針を SQL draft として整理し、**staging で手動適用・検証できる状態**にするフェーズです。

Phase 3-M では **SQL 生成のみ** 行います。Supabase への自動接続・自動適用・Admin 保存有効化は行いません。

---

## 目的

- `schedule_months`, `schedules`, `discography`, `discography_tracks` に RLS を有効化する draft を用意する
- 公開 read（`published = true`）と admin write を policy で分離する
- staging SQL Editor で適用・検証する手順と rollback 方針を文書化する
- Admin UI 保存（Phase 3-O+）の前提を整える

---

## RLS の基本方針

| ロール | 読取 | 書込 |
| --- | --- | --- |
| **anon / authenticated（一般）** | `published = true` の行のみ | 不可 |
| **authenticated + admin** | 全行 | CMS テーブルで insert / update / delete 可 |
| **service role（CLI / server）** | RLS バイパス | RLS バイパス |

### Public read

- `schedule_months`, `schedules`, `discography`: `published = true`
- `discography_tracks`: 親 `discography.legacy_id` が `published = true` の行のみ

### GRANT SELECT（public read に必須）

RLS policy だけを適用しても、Supabase Data API（PostgREST）経由の anon `select` が通らない場合があります。`permission denied for table <name>` となる典型例です。

**public read policy を機能させるには、対象テーブルへの `SELECT` grant が policy とセットで必要**です。

| ロール | RLS | テーブル GRANT |
| --- | --- | --- |
| **service_role** | バイパス | 不要（RLS バイパス） |
| **anon / authenticated** | policy で行フィルタ | **`GRANT SELECT` 必須** |

`rls-draft.sql` セクション 3 に以下を含めます（Phase 3-N 検証で staging 手動適用済み）:

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.schedule_months, public.schedules,
  public.discography, public.discography_tracks TO anon, authenticated;
```

`admin_users` への public `SELECT` grant は付与しません（管理者のみ参照）。

### Admin write

- `is_admin()` が true の authenticated ユーザーのみ CMS テーブルを CRUD 可能
- Phase 3-M では **Admin UI の保存ボタンは disabled のまま**（policy draft のみ）

---

## 管理者判定方式の比較

### 案A: JWT `app_metadata.role = 'admin'`

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
```

| メリット | デメリット |
| --- | --- |
| テーブル不要 | `app_metadata` 更新に Admin API / server-side 処理が必要 |
| policy が短い | サイトごとに claim 設計を揃える必要 |
| | 複数管理者・監査ログを DB で持ちにくい |

### 案B: `admin_users` テーブル（推奨候補）

```sql
exists (
  select 1 from admin_users
  where user_id = auth.uid() and role = 'admin'
)
```

| メリット | デメリット |
| --- | --- |
| サイトごとに管理者を DB で管理しやすい | 初回 bootstrap（service role で 1 行 insert）が必要 |
| 複数管理者・将来の role 拡張が容易 | `is_admin()` SECURITY DEFINER の設計レビューが必要 |
| ツール商品化時に扱いやすい | |

### 推奨方針（要確認）

**`admin_users` + `is_admin()` 関数** を draft のデフォルトとします。

最終決定はプロジェクトオーナー / DBA レビュー後に確定してください（本番適用前）。

---

## service role key について

- Supabase **service role key は RLS をバイパス**します
- seed insert CLI、Admin server-side read、初回 `admin_users` bootstrap にのみ使用
- **ブラウザ・Astro クライアント bundle・Git に出してはいけません**
- 公開サイトは anon key + RLS（published のみ）を Phase 3-N 以降で検証

---

## 生成物

```bash
node tools/static-to-astro/scripts/generate-rls-draft.mjs \
  --out-dir tools/static-to-astro/output/rls/gosaki
```

| ファイル | 内容 |
| --- | --- |
| `rls-draft.sql` | `admin_users`, `is_admin()`, GRANT SELECT, RLS enable, policies |
| `rls-verify.sql` | 適用後確認 SQL |
| `RLS_IMPLEMENTATION_REPORT.md` | 概要・安全チェック・次フェーズ |

---

## staging 適用手順（手動）

1. **staging のみ** — 本番 Supabase には適用しない
2. Phase 3-J で `schema-draft.sql` 適用・seed 投入済みであることを確認
3. `rls-draft.sql` を全文レビュー（`DROP TABLE` 等が無いこと）
4. staging Supabase **SQL Editor** で `rls-draft.sql` を実行（**GRANT SELECT 含む** — policy のみでは anon read 不可）
5. Supabase Auth で管理者ユーザーを作成（Dashboard）
6. service role セッションで初回 admin を登録:

   ```sql
   insert into public.admin_users (user_id, email, role)
   values ('<auth.users.id>', 'admin@example.com', 'admin');
   ```

7. `rls-verify.sql` を実行して RLS / policy / 件数を確認
8. Phase 3-N: anon key クライアントで published のみ読めることを検証（`verify-anon-rls.mjs --apply`）

**注意:** Phase 3-N 初回検証で、policy 適用後も `GRANT SELECT` 未設定のため `permission denied for table schedules` が発生しました。以降は `rls-draft.sql` に GRANT を含めるため、新規 staging 適用時は SQL Editor で GRANT を別途実行する必要はありません（既存 staging は手動 GRANT 済み）。

---

## Rollback（staging のみ — 手動）

本番では実行しない。draft 適用を取り消す場合の参考:

```sql
-- Drop policies (example — run per table/policy from pg_policies list)
drop policy if exists "schedules_public_select" on public.schedules;
-- ... repeat for all policies in rls-draft.sql

alter table public.schedule_months disable row level security;
alter table public.schedules disable row level security;
alter table public.discography disable row level security;
alter table public.discography_tracks disable row level security;
alter table public.admin_users disable row level security;

drop function if exists public.is_admin();
drop table if exists public.admin_users;
```

`drop table admin_users` は rollback 用ドキュメントのみ。`rls-draft.sql` 本体には含めません。

---

## 未決定事項

- [ ] 本番適用前の最終 admin モデル（`admin_users` vs JWT claim）
- [ ] 初回 admin bootstrap の運用（誰が service role で insert するか）
- [ ] `admin_users` の INSERT policy（既存 admin のみ vs service role のみ）
- [ ] Storage bucket RLS（別フェーズ）
- [ ] Admin UI 保存 API の Auth 方式（Phase 3-O）

---

## Phase 3-M でやらないこと

- `rls-draft.sql` の Supabase 自動適用
- Auth ユーザー / `admin_users` の自動登録
- Admin UI 保存有効化
- 本番 Supabase 接続
- ルート `supabase/migrations/` への追加

---

## 関連

- `tools/static-to-astro/README.md` — Phase 3-M CLI
- `output/cms-candidates/gosaki/CMS_IMPLEMENTATION_PLAN.md` — Phase 3-I 仕様
- `output/supabase-seed/gosaki/schema-draft.sql` — ベース schema（RLS なし）

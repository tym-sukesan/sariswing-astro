# gosaki Admin 運用方針（Phase G-3）

**目的:** gosaki を CMS Kit 実用化プロトタイプとして運用する際の **Admin 利用方法を確定**する。  
**方針:** 運用フロー・Runbook 整理のみ。Node host 実 deploy・FTP apply・本番接続は Phase G-3 では行わない。

関連:

- [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md)
- [gosaki-staging-runbook.md](./gosaki-staging-runbook.md)
- [admin-hosting-strategy.md](./admin-hosting-strategy.md)
- [gosaki-staging-ftp-deploy.md](./gosaki-staging-ftp-deploy.md)

---

## A. Admin 運用の前提

| 前提 | 内容 |
| --- | --- |
| Admin UI / API | **Node 実行環境が必要**（`@astrojs/node` / `npm run dev` または Node host） |
| 静的 FTP | ロリポップ等では `/api/admin/*` は**動作しない** |
| 公開サイト | **public-dist のみ** FTP 公開（admin 除外済み artifact） |
| Admin の置き場所 | local dev または Node host（FTP 上に Admin を置かない） |
| データの正本 | **Supabase**（staging / 将来 production） |
| 公開サイトの反映 | Supabase **export** → **build** → **public-dist** → deploy |

```text
[Admin 編集] → Supabase 保存
                    ↓
         export-supabase-json → src/data/*.json
                    ↓
              npm run build
                    ↓
      verify-static-public-artifact → public-dist/
                    ↓
         deploy-public-dist-ftp (staging / 将来 prod)
```

**重要:** Admin で保存しただけでは公開サイトは更新されない。

---

## B. 運用パターン比較

### Pattern A: Local Admin

| 項目 | 評価 |
| --- | --- |
| 概要 | 担当者 PC で `npm run dev` → Admin 編集 → CLI で export/build/deploy |
| 実装難易度 | 低 |
| 月額コスト | 低（追加ホスティング不要） |
| セキュリティ | 中（Admin はローカルのみ、service role はサーバー側） |
| クライアント本人運用 | **低**（ターミナル・export 手順が必要） |
| トラブル時の復旧 | 高（手順が明確、output 再生成可能） |
| 商品化適性 | 短期 PoC・単一クライアント検証向け |
| **現時点の推奨度** | **◎ 短期正式採用（Phase G-3）** |

### Pattern B: Node host Admin/API

| 項目 | 評価 |
| --- | --- |
| 概要 | Admin/API を Render / Railway 等に常時配置。公開は public-dist FTP |
| 実装難易度 | 中 |
| 月額コスト | 中（Node ホスト + FTP） |
| セキュリティ | 高（公開と Admin 分離、service role をブラウザに出さない） |
| クライアント本人運用 | **中〜高**（ブラウザから編集可能） |
| トラブル時の復旧 | 中（ホスト障害・secrets 管理が増える） |
| 商品化適性 | **中期推奨** |
| **現時点の推奨度** | △ 設計段階（G-4 以降で検討） |

**候補ホスト（調査・契約は別フェーズ）:** Render, Railway, Fly.io, Vercel SSR, Netlify Functions, Cloudflare Workers/Pages Functions

### Pattern C: Separate Admin app

| 項目 | 評価 |
| --- | --- |
| 概要 | Admin 専用 repo / サブドメイン。site profile ごとに module 切替 |
| 実装難易度 | 中高 |
| 月額コスト | 中 |
| セキュリティ | 高（完全分離、マルチテナント向き） |
| クライアント本人運用 | 高（専用 UI・オンボーディング可能） |
| トラブル時の復旧 | 中（構成が複雑） |
| 商品化適性 | **長期推奨**（継続課金・複数 vertical） |
| **現時点の推奨度** | △ 将来検討（G-7 抽象化と連動） |

---

## C. 短期推奨（Phase G-3 正式採用）

```text
Local Admin + staging Supabase + export/build + public-dist deploy
```

| 理由 | 説明 |
| --- | --- |
| 追加ホスティング不要 | 検証コスト最小 |
| secret を限定しやすい | `.env.local` は担当者 PC のみ |
| 実用化検証に十分 | CMS minimal loop 済み |
| gosaki は本人運用前 | エンジニア主導で安全に試せる |
| 本番公開前の検証 | staging FTP dry-run → G-2b apply |

**限界:** 非エンジニア（クライアント本人）の日常運用には向かない。引き渡し前に中期パターンへ移行するか、運用代行を明示する。

---

## D. 中期推奨

```text
Node host Admin/API + public-dist FTP
```

| 理由 | 説明 |
| --- | --- |
| ブラウザ編集 | クライアントが URL から Admin にアクセス |
| 公開は静的 FTP のまま | ロリポップ等との相性維持 |
| Admin/API だけ Node | `dist/server` を Node host、`public-dist` を FTP |
| セキュリティ | service role key をクライアントブラウザに載せない |

**gosaki での導入タイミング:** G-2b（staging FTP apply）完了後、クライアント handoff 前を目安。

---

## E. 長期推奨

```text
Separate Admin app + multi-site profile system
```

| 目的 | 内容 |
| --- | --- |
| マルチサイト | 1 管理画面から複数クライアントサイト |
| profile 切替 | musician / dance-school / generic 等 |
| 商品化 | 継続課金・ユーザー管理・オンボーディング |
| 公開側 | 完全 static output のみ generator から生成 |

---

## F. gosaki での採用方針（結論）

| 期間 | 採用パターン | 状態 |
| --- | --- | --- |
| **Phase G-3（現在）** | **Pattern A: Local Admin** | **正式な短期運用** |
| **次（G-2b）** | staging FTP `--apply` 検証 | public-dist 反映の実接続 |
| **G-4 以降** | Pattern B 検討 | Node host Admin/API 設計・staging 試験 |
| **G-7 方向** | Pattern C 検討 | 商品化テンプレート抽象化 |

### 短期運用の1サイクル

```text
1. tools/static-to-astro/.env.local を読み込み npm run dev
2. http://localhost:4321/admin/ で編集・保存
3. export-supabase-json.mjs
4. npm run build
5. verify-static-public-artifact.mjs
6. deploy-public-dist-ftp.mjs（dry-run → 将来 G-2b apply）
```

詳細手順: [gosaki-staging-runbook.md](./gosaki-staging-runbook.md) セクション D〜M

---

## G. 認証・セッション（現状）

- Admin API は Supabase Auth Bearer トークンを検証
- 現行 Mock Editor は **localStorage** にセッション情報を保持する検証用実装
- 本格的なログイン UI・パスワードリセットは**未実装**（別フェーズ）
- 引き渡し前は [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md) を使用

---

## H. 関連ドキュメント

| Doc | 用途 |
| --- | --- |
| [gosaki-admin-handoff-checklist.md](./gosaki-admin-handoff-checklist.md) | クライアント引き渡し前チェック |
| [gosaki-staging-secrets-checklist.md](./gosaki-staging-secrets-checklist.md) | secrets 管理 |
| [gosaki-production-readiness-roadmap.md](./gosaki-production-readiness-roadmap.md) | 全体ロードマップ |

---

Phase G-3: Admin 運用方針 doc のみ。Node host deploy・FTP apply・本番接続は未実施。

# Admin Hosting Strategy（Phase 3-T）

Phase 3-S で generator から Admin/API を再生成できるようになった前提で、**公開サイト**と **Admin/API** の運用を分離する戦略を整理します。

---

## 1. Hybrid build の出力構成（Astro + `@astrojs/node`）

`--with-admin-cms` で build した場合の典型構成（gosaki 検証済み）:

| パス | 内容 | 静的 FTP |
| --- | --- | --- |
| `dist/client/` | prerender された HTML/CSS/JS/images/sitemap | ○ ただし **`admin/` HTML が混在** |
| `dist/server/` | Node SSR、`/api/admin/*`、Admin ページの server 側 | ✗ Node ホスト専用 |

**重要発見（Phase 3-T）:** Hybrid build では Admin UI も `dist/client/admin/` に静的 HTML として出力されます。API route（`/api/admin/*`）は `dist/server/` のみで、FTP では動きません。

**FTP 公開推奨:**

```text
dist/client/ をそのまま上げない
  → verify-static-public-artifact.mjs が生成する
     output/static-public/gosaki/public-dist/ を使う（admin 除外）
```

---

## 2. 運用パターン比較

| 観点 | P1 Local Admin + FTP | P2 Node Admin + static FTP | P3 Separate Admin app | P4 Fully server-hosted |
| --- | --- | --- | --- | --- |
| **概要** | ローカル `npm run dev` で編集 → export → build → FTP | Admin/API を Vercel/Railway 等、公開は FTP | Admin 専用 repo / サブドメイン | 公開も Admin も同一 Node |
| **実装難易度** | 低 | 中 | 中高 | 中 |
| **月額コスト** | 低（FTP のみ） | 中（Node + FTP） | 中 | 中〜高 |
| **セキュリティ** | 中（Admin はローカルのみ） | 高（分離） | 高 | 中（単一 surface） |
| **非エンジニア運用** | 低（CLI/export 必要） | 中（Web Admin 常時） | 高 | 高 |
| **ロリポップ適性** | ◎ 公開のみ FTP | ◎ 公開 FTP + Admin 別 | ◎ | ✗ |
| **商品化適性** | 短期 PoC / 単一クライアント | **中期推奨** | **長期推奨** | 小規模 SaaS 向け |

---

## 3. 現時点の推奨

### 短期（今すぐ Sariswing / gosaki 検証）

**Pattern 1: Local Admin + export/build + FTP publish**

```text
1. ローカル: npm run dev（Admin 編集）
2. export-supabase-json.mjs
3. npm run build
4. verify-static-public-artifact.mjs
5. public-dist/ を FTP アップロード
```

- `/api/admin/*` は本番 FTP では使わない
- 公開 HTML は JSON snapshot（Supabase key 不要）

### 中期（商品化）

**Pattern 2: Node host Admin/API + static public FTP**

- `admin.example.com` → `dist/server` + Node
- `www.example.com` → `public-dist/` FTP
- クライアントはブラウザ Admin で編集可能

### 長期

**Pattern 3: Separate Admin app + site profile system**

- Admin を独立 Astro/Vite app または Supabase Studio 拡張
- 公開サイトは完全 static output のみ generator 出力
- Phase 3-W site profile で module 切替

---

## 4. Sariswing への適用時の注意

Sariswing は現状 **ロリポップ FTP 静的公開** です。

| 項目 | 方針 |
| --- | --- |
| 公開サイト | `static-public/.../public-dist/` または admin 除外済み artifact のみ FTP |
| Admin/API | **同一 FTP では不可**（`/api/admin/*` 非動作） |
| 管理画面 HTML | `dist/client/admin/` が存在するため **直アップロード非推奨** |
| 既存 GitHub Actions FTP deploy | deploy 対象を `public-dist` に変更する整合性確認が必要 |
| Supabase | staging / 将来本番は Admin 編集の source of truth；公開は build 時 JSON |

---

## 5. 検証 CLI

```bash
node tools/static-to-astro/scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/generated-astro \
  --report tools/static-to-astro/output/static-public/gosaki/STATIC_PUBLIC_ARTIFACT_REPORT.md
```

生成物:

- `STATIC_PUBLIC_ARTIFACT_REPORT.md` — 検証結果
- `static-public-manifest.json` — コピー元・除外・`safeForStaticFtp`

---

## 6. 関連ドキュメント

- [phase3-r-productization-review.md](./phase3-r-productization-review.md)
- [cms-kit-architecture.md](./cms-kit-architecture.md)
- [generated-astro-integration-plan.md](./generated-astro-integration-plan.md)

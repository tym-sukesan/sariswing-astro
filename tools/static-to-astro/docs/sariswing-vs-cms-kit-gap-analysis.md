# Sariswing CMS と CMS Kit の差分整理（Phase 3-X-A）

**作成日:** 2026-06-05  
**対象:** 本番運用中の Sariswing CMS vs `tools/static-to-astro/` CMS Kit / gosaki prototype  
**方針:** 整理・設計のみ。Sariswing 本番コード / Supabase / FTP / Storage には触れない。

---

## 1. 位置づけの違い

### Sariswing CMS

| 観点 | 内容 |
| --- | --- |
| 性質 | **既に動いている個別本番 CMS** |
| 利用者 | 紗理さん向けに最適化された専用実装 |
| 優先順位 | 本番運用優先・安定性重視 |
| 変更方針 | 破壊的変更を避ける |
| 技術スタック | Astro + Supabase + GitHub Actions + ロリポップ FTP |
| 運用 | 管理画面から更新 → workflow_dispatch → build → FTP deploy |

### CMS Kit / gosaki prototype

| 観点 | 内容 |
| --- | --- |
| 性質 | **Wix / Studio 等からの乗り換えを目指す商品化プロトタイプ** |
| 利用者 | 汎用ツール + musician profile（gosaki）での検証 |
| 優先順位 | 自動化・テンプレート化・再現性重視 |
| 変更方針 | 失敗してよい検証環境（staging / generated-astro） |
| 技術スタック | static-to-astro CLI + Admin/API テンプレート + verifier 群 |
| 運用 | export → build → public-dist 分離（deploy template は dry-run まで） |

**要点:** Sariswing は「成功している本番事例」。CMS Kit は「再現可能な商品テンプレート」を作る実験場。両者を混同せず、**実用化検証は gosaki で進める**。

---

## 2. 機能比較表

| 項目 | Sariswing CMS | CMS Kit / gosaki | 差分 | 今後の方針 |
| --- | --- | --- | --- | --- |
| **CMS 対象** | NEWS / SCHEDULE / Instagram / ABOUT | Schedule / Discography / Tracks（musician） | Sariswing は dance 向け、gosaki は musician 向け | profile で module 切替。NEWS 等は CMS Kit 側で一般化後に Sariswing 移植検討 |
| **NEWS** | ◎ CRUD 本番運用 | ✗ 未実装 | Sariswing のみ | generic / dance-school profile 用 module を CMS Kit で先に設計 |
| **Schedule** | ◎ CRUD + 本番 deploy | ◎ staging + Admin save + minimal loop PASS | gosaki は export/build 中心、本番 deploy 未実施 | gosaki staging で運用フロー確定後、商品化 |
| **Instagram** | ◎ 管理あり | ✗ なし | Sariswing のみ | CMS Kit では Later。Sariswing からパターン参照のみ |
| **About** | ◎ 管理あり | △ profile モジュール定義のみ | CMS Kit は schema/Admin 未実装 | profile + module として一般化を検討 |
| **Discography** | ✗（Sariswing サイトに該当機能なし） | ◎ CRUD + Tracks | gosaki のみ | musician 商品の差別化要素として gosaki で磨く |
| **Tracks** | ✗ | ◎ discography 子テーブル | gosaki のみ | musician profile 標準 module として維持 |
| **画像アップロード** | ◎ Admin から実装済み | △ Storage plan dry-run のみ | 実 upload なし | gosaki Phase G-4 で方針確定 → staging upload |
| **Supabase Auth** | ◎ 本番運用 | ◎ staging bootstrap + verifier | 環境が分離 | gosaki staging の secrets 運用ルールを文書化 |
| **RLS** | ◎ 本番適用済み | ◎ draft + staging verifier | Sariswing は live policy | CMS Kit は draft 生成のみ。Sariswing へ直接適用しない |
| **Admin UI** | ◎ 本番・本人運用に近い | △ Mock editor + save（Schedule/Discography） | UX / 公開ボタン等は Sariswing が先行 | gosaki で運用フロー確定後 UX 改善 |
| **Admin API** | ◎ 本番 | ◎ `/api/admin/*` テンプレート | hybrid build / FTP 分離は CMS Kit 側が詳細 | public-dist 分離を gosaki で staging 検証 |
| **GitHub Actions deploy** | ◎ workflow_dispatch 本番実績 | △ public-dist FTP template（未実行） | Sariswing は live workflow | gosaki staging FTP で template 検証（G-2） |
| **FTP deploy** | ◎ ロリポップ本番 | △ template + verifier のみ | 本番 FTP 未接続 | staging FTP のみ。Sariswing workflow は参照のみ |
| **public-dist 分離** | △（Sariswing は dist ミラー運用） | ◎ verifier + manifest | CMS Kit が安全分離を先行 | gosaki 商品化の標準パターンに |
| **site profile** | ✗ サイト専用実装 | ◎ musician / dance-school / generic JSON | CMS Kit のみ | profile 駆動で商品 vertical を拡張 |
| **Storage plan** | △（本番 Storage 運用） | ◎ dry-run plan CLI | 再ホスト・著作権確認フローは CMS Kit 側 | gosaki で review-required フロー確立 |
| **CMS minimal loop** | △（手順は確立、verifier なし） | ◎ automated verifier PASS | 再現性は CMS Kit が優位 | 商品化時の標準 QA に |
| **本人運用** | ◎ 紗理さん更新可能に近い | ✗ エンジニア向け CLI 中心 | 最大のギャップ | Admin 運用方法・説明資料を gosaki で整備（G-3） |
| **商品化適性** | △ 個別最適化 | ◎ テンプレート・verifier・profile | 目的が異なる | Sariswing から UX パターンを借り、CMS Kit で再現性を担保 |

凡例: ◎ 実装・運用済み / △ 部分・設計のみ / ✗ 未実装

---

## 3. Sariswing にあって CMS Kit にないもの

| カテゴリ | 具体 |
| --- | --- |
| **コンテンツ CMS** | NEWS CRUD、Instagram 管理、ABOUT 管理 |
| **運用 UX** | 管理画面からの「公開サイトを更新」ボタン、sitemap 手動生成・更新 |
| **メディア** | 画像アップロード実装（Storage 連携済み） |
| **本番実績** | GitHub Actions → build → ロリポップ FTP の live deploy |
| **本人運用** | 非エンジニア向けに近い更新フロー |
| **サイト特化** | Sariswing 専用 schema / UI / ワークフロー（汎用化されていない） |

これらは **Sariswing が先行している成功パターン** として参照し、CMS Kit へ無秩序にコピーしない。

---

## 4. CMS Kit にあって Sariswing にない、または弱いもの

| カテゴリ | 具体 |
| --- | --- |
| **変換自動化** | 静的 HTML → Astro（`convert-static-to-astro.mjs`） |
| **テンプレート再生成** | `--with-admin-cms` で Admin/API を generator から再生成 |
| **site profile system** | musician / dance-school / generic の宣言的 module 切替 |
| **public-dist 安全分離** | Admin/API を除外した静的 artifact + manifest |
| **deploy workflow template** | public-dist 専用 FTP deploy（dry-run 検証済み template） |
| **Storage asset plan** | 著作権・再ホスト確認を含む dry-run plan |
| **verifier 群** | CMS minimal loop / static-public / site-profiles 等の自動 QA |
| **musician modules** | Discography + Tracks CMS |
| **商品化前提の再生成性** | fixture → convert → seed → staging → export → build の再現パイプライン |
| **staging 実験** | 本番を壊さず失敗できる検証環境 |

---

## 5. Sariswing へ将来移植する場合の注意

1. **Sariswing は本番運用中** — CMS Kit 検証で root `src/` / 本番 Supabase / FTP に直接実験しない。
2. **既存 CMS を壊さない** — 差分は docs / read-only 分析から始める（本ドキュメントがその第一歩）。
3. **Supabase schema 差分** — NEWS / Instagram / ABOUT テーブルと musician 系テーブルの共存方針を先に設計。
4. **GitHub Actions deploy 整合性** — Sariswing は現状 `dist/` ミラー。CMS Kit は `public-dist/` 分離。移植時は workflow を独立 branch + staging で検証。
5. **NEWS / Instagram / ABOUT の一般化** — CMS Kit 側で profile module として設計・実装してから Sariswing への適用を検討。
6. **まず read-only / docs / profile 設計** — 実コード移植は最後。Phase 3-X-A はこの段階。
7. **実移植は独立 branch + staging** — 本番 main への直接マージ禁止。rollback 手順を先に用意。

参照ドキュメント（CMS Kit 側のみ）:

- [admin-hosting-strategy.md](./admin-hosting-strategy.md)
- [public-dist-ftp-deploy.md](./public-dist-ftp-deploy.md)
- [site-profile-system.md](./site-profile-system.md)
- [storage-image-pipeline.md](./storage-image-pipeline.md)

---

## 6. 結論

```text
Sariswing は成功事例・比較対象・将来移植先。
CMS Kit の実用化検証は gosaki で進める。
gosaki musician profile を商品化プロトタイプとして磨く。
```

| 役割 | プロジェクト |
| --- | --- |
| 本番参照・UX ベンチマーク | Sariswing CMS（触らない） |
| 商品化プロトタイプ・検証主戦場 | gosaki + musician profile |
| 汎用ツール | `tools/static-to-astro/` CMS Kit |

次の具体アクションは [gosaki-production-readiness-roadmap.md](./gosaki-production-readiness-roadmap.md) を参照。

---

Phase 3-X-A: ドキュメントのみ。本番接続・Sariswing 本体変更・deploy 実行は行っていません。

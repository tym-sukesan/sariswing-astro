# G-20s — Gosaki whole-site product quality audit

**Phase:** `G-20s-gosaki-whole-site-product-quality-audit`  
**Status:** **complete** — read-only / local artifact + docs inventory  
**Date:** 2026-07-09  
**Base commit:** `ecfb736`  
**Client:** 後藤沙紀さん — ピアニスト個人ミュージシャンサイト  
**Prior:** [gosaki-schedule-product-quality-policy.md](./gosaki-schedule-product-quality-policy.md) (G-20r2b) · [gosaki-internal-preview-readiness-gap-audit.md](./gosaki-internal-preview-readiness-gap-audit.md) (G-20q) · [gosaki-completion-audit.md](./gosaki-completion-audit.md)

| Check | Status |
| --- | --- |
| Whole-site P0/P1/P2/Defer classified | **yes** |
| Non-Schedule next tasks proposed | **yes** |
| G-20r3 proceed judgment | **yes** |
| DB / SQL / regen / FTP | **not executed** |

---

## Gates

```txt
gosakiWholeSiteProductQualityAuditComplete: true
phase: G-20s-gosaki-whole-site-product-quality-audit
baseCommit: ecfb736
artifactBasis: gosaki-piano-production-public-dist-G20i3
artifactFileCount: 26
artifactGeneratedAt: 2026-07-01
clientPreviewVerdict: NOT_READY
internalOperatorPreviewVerdict: READY_WITH_NOTES
scheduleG20r2bPolicyComplete: true
readyForG20r3ScheduleDbInsertPreflight: true
readyForClientPreview: false
nonScheduleP0BlocksG20r3: false
sqlFileCreated: false
dbWriteInThisPhase: false
forbiddenProjectRef vsbvndwuajjhnzpohghh: not used as active target
```

**Supabase interim SoT:** `kmjqppxjdnwwrtaeqjta` only. **Never** `vsbvndwuajjhnzpohghh`.

---

## 1. 目的

| Goal | Detail |
| --- | --- |
| **Primary** | Schedule 以外も含め、Gosaki-piano **全体**をクライアントに見せられる**商品品質**か棚卸し |
| **Timing** | G-20r2b（Schedule 品質方針）完了後 · **G-20r3 DB preflight 前** |
| **Out of scope** | DB write · SQL · regen · FTP · network · deploy |

---

## 2. 監査ベース

| Source | Notes |
| --- | --- |
| Production package | `output/manual-upload/gosaki-piano-production/public-dist/` · 26 files · `generatedAt` 2026-07-01 |
| Staging reference | G-7j browser QA · `yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| Schedule chain | G-20r → G-20r1b capture → G-20r2 candidates → G-20r2b policy |
| CMS closure | Schedule P0 CRUD closed G-22j · Discography/YouTube/About slices proven |

**今回未実施:** live HTTP · browser QA · DB query · package regen

---

## 3. 総合判定

### clientPreviewVerdict

```txt
clientPreviewVerdict: NOT_READY
```

| Blocker | Area | Status |
| --- | --- | --- |
| Schedule 2026-08 未反映 | Schedule | **データ層未投入** — G-20r3 で解消予定 · package は regen 後 |
| Mobile 実機未検証 | Header/Footer/全ページ | **pending** since G-7j |
| Contact HubSpot E2E 未確認 | Contact | embed はあるが送信未証明 |

### internalOperatorPreviewVerdict

```txt
internalOperatorPreviewVerdict: READY_WITH_NOTES
```

PC staging / production artifact は route 横断で **概ね OK**（G-7j · G-20q）。test/PoC 文言混入なし。

---

## 4. エリア別品質サマリ

| Area | CP* | Quality | Key gap | Pri |
| --- | --- | --- | --- | --- |
| **Home** | ⚠️ | Good PC | YouTube embed あり · 英語 title「Goto Saki Official Web Site」 | P1 |
| **Schedule** | ⚠️ | 03–07 OK | **2026-08 なし** · G-20r2b 方針済 · DB未投入 | **P0** (data) |
| **Discography** | ✓ | Good | Supabase read · test 文言なし · ルーチン編集 UX は未整備 | P1 |
| **About** | ✓ | Good | Bands 5 cards · `/about/` · nav 英語「About」 | P1 |
| **YouTube / Media** | ✓ | MVP OK | Home embed only · 専用 Videos ページなし（G-9a 意図） | Defer |
| **Contact** | ⚠️ | Risk | HubSpot embed · **E2E 未検証** · disclaimer なし | **P0** |
| **Link** | ✓ | Good | 10 external links · static | Defer |
| **Header / Nav** | ⚠️ | Markup OK | 6 links + MENU toggle · **mobile 未実機確認** | **P0** |
| **Footer** | ✓ | Good | G-7i2/G-8g fixes · SNS text fallback | P1 |
| **Mobile** | ⚠️ | Unverified | CSS/JS あり · G-8 SP polish 済 · **実機 QA なし** | **P0** |
| **SEO / sitemap** | ⚠️ | Mostly OK | prod robots Allow ✓ · **G-20s 時点:** sitemap に `/admin/` 幽霊 URL（**G-20t1 で新ビルドは除外**） | P2 → **G-20t1 resolved (new builds)** |
| **Legacy `/YYYY-MM/`** | △ | Functional | noindex + canonical OK · **英語 stub 本文** | P1 |
| **Admin / CMS ops** | N/A | Internal | hosted admin なし · 本人 solo 運用は未成立 | Defer† |
| **Cutover / FTP** | N/A | HOLD | G-20j STOP · DNS/SSL/MX pending | Defer† |

\*CP = client preview にそのまま出してよいか（現行 artifact ベース）

†本番 cutover ブロッカーだが G-20r3 Schedule INSERT とは独立

---

## 5. P0 / P1 / P2 / Defer 一覧

### P0 — クライアント preview 前に解消推奨

| ID | Area | Issue | Next phase | Blocks G-20r3? |
| --- | --- | --- | --- | --- |
| **P0-S1** | Schedule | 2026-08 source freshness gap（package/DB 0件） | **G-20r3** insert + **G-20r4** regen | **No — G-20r3 が対処** |
| **P0-M1** | Mobile | 実機 MENU / schedule / footer spot-check 未完了 | `G-20s1-mobile-device-qa` | **No** |
| **P0-C1** | Contact | HubSpot 送信 E2E 未検証（staging 上） | `G-20s2-contact-hubspot-e2e-verify` | **No** |

### P1 — preview 可能だが品質向上推奨

| ID | Area | Issue | Next phase |
| --- | --- | --- | --- |
| **P1-S1** | Schedule | `<>` タイトル（Wix parity · not Kit bug） | G-20r2c 任意 · sign-off 時確認 |
| **P1-S2** | Schedule | 空欄 UI 非表示ルール（G-20r2b）の package 検証 | G-20r4 regen QA |
| **P1-H1** | Home | 英語 title / OGP 表記混在 | `G-20s3-client-preview-copy-patch` |
| **P1-A1** | About | nav「About」英語 · band 画像 placeholder 可能性 | 同上 |
| **P1-L1** | Legacy stubs | 英語「Schedule page moved」→ 日本語化 | 同上 |
| **P1-D1** | Discography | ルーチン編集 UX · preview refresh (G-19f) | post-launch |
| **P1-F1** | Footer | 二重 SNS 表示（意図的 fallback） | visual fine-tune |
| **P1-CT1** | Contact | preview 用 disclaimer（送信未検証の注意） | G-20s2 と併用可 |

### P2 — 本番 cutover 前後でよい

| ID | Area | Issue |
| --- | --- | --- |
| **P2-SEO1** | sitemap | ~~`sitemap-0.xml` に `/admin/` 含む~~ — **G-20t1:** CMS Kit filter で除外 · staging regen 済 · prod artifact は regen 待ち |
| **P2-SEO2** | sitemap | 2026-08 追加後の sitemap 更新（G-20r4 後） |
| **P2-SEO3** | robots/canonical | cutover 時の indexable 最終確認（G-20j） |
| **P2-HS1** | HubSpot | production domain allowlist |
| **P2-Y1** | YouTube | prod 反映 runbook（URL 変更時） |

### Defer — 今回スコープ外 / 別プロダクト線

| ID | Item | Reason |
| --- | --- | --- |
| **DEF-1** | News ページ + CMS | G-9a MVP 外 |
| **DEF-2** | Videos 専用ページ | Home embed のみで足りる |
| **DEF-3** | Hosted admin on prod | G-20i2 Option B · 別フェーズ |
| **DEF-4** | FTP 自動 deploy | G-7f1 停止中 |
| **DEF-5** | DNS/SSL/MX cutover | G-20j HOLD · operator |
| **DEF-6** | G-23 onboarding / seiichijazz | 優先度 Gosaki 完了 |
| **DEF-7** | Schedule physical DELETE | P0 は unpublish のみ |
| **DEF-8** | Bands/Projects full CMS | static JSON 維持 |

---

## 6. Schedule 以外の重要課題（詳細）

### 6.1 Home + YouTube

| Item | State |
| --- | --- |
| YouTube references in `index.html` | **present**（artifact grep: 25 hits） |
| Dedicated `/videos/` route | **absent** — G-9a 意図どおり |
| CMS YouTube Save | **proven** staging（G-10c/G-11c） |
| Prod package freshness | G-20p: content GO for embedded scope |
| **Risk** | URL 変更後の prod reflection runbook 未運用 — **P2** |

### 6.2 Discography

| Item | State |
| --- | --- |
| Page | `/discography/` · Supabase read |
| Test titles | **absent** in prod artifact（G-20e cleanup 済） |
| Tracklist CMS | per-slice Save proven · bulk UX なし |
| **Risk** | Preview refresh stale（G-19f）— **P1** · client preview 阻害ではない |

### 6.3 About / Bands

| Item | State |
| --- | --- |
| Route | `/about/`（`/profile/` なし — OK） |
| Bands | 5 cards injected（G-8a static JSON） |
| Biography | 自然 · 音楽教室誤認なし |
| **Gap** | Full About CMS vs static — **Defer** for launch |

### 6.4 Contact + HubSpot

| Item | State |
| --- | --- |
| Wix form | **replaced** by HubSpot embed |
| Embed in artifact | **yes** (`hubspot` in contact HTML) |
| Submit E2E | **not verified** |
| **Product quality risk** | 「送信できる」ように見えて動かない可能性 — **P0-C1** |

### 6.5 Mobile / Header / Footer

| Item | State |
| --- | --- |
| PC nav | G-7j PASS |
| SP CSS | G-8b–G-8g overrides in pipeline |
| MENU toggle JS | inlined · `nav-toggle` present |
| Real device QA | **never closed** since G-7j |
| **Product quality risk** | クライアントがスマホで見たときの初回印象 — **P0-M1**

### 6.6 SEO / sitemap / robots

| Item | State |
| --- | --- |
| `robots.txt` | `Allow: /` + sitemap line · prod indexable intent |
| `noindex` on pages | **absent** in prod package（staging は noindex — 意図的差分） |
| `sitemap-0.xml` | **G-20s 時点:** 12 URLs · schedule 03–07 · **`/admin/` 含む**（audit 当時の prod artifact） |
| 2026-08 in sitemap | **G-20s 時点:** no — G-20r4 後に追加 · **G-20t1 staging:** `/schedule/2026-08/` あり · `/admin/` なし |
| canonical / og:url | `www.gosaki-piano.com` — G-20h built |

### 6.7 Wix 由来の未反映・差分

| Gap | Type | Handling |
| --- | --- | --- |
| **2026-08 schedule** | source freshness | G-20r3 → G-20r4 |
| Wix Thunderbolt JS / animations | intentional | static export limit — **accept** |
| Font rendering | CDN vs local | minor — **P1** |
| Contact Wix backend | replaced | HubSpot — verify E2E |
| `<>` titles | source parity | retain per G-20r2b — **not bug** |
| Legacy month URLs | stub only 03–07 | 08 stub は G-20r4 |

---

## 7. G-20r3 へ進む可否

### 判定: **進めてよい**（Schedule DB insert preflight）

| Question | Answer |
| --- | --- |
| 非 Schedule P0 が G-20r3 をブロックするか | **No** — スコープ分離 |
| G-20r2b 品質方針は確定か | **Yes** — 17 insert · 2 hold |
| G-20r3 後に client preview READY になるか | **No** — mobile · contact · regen が残る |
| 並行で進めるべき非 Schedule 作業 | **P0-M1** mobile QA · **P0-C1** HubSpot E2E |

```txt
readyForG20r3ScheduleAugustDbInsertPreflight: true
readyForClientPreview: false
nonScheduleP0BlocksG20r3: false
```

**推奨並行パス:**

```txt
Track A (Schedule data):  G-20r3 preflight → approved INSERT → G-20r4 regen plan
Track B (Whole-site QA):  G-20s1 mobile QA + G-20s2 HubSpot E2E（network/operator）
Track C (Optional):       G-20r2c client message · G-20s3 copy patch batch
```

**G-20r3 前に直す必要がある非 Schedule 課題:** **なし**（blocking ではない）。ただし **クライアント demo 前**には P0-M1 + P0-C1 + Schedule regen（G-20r4）が必要。

---

## 8. 非 Schedule 次タスク候補

| Priority | Phase ID | Scope |
| --- | --- | --- |
| **1** | `G-20s1-mobile-device-qa` | 実機 ≤767px · MENU · schedule month · footer · discography |
| **2** | `G-20s2-contact-hubspot-e2e-verify` | staging 上で送信 → inbox 確認 · disclaimer |
| **3** | `G-20s3-client-preview-copy-patch` | legacy stub 日本語化 · title/OGP · ~~sitemap `/admin/` 除去~~（**G-20t1 で実装済**） |
| **4** | `G-20r2c-client-confirmation-message-final` | 任意 · hold 3件の背景説明 |
| **5** | `G-20r4-schedule-public-reflection-plan` | G-20r3 後 · regen + diff + upload plan |

---

## 9. Schedule 品質（G-20r2b 参照）

| Classification | Count | G-20r3 |
| --- | --- | --- |
| published=true | 14 | INSERT 公開 |
| published=false | 3 | INSERT 下書き |
| hold | 2 | **除外** |

空欄 UI 非表示ルールは G-20r4 package QA で検証。

---

## 10. 今回実行していないこと

| Operation | Executed |
| --- | --- |
| SQL / DB write / Save | **no** |
| package regen / build | **no** |
| FTP / deploy | **no** |
| network / live crawl | **no** |
| commit / push | **no** |

---

## 11. Verifier

```bash
node tools/static-to-astro/scripts/verify-gosaki-whole-site-product-quality-audit.mjs
```

# G-12c — Gosaki client preview feedback closure planning

**Phase:** `G-12c-gosaki-client-preview-feedback-closure-planning`  
**Status:** planning complete — **client feedback not yet collected**  
**Base commit:** `372b558`  
**Prior:** G-11c8→c15 YouTube chain complete; G-12b schedule read verified (`scheduleDataSource=supabase`)  
**Type:** planning / checklist refresh only — **no implementation, no DB write, no FTP**

## Summary

Prepare Gosaki staging for client preview sign-off. Consolidates operator-verified items (G-11c15, G-12b) with a client-facing checklist. Feedback collection remains **operator/client manual**; this phase does not execute Preview/Save/FTP.

**Checklist doc (share with client):** [gosaki-client-preview-feedback-closure.md](./gosaki-client-preview-feedback-closure.md) (updated for G-12c)

---

## 1. Staging URL (client-facing)

| Item | Value |
|------|-------|
| **Preview URL** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Compare (reference)** | `https://www.gosaki-piano.com/` (Wix production — read-only) |
| **Search engines** | Staging is `noindex` + `robots.txt` disallow — **intentional** |
| **Not production** | This is not `gosaki-piano.com` cutover |

### Client briefing (short)

- 移行先の**下書きプレビュー**です。本番 URL はまだ Wix のままです。
- PC とスマホの両方で staging URL を開いて確認してください。
- ピクセル完全一致より「運用に支障ないか」「本人が使いやすいか」を優先してください。

---

## 2. Operator-verified before client review (do not re-ask client)

| Area | Verified | Reference |
|------|----------|-----------|
| Home HTTP 200 | ✅ | G-11c15 |
| YouTube embed `I-eY9YMq9GI` on home | ✅ | G-11c15 |
| Old YouTube `Ke4F8JAQz-I` absent | ✅ | G-11c15 |
| Schedule hub + months HTTP 200 | ✅ | G-12b |
| `scheduleDataSource=supabase` | ✅ | G-12b |
| Event counts 13/10/12/11/14 | ✅ | G-12b |
| Legacy `/2026-07/` canonical → `/schedule/2026-07/` | ✅ | G-12b |
| Primary routes HTTP 200 | ✅ | G-7j, G-11c15 |
| CSS `_astro/` loads | ✅ | G-7h |
| FTP auto-deploy disabled | ✅ | G-7f1 |

---

## 3. Client checklist — YouTube (updated G-12c)

Share these **visual** checks only (not internal IDs / workflow names).

| # | Ask client | Operator note |
|---|------------|---------------|
| Y1 | トップページの YouTube 動画が表示されるか | Expected: plays embed from home |
| Y2 | 表示されている動画は意図したものか | Current staging reflects saved URL (`I-eY9YMq9GI`) |
| Y3 | 埋め込み位置・サイズ・余白は問題ないか | Layout refined in G-10e |
| Y4 | 今後、本人が URL だけ差し替えできれば十分か | CMS save path exists (staging admin); production workflow separate |
| Y5 | 別の動画 URL に変えたい場合、その URL を教えてください | Free-text feedback |

**Do not mention to client:** GitHub Actions, approval IDs, `gosaki-piano-youtube-embed.json`, Edge Functions, dry-run arms.

---

## 4. Client checklist — Schedule (updated G-12c)

| # | Ask client | Operator note |
|---|------------|---------------|
| S1 | `/schedule/` から各月（2026-03〜07）へ遷移できるか | Hub links verified |
| S2 | 月ページの公演一覧の見え方（日付・会場・時間・出演者） | Compare with Wix / paper schedule |
| S3 | 件数の体感（3月13 / 4月10 / 5月12 / 6月11 / 7月14） | Technical count OK — client checks **content accuracy** |
| S4 | 誤った公演・古い情報・抜けがあるか | Free-text; classify A vs B |
| S5 | スケジュールを本人が CMS で更新したい優先度（高/中/低） | Informs Phase 2 priority |
| S6 | 古い URL `/2026-07/` 形式のブックマーク利用者への説明要否 | Legacy stub exists; canonical is `/schedule/2026-07/` |

**Do not mention to client:** `scheduleDataSource`, Supabase project IDs, PoC row markers (`G-9g*`, `G-6-g*`), staging shell route.

---

## 5. Client checklist — General pages

Use full checklist in [gosaki-client-preview-feedback-closure.md](./gosaki-client-preview-feedback-closure.md) §2:

- Top / header / footer / SNS
- Mobile MENU and layout
- About + Bands/Projects (5 cards)
- Discography images and headings
- Contact (form **not** functional — explain alternatives)
- Link page
- Free-text: typos, image swaps, must-fix vs nice-to-have

---

## 6. Questions to ask the client (feedback form)

| # | Question |
|---|----------|
| Q1 | 全体として Wix 本番と比べて「このまま進めてよい」か |
| Q2 | **必須修正（A）** — 公開前に直したい項目（ページ URL + 具体的な内容） |
| Q3 | **後回し可（B）** — CMS 化や将来対応でよい項目 |
| Q4 | **対象外（C）** — 今回スコープ外としてよい項目 |
| Q5 | Schedule CMS 本人更新の優先度（高/中/低） |
| Q6 | YouTube URL 本人更新の優先度（高/中/低） — 現状は URL 差し替え可能 |
| Q7 | Contact フォーム — メール/電話で十分か、HubSpot 等が必要か |
| Q8 | 本番切替の希望時期（ざっくりで可） |
| Q9 | スマホ実機での確認結果（機種任意） |

---

## 7. Internal only — do not share with client

| Topic | Why internal |
|-------|----------------|
| `/__admin-staging-shell/musician-basic/` | Operator/staging CMS — not client-facing product |
| G-6 / G-9g PoC row markers in DB HTML | Staging test data on some rows (e.g. July 19) |
| `readyForAnyDbWrite`, approval IDs, env arms | Safety gates |
| FTP path `/cms-kit-staging/gosaki-piano/`, G-7f incident | Infrastructure |
| Sariswing production, `service_role`, RLS | Other product |
| `schedule_months` derived table | Implementation detail |
| G-6-g3 price slice, G-9k6 re-Save prohibition | Backlog / safety |
| `static-fallback` build mode | Resolved — live staging is `supabase` (G-12b) |

**Operator action:** If client sees PoC marker text on a public event card, treat as **data cleanup (Phase 2)** or static content fix — explain as "テストデータが1件混ざっている" if asked.

---

## 8. Feedback classification (after collection)

| Class | Examples | Response |
|-------|----------|----------|
| **A — Fix now** | CSS, typo, image swap, layout | convert + manual-upload package + operator re-upload |
| **B — CMS Phase 2** | Schedule edit workflow, recurring updates | staging shell write slices + rebuild + re-upload |
| **C — Out of scope** | News CMS, Discography CMS, production DNS | Document defer |

---

## 9. Phase 2 write slices — entry conditions

All must be true before opening Schedule CMS non-dry-run write slices broadly:

```txt
gosakiClientPreviewFeedbackClosureComplete: true   ← client/operator sign-off recorded (G-12c-result)
gosakiPublicScheduleReadVerificationComplete: true ← G-12b done
gosakiScheduleCmsPhaseBoundaryDocumented: true      ← G-12d / G-9h3 (next planning)
readyForAnyDbWrite: false                          ← until per-slice preflight + explicit approval
readyForFtpAutoApply: false                        ← manual upload only (G-7f1)
```

**Additional per-slice gates (unchanged):**

- New approval ID per non-dry-run slice
- Dry-run Preview before Save
- Staging shell only — not `/admin`
- No `start_time-only` per-field manual round-trip (G-9g4a2 policy)
- Do not re-click G-9k6 / G-9g4a1 / G-9g4a2a proven Saves

---

## 10. Sequence after G-12c

| Order | Phase | Type |
|-------|-------|------|
| 1 | **G-12c-result** | Operator records client feedback + classification |
| 2 | **G-12d** / **G-9h3** | Phase 1/2 boundary doc |
| 3 | **A-class fixes** | Display fixes + manual re-upload if needed |
| 4 | **Phase 2 write** | Schedule slices with explicit approval |

---

## 11. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiClientPreviewFeedbackClosurePlanningComplete` | **true** |
| `gosakiClientPreviewFeedbackClosureComplete` | **false** (pending client) |
| `cursorDbWriteExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `productionTouched` | **false** |

---

## 12. Verifier

```bash
node tools/static-to-astro/scripts/verify-g12c-gosaki-client-preview-feedback-closure-planning.mjs
```

---

## 13. References

- [gosaki-client-preview-feedback-closure.md](./gosaki-client-preview-feedback-closure.md) — client checklist (G-9h1, refreshed G-12c)
- [gosaki-public-schedule-read-verification.md](./gosaki-public-schedule-read-verification.md) (G-12b)
- [gosaki-youtube-url-save-staging-public-verification.md](./gosaki-youtube-url-save-staging-public-verification.md) (G-11c15)
- [gosaki-schedule-cms-practicalization-planning.md](./gosaki-schedule-cms-practicalization-planning.md) (G-9h)

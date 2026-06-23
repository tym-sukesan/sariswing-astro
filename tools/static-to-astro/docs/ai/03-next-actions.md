Last updated: 2026-06-23
Project: Static-to-Astro CMS / Musician CMS Kit

## 0zi. G-10h4b About profile HTML static JSON write execution — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4b-gosaki-about-profile-html-static-json-write-execution` |
| Doc | `gosaki-about-profile-html-static-json-write-execution.md` |
| Block | `about-profile-html` / field `html` only |
| Change | `<!-- G-10h4b profile save test -->` ×1 at profile html tail |
| approvalId | `G-10h4a-about-profile-html-static-json-write-dry-run` |
| Save env | `G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED=true` (one-time arm only) |
| **Next** | `G-10h4c-gosaki-about-bands-html-static-json-write-dry-run` |
| **Do not** | re-click G-10h4b Save / bands write / Cursor FTP |

## 0zh. G-10h4a About profile HTML dry-run write slice — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h4a-gosaki-about-profile-html-static-json-write-dry-run` |
| Doc | `gosaki-about-profile-html-static-json-write-dry-run.md` |
| Commit | `c126efe` |
| Block | `about-profile-html` / field `html` only |
| **Next** | G-10h4c (G-10h4b execution complete — see 0zi) |
| **Do not** | duplicate G-10h4b Save without rollback |

## 0zg. G-10h3 About HTML CMS admin read-only preview — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h3-gosaki-about-html-content-admin-readonly-preview` |
| Doc | `gosaki-about-html-content-admin-readonly-preview.md` |
| Route | `/__admin-staging-shell/musician-basic/admin/about/` |
| Status | **complete** — read-only textarea + preview; Save disabled |
| **Next** | G-10h4b profile Save execution (G-10h4a dry-run complete — see 0zh) |
| **Do not** | enable Save / write API / Cursor FTP |

## 0zf. G-10h2 About HTML CMS seed JSON + convert hook — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h2-gosaki-about-html-content-seed-json-and-convert-hook` |
| Doc | `gosaki-about-html-content-seed-json-and-convert-hook.md` |
| Status | **complete** — read-only public reflection |
| Config | `gosaki-piano-about-content.json` |
| Hook | `gosaki-about-content.mjs` after G-8a |
| Verify | `safeForStaticFtp: true`; about in manual-upload package |
| **Next** | `G-10h3-gosaki-about-html-content-admin-ui` |
| **Do not** | Save / write API / Cursor FTP |

## 0ze. G-10h1 About HTML CMS implementation preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h1-gosaki-about-html-content-cms-implementation-preflight` |
| Doc | `gosaki-about-html-content-cms-implementation-preflight.md` |
| Status | **complete** — design fixed; no implementation |
| Config path | `gosaki-piano-about-content.json` (**not created yet**) |
| Profile anchor | `[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]` inner |
| Bands policy | non-empty HTML replaces `<BandProfilesSection />`; else G-8a fallback |
| Hook | `gosaki-about-content.mjs` after G-8a in convert |
| Approval ID | `G-10h-about-html-content-static-json-write-slice` |
| **Next** | G-10h4 static JSON write (G-10h3 complete — see 0zg) |
| **Do not** | create JSON / hook / Save / Cursor FTP |

## 0zd. G-10h About HTML content CMS planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-10h-gosaki-about-html-content-cms-planning` |
| Doc | `gosaki-about-html-content-cms-planning.md` |
| Status | **complete** — planning only |
| Target | `/about/` — profile Wix block + Bands / Projects HTML |
| Sariswing ref | `site_pages` + textarea + preview (Gosaki → static JSON) |
| PHOTO placeholder | `BandProfilesSection` — missing `public/images/bands/*.jpg` |
| Recommended | **2 HTML blocks** in `gosaki-piano-about-content.json` + G-10c write pattern |
| **Next** | G-10h2 implementation (preflight complete — see 0ze) |
| Deferred | G-10f Discography images |
| **Do not** | implement / JSON write / Cursor FTP |

## 0zc. G-10f Discography album images planning — complete (deferred)

| Item | Value |
| --- | --- |
| Phase | `G-10f-gosaki-discography-album-images-planning` |
| Doc | `gosaki-discography-album-images-planning.md` |
| Status | **complete** — read-only investigation |
| **Priority** | **deferred** — operator shifted to About CMS (G-10h) |
| **Resume when** | About CMS v1 live or operator requests discography |
| Releases | 4 (`continuous`, `skylark`, `about-us`, `ja-jaaaaan`) |
| Public images | Wix CDN in HTML — **0 local** in package |
| Admin `coverImage` | **empty** on all 4 → 「準備中」placeholder |
| Recommended | **E+B** — JSON paths + `public/images/discography/` + convert img rewrite |
| **Next** | resume at `G-10f1` when operator re-prioritizes |
| **Do not** | image mutation / JSON write / Cursor FTP |

## 0zb. G-10e1 YouTube embed layout reupload QA — complete

| Item | Value |
| --- | --- |
| Phase | `G-10e1-gosaki-youtube-embed-section-layout-reupload-qa-finalization` |
| Doc | `gosaki-youtube-embed-section-layout-reupload-qa-finalization.md` |
| Status | **complete** — operator re-upload + staging QA **PASS** |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| videoId | `Ke4F8JAQz-I` |
| Layout | G-10e `720px` / 16:9 / Wix mesh breakout **reflected on staging** |
| Prior commit | `9dabcb4` (G-10e) |
| Cursor FTP / upload | **not executed** |
| **Next** | `G-10f-gosaki-discography-album-images-planning` **or** `G-10g-gosaki-contact-hubspot-form-planning` |
| **Do not** | re-click G-10c Save; mirror/delete re-upload |

## 0za. G-10e YouTube embed section layout improvement — complete

| Item | Value |
| --- | --- |
| Phase | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| Doc | `gosaki-youtube-embed-section-layout-improvement.md` |
| Status | **complete** — local CSS + convert/build/package; staging QA PASS (G-10e1) |
| Layout | `.gosaki-youtube-embed` `max-width: 720px`; `aspect-ratio: 16 / 9`; Wix mesh breakout |
| Package | `output/manual-upload/gosaki-piano/public-dist/` (20 files) |
| Staging | **live** — layout improvement confirmed (G-10e1) |
| Cursor FTP / upload | **not executed** |
| **Next** | G-10f or G-10g (see 0zb) |
| **Do not** | re-click G-10c Save; Cursor FTP |

## 0z. G-10d2a YouTube embed staging upload QA — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization` |
| Doc | `gosaki-youtube-embed-staging-upload-qa-finalization.md` |
| Status | **complete** — operator upload + staging QA **PASS** |
| Staging URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| videoId | `Ke4F8JAQz-I` |
| Known UI | YouTube section too small → **G-10e** (non-blocking) |
| Cursor FTP | **not executed** |
| **Next** | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| **Do not** | re-click G-10c Save; mirror/delete re-upload |

## 0y. G-10d2 YouTube embed staging manual upload — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| Doc | `gosaki-youtube-embed-staging-manual-upload-by-operator.md` |
| Status | **complete** — operator upload + QA PASS (G-10d2a) |
| Operator decision | Upload **done** |
| Cursor FTP/upload | **not executed** |
| **Next** | `G-10e-gosaki-youtube-embed-section-layout-improvement` |
| **Do not** | mirror / sync / delete; FTP auto-deploy; re-click G-10c Save |

## 0x. G-10d1 YouTube embed manual upload package prep — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d1-gosaki-youtube-embed-manual-upload-package-prep` |
| Doc | `gosaki-youtube-embed-manual-upload-package-prep.md` |
| Status | **complete** — package generated + verified locally |
| Package | `output/manual-upload/gosaki-piano/public-dist/` (20 files) |
| YouTube in package home | `youtube-nocookie.com/embed/Ke4F8JAQz-I` |
| `verify:manual-upload` | **PASS** |
| Staging upload | **not done** |
| **Next** | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | FTP auto-deploy; re-click G-10c Save |

## 0w. G-10d YouTube embed public reflection verification — complete

| Item | Value |
| --- | --- |
| Phase | `G-10d-gosaki-youtube-embed-public-reflection-verification` |
| Doc | `gosaki-youtube-embed-public-reflection-verification.md` |
| Status | **complete** — local convert/build + home HTML verified |
| Source JSON | `yt-placeholder-01` `published:true`, watch URL `Ke4F8JAQz-I` |
| Home HTML | `youtube-nocookie.com/embed/Ke4F8JAQz-I` + `.gosaki-youtube-embed` |
| Staging upload | **package ready** — operator upload pending (G-10d2) |
| **Next** | `G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | re-click G-10c Save; FTP auto-deploy |

## 0v. G-10c2 YouTube embed static JSON Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c2-gosaki-youtube-embed-static-json-write-save-success-finalization` |
| Doc | `gosaki-youtube-embed-static-json-write-save-success-finalization.md` |
| Status | **complete** — operator manual Save **succeeded** |
| Target | `gosaki-piano-youtube-embed.json` / `yt-placeholder-01` |
| changedFields | `embedCode`, `published` |
| videoId | `Ke4F8JAQz-I` |
| itemsAffected | **1** |
| Public反映 | **local verified** — staging upload pending (G-10d1) |
| **Next** | `G-10d1-gosaki-youtube-embed-staging-manual-upload-by-operator` |
| **Do not** | re-click G-10c Save |

## 0u. G-10c1 Save API response fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c1-gosaki-youtube-embed-static-json-save-api-response-fix` |
| Doc | `gosaki-youtube-embed-static-json-save-api-response-fix.md` |
| Incident | Manual Save 1: HTML 404; API check: `FailedToLoadModuleSSR` (wrong import path) |
| Fix | `injectRoute` (dev) + `../../../../lib/...` imports + client safe parse |
| **Verify** | `curl GET` → **405 JSON** `method_not_allowed` |
| **Next** | Operator: restart dev → dry-run → Save retry once |
| JSON config | **unchanged** |

## 0t. G-10c YouTube embed static JSON write slice — complete

| Item | Value |
| --- | --- |
| Phase | `G-10c-gosaki-youtube-embed-static-json-write-slice-implementation` |
| Doc | `gosaki-youtube-embed-static-json-write-slice-implementation.md` |
| Status | **complete** — dry-run + gated Save UI; executor wired |
| Write target | `gosaki-piano-youtube-embed.json` / `yt-placeholder-01` |
| Fields | `embedCode`, `published` only |
| Default Save | **disabled** (`G10C_YOUTUBE_EMBED_SAVE_ENABLED=false`) |
| **Next** | G-10c final preflight → operator Save once |
| `readyForAnyDbWrite` | **false** |

## 0s. G-10b YouTube embed read/write planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-10b-gosaki-youtube-embed-read-and-write-planning` |
| Doc | `gosaki-youtube-embed-read-and-write-planning.md` |
| Status | **complete** — survey + write option comparison |
| Public read | JSON → convert hook → `YouTubeEmbedSection.astro` → build → manual upload |
| Admin read | `gosaki-youtube-embed-admin-binding.ts` (fs JSON) |
| Current data | Placeholder `published:false` — home section hidden |
| **G-10c recommended** | static JSON write slice (1 item; dry-run + approval) |
| **G-10e deferred** | `site_embeds` Supabase migration |
| `readyForAnyDbWrite` | **false** |

**Next:** `G-10c-gosaki-youtube-embed-static-json-write-slice-final-preflight` — operator dry-run + Save once (env arm).

## 0r. G-10a Gosaki completion inventory — complete

| Item | Value |
| --- | --- |
| Phase | `G-10a-gosaki-completion-inventory-and-next-module-selection` |
| Doc | `gosaki-completion-inventory-and-next-module-selection.md` |
| Status | **complete** — inventory + next module selection |
| Schedule arc | G-9k6–G-9k7b **closed** for verification / UI |
| **Next module** | **YouTube embed CMS** → `G-10b` **complete** → `G-10c` static JSON write slice |
| Parallel | `G-9h1` client preview feedback (operator) |
| `readyForAnyDbWrite` | **false** |

## 0q. G-9k7b Save UI copy dedup + list edit button — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k7b-gosaki-schedule-save-ui-copy-and-list-usability-fix` |
| Doc | `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` §3 |
| Status | **complete** — copy dedup + sticky「編集する」列 |
| Copy | Save 無効 dry-run 後: パネル `保存は無効です。確認のみ完了しました。` のみ |
| List | `admin-gosaki-schedule-table__actions-col` sticky @ ≥960px |
| **Do not** | DB write / Save click |
| `readyForAnyDbWrite` | **false** |

## 0p. G-9k7 Save UI copy and editor scroll fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k7-gosaki-schedule-save-ui-copy-and-editor-scroll-fix` |
| Doc | `gosaki-schedule-save-ui-copy-and-editor-scroll-fix.md` |
| Status | **complete** — operator copy + PC scroll layout |
| Copy | Save 無効/有効で矛盾しない文言 |
| Scroll | 一覧・編集パネル独立スクロール（≥960px） |
| **Do not** | DB write / Save click in this phase |
| Next | generalization, next feature, Gosaki CMS Kit, rollback |
| `readyForAnyDbWrite` | **false** |

## 0o. G-9k6g field slice closure — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6g-gosaki-schedule-existing-event-field-slice-closure` |
| Doc | `gosaki-schedule-existing-event-field-slice-closure.md` |
| Status | **complete** — G-9k6 arc **closed** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` |
| All slices | `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d), `venue` (G-9k6e), `title` (G-9k6f) — **succeeded** |
| Policy | **1 Save = 1 field**; `rowsAffected: 1`; single-field `changedFields` + `payload keys` every slice |
| Final baseline | title / venue / open_time / start_time / price + `updated_at` `2026-06-22T15:01:47.671778+00:00` |
| **Do not** | re-click any G-9k4b / G-9k6 slice Save |
| Next (operator choice) | UI copy fix; staging shell Save generalization; existing event next feature; Gosaki CMS Kit (`G-9h1`); rollback |
| `readyForAnyDbWrite` | **false** |

## 0n. G-9k6f title field slice Save success — complete (G-9k6 all slices done)

| Item | Value |
| --- | --- |
| Phase | `G-9k6f-gosaki-schedule-existing-event-title-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `title` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `title` only |
| Before → after | `<Duo>` → `<Duo> [G-9k6 title UI保存テスト]` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T15:01:47.671778+00:00` |
| UI | **保存成功** panel; diff タイトル only; post-save description shown (display only) |
| **G-9k6 all slices** | `description`, `price`, `open_time`, `start_time`, `venue`, `title` — **all succeeded** |
| **Do not** | re-click G-9k6f Save (or any G-9k6 slice Save) |
| Next | `G-9k6g` field-slice closure |
| `readyForAnyDbWrite` | **false** |

## 0m. G-9k6e venue field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6e-gosaki-schedule-existing-event-venue-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `venue` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `venue` only |
| Before → after | `川崎 ぴあにしも` → `川崎 ぴあにしも [G-9k6 venue UI保存テスト]` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T13:02:19.63835+00:00` |
| UI | **保存成功** panel; diff 会場 only; post-save description shown (display only) |
| **Do not** | re-click G-9k6e Save |
| Next | `G-9k6f` `title` field slice manual Save (last) |
| `readyForAnyDbWrite` | **false** |

## 0l. G-9k6d start_time field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `start_time` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `start_time` only |
| Before → after | `15:30` → `19:00` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T12:42:32.483922+00:00` |
| UI | **保存成功** panel; diff 開演 only |
| **Do not** | re-click G-9k6d Save |
| Next | `G-9k6e` `venue` field slice manual Save |
| `readyForAnyDbWrite` | **false** |

## 0k. G-9k6c open_time field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `open_time` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `open_time` only |
| Before → after | `15:00` → `18:00` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T07:30:35.391238+00:00` |
| UI | **保存成功** panel; diff 開場 only |
| **Do not** | re-click G-9k6c Save |
| Next (at completion) | `G-9k6d` `start_time` — **done** |
| `readyForAnyDbWrite` | **false** |

## 0j. G-9k6b price field slice Save success — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6b-gosaki-schedule-existing-event-price-field-slice-save-success-finalization` |
| Doc | `gosaki-schedule-existing-event-price-field-slice-save-success-finalization.md` |
| Status | **complete** — operator manual `price` slice UI Save **succeeded** |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `price` only |
| Before → after | `3,000円` → `3,000円（G-9k6 price UI保存テスト）` |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T06:53:39.857434+00:00` |
| UI | post-save **保存成功** panel confirmed |
| **Do not** | re-click G-9k6b Save |
| Next (at completion) | `G-9k6c` `open_time` — **done** |
| `readyForAnyDbWrite` | **false** |

## 0i. G-9k6a field slice verification planning — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k6a-gosaki-schedule-existing-event-field-slice-verification-planning` |
| Doc | `gosaki-schedule-existing-event-field-slice-verification-planning.md` |
| Status | **planning complete** — matrix + checklist only |
| Done | `description` (G-9k4b), `price` (G-9k6b), `open_time` (G-9k6c), `start_time` (G-9k6d) |
| Pending slices | `venue` → `title` (last) |
| Next slice | `G-9k6e` `venue` |
| `readyForAnyDbWrite` | **false** |

## 0h. G-9k5 save button arc finalization — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k5-gosaki-schedule-existing-event-save-button-success-finalization` |
| Doc | `gosaki-schedule-existing-event-save-button-success-finalization.md` |
| Status | **G-9k arc closed** — operator UI Save初回成功まで到達 |
| First UI Save | row `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only; `rowsAffected: 1` |
| Project | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |
| Production | sari-site / Sariswing **not touched** |
| `service_role` | **not used** |
| **Do not** | re-click G-9k4b Save; re-arm G-9k non-dry-run without new approval |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false` |
| Next (separate) | field slices, CMS Kit generalization, rollback policy, publish/deploy design |
| `readyForAnyDbWrite` | **false** |

## 0g. G-9k4b UI manual Save success + post-save result fix — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k4b-gosaki-schedule-existing-event-ui-manual-save-success-and-post-save-result-fix` |
| Doc | `gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md` |
| Status | **complete** — operator manual G-9k4b UI Save **succeeded**; post-save result UI fix |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only |
| `rowsAffected` | **1** |
| post-save `updated_at` | `2026-06-22T02:20:07.217037+00:00` |
| **Do not** | re-click G-9k4b Save without new approval |
| Routine dev | `PUBLIC_ADMIN_WRITE_DRY_RUN=true`; `G9K_SAVE_BUTTON_SAVE_ENABLED=false` |
| `readyForAnyDbWrite` | **false** |

## 0f. G-9k4a UI Save enable preflight — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight` |
| Doc | `gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.md` |
| Module | `gosaki-schedule-existing-event-save-button-save.ts` |
| Status | **complete** — Save path wired; **default disabled** |
| Next | `G-9k4` operator manual Save once |
| `readyForAnyDbWrite` | **false** |

## 0e. G-9k3 manual dry-run verification — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k3-gosaki-schedule-existing-event-save-button-manual-dry-run-verification` |
| Doc | `gosaki-schedule-existing-event-save-button-manual-dry-run-verification.md` |
| Status | **complete** — operator manual checklist 1–8 PASS; **no DB write** |
| Save | **disabled** (`G9K_SAVE_BUTTON_SAVE_ENABLED = false`) |
| Next | `G-9k4` operator manual Save once |
| `readyForAnyDbWrite` | **false** |

## 0d. G-9k2 save button UI wiring — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k2-gosaki-schedule-existing-event-save-button-ui-wiring-dry-run-gate` |
| Doc | `gosaki-schedule-existing-event-save-button-ui-wiring.md` |
| Module | `gosaki-schedule-existing-event-save-button-dry-run.ts` |
| Status | **complete** — dry-run gate; Save **not** enabled |
| Next | `G-9k3` dry-run verification |
| `readyForAnyDbWrite` | **false** |

## 0c. G-9k1 save button guard / config — complete

| Item | Value |
| --- | --- |
| Phase | `G-9k1-gosaki-schedule-existing-event-save-button-guard-config-verifier` |
| Doc | `gosaki-schedule-existing-event-save-button-guard-config.md` |
| Modules | `gosaki-schedule-existing-event-save-button-config.ts`, `gosaki-schedule-existing-event-save-button-guards.ts` |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| Status | **complete** — Save **not** enabled; no UI wiring / DB write |
| Next | `G-9k2` operator UI wiring |
| `readyForAnyDbWrite` | **false** |

## 0b. G-9k save button enablement — planning complete

| Item | Value |
| --- | --- |
| Phase | `G-9k-gosaki-schedule-existing-event-save-button-enablement-planning` |
| Doc | `gosaki-schedule-existing-event-save-button-enablement-planning.md` |
| Scope | Operator 「更新する」 — existing row UPDATE; 6 safe fields |
| approvalId | `G-9k-gosaki-schedule-existing-event-save-button-non-dry-run` |
| env arm | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED` |
| Status | **planning complete** — Save **not** enabled |
| Next | `G-9k1` guard / config / verifier |
| `readyForAnyDbWrite` | **false** |

## 0a. G-9j5c — success finalization complete

| Item | Value |
| --- | --- |
| Phase | `G-9j5c-gosaki-schedule-existing-event-update-success-finalization` |
| Doc | `gosaki-schedule-existing-event-update-success-finalization.md` |
| Status | **G-9j5 one-row non-dry-run UPDATE succeeded** (operator manual — once) |
| Project | `static-to-astro-cms-staging` / `kmjqppxjdnwwrtaeqjta` only |
| Row | `f687ebf3-407c-49d0-9ab8-58040c499b8e` — `description` only |
| `rowsAffected` | **1** |
| UI | post-save description confirmed on staging schedule admin |
| Prerequisites | G-9j5a password reset, G-9j5b auth gate, explicit admin email, project allowlist |
| **Do not** | re-run G-9j5 without new approval ID |
| Next | operator Save enablement planning or additional field slices (separate phases) |
| `readyForAnyDbWrite` | **false** (routine dev) |

## 0. Gosaki staging admin schedule UI — add/edit forms (UI only)

| Item | Value |
| --- | --- |
| Routes | `/__admin-staging-shell/musician-basic/admin/schedule/` |
| Schedule | Add + edit forms; save disabled; dev PoC in `<details>` |
| Next | G-9h1 client preview feedback closure |

## 0b. G-9j Gosaki schedule existing event save enablement — planning complete

| Item | Value |
| --- | --- |
| Phase | `G-9j-gosaki-schedule-existing-event-save-enablement-planning` |
| Doc | `gosaki-schedule-existing-event-save-enablement-planning.md` |
| Verifier | `verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs` — 33 passed |
| Scope | Existing row UPDATE only — 6 safe fields; no add/delete/date/published |
| Status | **planning complete** — no implementation / Save / DB write |
| Next | `G-9j1-guards-and-dry-run-implementation` |
| `readyForAnyDbWrite` | **false** |

## 0c. Gosaki YouTube and Discography (UI practicalization)

Static home YouTube embeds (multi-item JSON) + Discography CMS-ready admin UI. Doc: `gosaki-youtube-and-discography-practicalization.md`. No DB / Save / deploy.

## 1. Immediate priority

**Current phase:** `G-9h-gosaki-schedule-cms-practicalization-planning` — **complete**（G-9h planning complete. 最新commitは git HEAD を確認すること。）

**Git:** branch `main`; HEAD = origin/main — 最新commitは git HEAD を確認すること。

### G-9h Gosaki schedule CMS practicalization planning — complete

| Item | Value |
| --- | --- |
| Doc | `gosaki-schedule-cms-practicalization-planning.md` |
| Verifier | `verify-g9h-gosaki-schedule-cms-practicalization-planning.mjs` — 34 passed |
| Status | **complete** — planning only; no DB write / Preview / Save |
| Next recommended | `G-9h1-gosaki-client-preview-feedback-closure` |
| NOT next | `start_time-only manual non-dry-run execution` |

### G-9g4a2 framework implementation — complete

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-single-text-field-operational-commonization-implementation.md` |
| Status | **complete, committed, pushed** — C1 `1e643e7`, C2 `9c3714c`, C3 `1c1fb32`, C4 `d66bae7` |
| C1 | registry + types + parameterized guards + generic config |
| C2 | generic Save executor + open_time-only save delegate |
| C3 | generic edit UI + open_time edit-ui delegate + Astro/binding wiring |
| Target fields | `open_time`, `start_time`, `price` |
| Verifiers | C1 69 / C2 34 / C3 47 / G-9g4a2a 83 / planning 39 / implementation 43 passed |

### G-9g4a2a open_time-only round-trip — complete (historical)

| Item | Value |
| --- | --- |
| Doc | `staging-shell-schedule-open-time-only-operational-restore-and-closure.md` |
| Status | **complete** — commit `105c6b1` (committed and pushed) |
| markerRemainsInStagingDb | **false** |
| No further Save / restore | **yes** |

### Policy (manual round-trip reduction)

- Do **not** repeat per-field manual round-trips for `start_time` / `price`
- Manual non-dry-run round-trip reserved for **new common logic** only (max once with explicit approval)
- Config-only field additions: static verifiers, guards, dry-run Preview, type checks
- **Not** next: `start_time`-only manual execution slice

### Gates

```txt
stagingShellScheduleSingleTextFieldOperationalCommonizationImplementationComplete: true
readyForG9g4a2FrameworkLocalStaticVerification: true
readyForG9g4a2FrameworkOptionalDryRunPreviewByOperator: true (explicit approval only)
readyForG9g4a2FrameworkSmokeNonDryRunSave: false
readyForAnyDbWrite: false
cursorClickedSave: false
cursorClickedPreview: false
```

## 2. Next steps

1. **G-9k4** operator manual Save once (explicit approval; flip `G9K_SAVE_BUTTON_SAVE_ENABLED` in G-9k4 only)
2. **G-9h1** client preview feedback closure
3. **Not** next: Cursor Save click; G-9j5 runner re-execution

## 3. Routine dev safety

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false or unset
PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false or unset
```

## 4. Do not

- Start `start_time`-only manual round-trip (framework implementation complete)
- Re-click G-9g4a2a open_time-only Save on proven row
- Run non-dry-run Save for `start_time` / `price` without new approval ID
- Cursor / AI click row picker / Preview / Save
- Use service_role
- Touch production or `/admin`

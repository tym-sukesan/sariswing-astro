# G-11c1 — Gosaki YouTube URL web-save dry-run PoC local prep

**Phase:** `G-11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep`  
**Status:** **complete** — Edge Function source + validation + admin dry-run UI; **no deploy / no writes**  
**Date:** 2026-06-25  
**Prior:** G-11b post-upload finalization (`d7b4674`)

| Check | Status |
| --- | --- |
| Edge Function source added | **yes** (not deployed) |
| Admin dry-run UI | **yes** |
| JSON file write | **no** |
| Supabase deploy | **no** |
| FTP / upload | **no** |

---

## Gates

```txt
gosakiYoutubeUrlWebSaveDryRunPocLocalPrepComplete: true
phase: G-11c1
readyForG11c2EdgeFunctionDeployPreflight: true
readyForOperatorManualUpload: true
supabaseEdgeFunctionDeployExecuted: false
cursorFtpUploadExecuted: false
cursorDbWriteExecuted: false
cursorJsonWriteExecuted: false
```

---

## 1. Scope

YouTube URL 1フィールドについて、**dry-run のみ**をオンライン CMS 形に近づけるローカル準備。

- **対象 config:** `config/sites/gosaki-piano-youtube-embed.json`
- **現在値:** `https://www.youtube.com/watch?v=Ke4F8JAQz-I` / `Ke4F8JAQz-I`
- **Save / Publish / Deploy:** 引き続き disabled

---

## 2. Edge Function（ソースのみ — 未 deploy）

| File | Role |
| --- | --- |
| `supabase/functions/gosaki-youtube-url-dry-run/index.ts` | POST handler; `requireAdminUser`; dry-run only |
| `supabase/functions/_shared/gosaki-youtube-url-dry-run.ts` | Validation + dry-run response |
| `supabase/functions/_shared/gosaki-youtube-staging-current.ts` | Staging current snapshot |

**Payload (required):**

```json
{
  "siteSlug": "gosaki-piano",
  "module": "youtube-embed",
  "field": "embedCode",
  "nextValue": "https://www.youtube.com/watch?v=...",
  "dryRun": true,
  "operationId": "G-11c1-gosaki-youtube-url-web-save-dry-run-poc",
  "approvalId": "G-11c1-youtube-url-dry-run"
}
```

**Validation:**

- `dryRun === true` のみ
- siteSlug / module / field / operationId / approvalId allowlist
- YouTube URL / embed / youtu.be / 11-char videoId のみ
- 禁止: `javascript:`, `data:`, `<iframe>`, `<script>`, HTML, 空文字, 非 YouTube URL
- 同一 URL → `no_change`; 異なる URL → `changedFields: ["embedCode", "videoId"]`
- `wouldWrite: false` 常に

---

## 3. Local validation module

`tools/static-to-astro/scripts/lib/gosaki-youtube-url-dry-run-validation.mjs`

G-10c `parseYoutubeVideoId` / guards を参考に実装。ローカル verifier が直接テスト。

---

## 4. Admin UI（G-11b 拡張）

`templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro`

- next YouTube URL 入力欄
- **Dry-run（保存前チェック）** ボタン
- 結果表示 `<pre>`
- `PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT` 未設定時 → `dry-run endpoint not configured`（安全に失敗）
- Save / Publish / Deploy は disabled 維持
- secrets / anon key / service_role は HTML に含めない

---

## 5. Local commands (executed)

```bash
cd tools/static-to-astro
rm -rf output/gosaki-piano-astro
node scripts/convert-static-to-astro.mjs \
  fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ \
  --site-profile musician \
  --verify-build

node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md

npm run manual-upload:package
npm run verify:manual-upload
```

Verifier:

```bash
node tools/static-to-astro/scripts/verify-g11c1-gosaki-youtube-url-web-save-dry-run-poc-local-prep.mjs
```

---

## 6. Local dry-run test results

| Case | Result |
| --- | --- |
| Valid different YouTube URL | `ok:true`, `dryRun:true`, `wouldWrite:false`, `changedFields` present |
| Same URL as current | `no_change`, `changedFields: []` |
| Invalid non-YouTube URL | `ok:false` |
| `<script>` injection | `ok:false` |
| `dryRun: false` | rejected |
| Wrong `siteSlug` | rejected |
| JSON config file | **unchanged** |

---

## 7. Not done

- `supabase functions deploy`
- GitHub Actions / `workflow_dispatch`
- FTP / FileZilla / upload
- JSON 実書き込み
- Save ボタン有効化
- `src/pages/admin` (Sariswing production) 変更

---

## 8. Next phase

1. **Operator manual upload** — `public-dist/admin/` 含む package を staging へ（任意）
2. **G-11c2** — Edge Function deploy preflight + staging dry-run 接続（`PUBLIC_GOSAKI_YOUTUBE_URL_DRY_RUN_ENDPOINT`）

---

## References

- G-11a architecture: `gosaki-staging-online-cms-architecture-planning.md`
- G-11b admin: `gosaki-staging-online-admin-read-only-page-package-prep.md`
- G-10c local write guards: `src/lib/admin/staging-write/gosaki-youtube-embed-static-json-write-*.ts`

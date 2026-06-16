# G-8g3 — gosaki schedule hub design and link fix

Phase: `G-8g3-gosaki-schedule-hub-design-and-link-fix`  
Date: 2026-06-14  
Prior phase: `G-8g2-gosaki-header-nav-functionality-fix` (local only, commit deferred)

Staging URL: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/`

## Observed issues (after G-8g2 operator upload)

| Area | Issue |
| --- | --- |
| **Schedule hub design** | `/schedule/` rendered as plain HTML list — no gosaki styling |
| **Month links** | `href="/2026-06/"` root-absolute → staging navigates to `https://yskcreate.weblike.jp/2026-06/` |

## Cause

| Area | Root cause |
| --- | --- |
| **Plain design** | `generateScheduleIndexPage()` in `astro-generator.mjs` used generic `page-heading` / `link-list` classes with no gosaki-specific CSS |
| **Root href** | Month links built as static `href="${m.route}"` without `withBase()`; Astro build emitted root paths |

## Fix implemented

### Schedule index generator (`astro-generator.mjs`)

- Import `withBase` in generated `schedule/index.astro`
- Replace generic markup with:
  - `.gosaki-schedule-hub`
  - `.gosaki-schedule-hub__title`
  - `.gosaki-schedule-months`
  - `.gosaki-schedule-month-link`
- Month links: `href={withBase('/2026-07/')}` etc.

### Site CSS (`gosaki-piano-overrides.mjs` — G-8g3)

- Centered hub section, max-width ~860px
- Futura title, beige border cards for month links
- SP padding adjustments
- Hover: beige highlight

### Verifier

`verify-url-staging-pipeline.mjs`: G-8g3 block, withBase in generator, no root-only month href pattern.

## Schedule hub design

- Header / Footer: unchanged (BaseLayout)
- Title: centered `Schedule` (futura, `#5b4d43`)
- Month links: vertical card list, centered, white background + beige border
- SP: full-width cards within 20px gutter

## Schedule month link target behavior

| Environment | Example href |
| --- | --- |
| **Staging** | `/cms-kit-staging/gosaki-piano/2026-06/` |
| **Production** (BASE_URL `/`) | `/2026-06/` |

Nav Schedule link: `/cms-kit-staging/gosaki-piano/schedule/` (unchanged from G-8g2).

## Verification results (no FTP, no commit)

```bash
cd tools/static-to-astro
node scripts/convert-static-to-astro.mjs fixtures/gosaki-piano output/gosaki-piano-astro \
  --base-url https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano \
  --deploy-base /cms-kit-staging/gosaki-piano/ --site-profile musician --verify-build
node scripts/verify-static-public-artifact.mjs \
  --astro-dir tools/static-to-astro/output/gosaki-piano-astro \
  --report tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md
npm run verify:url-staging    # 119 passed
npm run verify:crawl          # 30 passed
npm run manual-upload:package
npm run verify:manual-upload  # PASS (15 files)
```

- Built CSS: `_astro/index.65gpmar1.css`
- Manual package includes `schedule/index.html` with deployBase month links

## Manual re-upload instructions (operator)

1. Upload `output/manual-upload/gosaki-piano/public-dist/` → `/cms-kit-staging/gosaki-piano/`
2. **Must include** `_astro/index.65gpmar1.css`, `schedule/index.html`, all HTML pages
3. Verify `/schedule/`: styled hub, month links go to `/cms-kit-staging/gosaki-piano/2026-XX/`
4. Nav Schedule, hamburger, footer text SNS unchanged
5. No mirror/delete sync

## Known remaining differences

- Month pages (`/2026-07/` etc.) still use original Wix crawl HTML layout (not hub-styled)
- Footer SNS remains text links (G-8g1)
- Real-device QA recommended after upload

## FTP not executed

No FTP connect / upload / mirror / delete / `workflow_dispatch` from Cursor.

## Commit not executed

Per operator instruction: **commit / push deferred** (`commitDeferredForVisualBatch: true`).

## Gates

```txt
gosakiScheduleHubDesignAndLinkFixComplete: true
readyForManualReuploadByOperator: true
readyForGosakiClientPreview: true
ftpAutoDeployStillDisabled: true
readyForAnyFutureFtpApply: false
commitDeferredForVisualBatch: true
```

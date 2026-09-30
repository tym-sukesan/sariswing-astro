# Gosaki sanitized CI fixture implementation

Phase: `gosaki-implement-sanitized-ci-fixture`  
Date: 2026-09-30  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-main-merge`

## Goal

Make GitHub Actions Gosaki production convert reproducible from a tracked sanitized HTML snapshot. Raw Wix crawl stays gitignored. No live crawl during deploy.

## Tracked snapshot

- Path: `tools/static-to-astro/fixtures/gosaki-piano-ci/`
- Files: 10 sanitized HTML plus 5 already-tracked About band JPEGs under `assets/about/bands/`
- Size: ~2.9–3.1MB HTML after sanitization
- README in the same directory (HTML is sanitized; JPEGs are existing tracked band photos, not raw Wix crawl)

## Still gitignored

- `tools/static-to-astro/fixtures/gosaki-piano/` (raw crawl)

## Production-only convert input

- Registry `packageProfiles.production.fixtureDir` = `fixtures/gosaki-piano-ci`
- Staging and ciao-preview keep `fixtures/gosaki-piano`
- `fixtureDirAliases` includes the CI directory so Gosaki hooks / visual overrides still apply

## Regenerator (local only)

- `npm run sanitize:gosaki-piano-ci`
- Requires local raw HTML; **not** invoked by the production workflow

## Workflow

- `.github/workflows/gosaki-piano-production-public-dist.yml` runs `scripts/gosaki-production-fixture-preflight.mjs` after checkout, before FTP
- Missing/empty expected HTML fails closed
- Preflight logs counts and names only

## Not executed in this phase

- push
- workflow_dispatch
- FTP
- production host mutation
- Supabase write
- Secret change

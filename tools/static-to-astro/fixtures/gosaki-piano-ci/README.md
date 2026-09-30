# gosaki-piano-ci

Tracked **sanitized** Wix HTML snapshot for GitHub Actions Gosaki **production** convert.

- Raw crawl stays gitignored at `fixtures/gosaki-piano/` and is never committed.
- This directory is convert input for the production package profile only.
- Staging / ciao-preview / live crawl continue to use `fixtures/gosaki-piano/`.
- Regenerator (local only, no network): `npm run sanitize:gosaki-piano-ci`
- CI deploy must **not** crawl. Checkout of these 10 HTML files is sufficient.

Do not mix raw crawl HTML, `manifest.json`, or `CRAWL_REPORT` here.

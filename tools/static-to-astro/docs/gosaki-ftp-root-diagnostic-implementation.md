# Gosaki FTP root read-only diagnostic

Phase: `gosaki-ftp-root-diagnostic-implementation`  
Date: 2026-09-30  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-main-merge`

Temporary GitHub Actions step lists the FTP **login directory only** (`pwd` + `cls -1`). No child `cd`. Upload is disabled with `if: ${{ false }}`.

## Commands

- `set +x`
- `lftp` login with `GOSAKI_PRODUCTION_FTP_HOST` / `_USER` / `_PASSWORD`
- quoted heredoc: `pwd`, `cls -1`, `bye`

## Disabled

- Upload step `Upload public-dist via lftp mirror -R (delete disabled)` → `if: ${{ false }}`

## Not executed

- workflow_dispatch
- FTP write (`mirror` / `put` / `mkdir` / `rm` / …)
- Secret change

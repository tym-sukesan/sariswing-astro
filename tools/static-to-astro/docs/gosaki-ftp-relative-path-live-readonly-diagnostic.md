# Gosaki production FTP relative-path live read-only diagnostic

Phase: `gosaki-ftp-relative-path-live-readonly-diagnostic`  
Date: 2026-10-01

Temporary Actions step: `cd "$GOSAKI_PRODUCTION_FTP_REMOTE_DIR"` then `pwd`, then `gosaki-production-ftp-remote-dir-guard.mjs --match-pwd-file`. Expected secret `gosaki-piano` vs lftp PWD `/gosaki-piano`. Upload stays `if: ${{ false }}`. No `cls`, no `mirror`.

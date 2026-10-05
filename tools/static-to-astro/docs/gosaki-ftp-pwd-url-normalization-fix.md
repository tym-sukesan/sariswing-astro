# Gosaki production FTP pwd URL normalization

Phase: `gosaki-ftp-pwd-url-normalization-fix`  
Date: 2026-10-06  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-main-merge`

lftp 4.9.x `pwd` prints the current remote URL. `--match-pwd-file` now takes the last non-empty line, and if it is `ftp://` or `ftps://`, parses with `new URL()` and passes **pathname only** to the existing strict matcher. Parse failure and empty pathname are mismatches. Path inputs (`gosaki-piano`, `/gosaki-piano`) are unchanged. `/`, `.`, `/not-gosaki-piano`, `/foo/gosaki-piano`, and suffix matches stay false. Upload remains `if: ${{ false }}`. `pwd -p` is not used.

Mismatch logging is booleans only: `last_line_is_ftp_url`, `url_parse_ok`, `pathname_eq_root`, `pwd_match`. Raw line / URL / user / password / host / pathname are not printed.

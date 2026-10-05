# Gosaki production FTP server PWD diagnostic

Phase: `gosaki-ftp-server-pwd-diagnostic-implementation`  
Date: 2026-10-06  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-main-merge`

Temporary diagnostic now sends RFC 959 `quote PWD` at login and after `cd`, plus lftp `pwd`. Stdout stays in a temp file. Parser reads 257 quoted paths internally and logs booleans only: `server_pwd_parse_ok`, `server_pwd_eq_root`, `server_pwd_eq_gosaki_piano`, `server_pwd_nested`, `server_pwd_changed`, `pwd_match`. `quote` is literal `PWD` only. No `pwd -p`, no `debug`. Upload remains `if: ${{ false }}`.

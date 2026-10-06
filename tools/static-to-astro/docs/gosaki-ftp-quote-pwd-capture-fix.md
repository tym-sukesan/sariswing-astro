# Gosaki production FTP quote PWD capture fix

Phase: `gosaki-ftp-quote-pwd-capture-fix`  
Date: 2026-10-06  
Worktree: `/Users/toyamayusuke/sariswing-astro-gosaki-main-merge`

Diagnostic captures lftp stdout and stderr in separate temp files, and redirects each `quote PWD` into its own temp file (`quote PWD > $QUOTE_*_FILE`) so data_iobuf output is not lost. Parser accepts plain `257 "..."`, lftp prefixes, and `257-`. Format logs are boolean/count only. No `debug`, no `pwd -p`, no `cat`. Upload remains `if: ${{ false }}`.

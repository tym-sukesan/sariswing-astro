# Gosaki production FTP relative pwd matcher

Phase: `gosaki-ftp-relative-pwd-matcher-fix`  
Date: 2026-09-30

`pwdMatchesExpected` accepts single-segment secret `gosaki-piano` against lftp PWD `gosaki-piano` or `/gosaki-piano` only. `/`, `.`, `/not-gosaki-piano`, and `/foo/gosaki-piano` stay false (login-root `cd gosaki-piano`, not nested basename). Multi-segment expected paths remain exact. Upload step stays `if: ${{ false }}`.

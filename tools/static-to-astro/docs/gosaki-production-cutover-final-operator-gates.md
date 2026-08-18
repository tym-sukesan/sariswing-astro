# Gosaki production cutover — final operator gates

**Phase:** `gosaki-production-cutover-final-operator-gates`
**Status:** **COMPLETE (read-only packet · remaining operator confirmations)**
**Date:** 2026-08-18
**HEAD:** `0f84b2d1bf1e26da57a7ae6676751aa873931fc7`
**Prior:** `gosaki-ciao-jp-preview-final-qa` (`PREVIEW_TECHNICAL_QA: PASS`)

| Check | Status |
| --- | --- |
| Production package generated | **no** |
| FTP / DNS / NS / SSL / Wix change | **no** |
| DB / Secret / Edge | **no** |
| commit / push | **no** |
| Read-only `dig` / HTTP HEAD | **yes** |

---

## Gates

```txt
gosakiProductionCutoverFinalOperatorGatesComplete: true
phase: gosaki-production-cutover-final-operator-gates
PREVIEW_TECHNICAL_QA: PASS
PUBLIC_CUTOVER_READY_FROM_PREVIEW_QA: true
FINAL_PRODUCTION_URL: https://www.gosaki-piano.com/
REMOTE_DIRECTORY: /gosaki-piano/
CIAO_PREVIEW_REUSE_FORBIDDEN: true
WIX_HOTLINK_CLASS: POST_LAUNCH_CLEANUP
WIX_HOTLINK_PUBLIC_CUTOVER_BLOCKER: false
LIVE_WWW_STILL_WIX: true
MX_OBSERVED: none
CLIENT_SIGNOFF_REQUIRED: true
READY_FOR_PRODUCTION_PACKAGE_GENERATION: false
READY_FOR_COMMIT_PUSH: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
RECOMMENDED_NEXT_PRIMARY: gosaki-production-cutover-docs-commit-push
```

Do **not** generate the production package until docs are committed and HEAD is clean. Do **not** upload ciao-preview HTML (`deployBase=/gosaki-piano/`) as production.

---

## 1. Production cutover target

| | Preview (now) | Final production |
| --- | --- | --- |
| URL | `https://gotosaki.ciao.jp/gosaki-piano/` | `https://www.gosaki-piano.com/` |
| Remote | `/gosaki-piano/` | `/gosaki-piano/` (same folder) |
| `deployBase` | `/gosaki-piano/` | `/` |
| origin | `gotosaki.ciao.jp` | `https://www.gosaki-piano.com` |
| Package | ciao-preview (uploaded) | **new** from clean HEAD |

Config today: production `remotePath` is still `TBD_G-20i` (`config/sites/gosaki-piano.deploy-profiles.json`). Operator path for this account is `/gosaki-piano/`. Update the profile in the **package-generation** phase after mapping is confirmed — not in this phase.

---

## 2. Gate classification

### A. Lolipop domain mapping — `OPERATOR_CONFIRMATION_REQUIRED`

**Known**

- Preview `https://gotosaki.ciao.jp/gosaki-piano/` HTTP **200** (Apache). Remote `/gosaki-piano/` **does** serve the preview tree on ciao.jp.
- That does **not** prove `www.gosaki-piano.com` is assigned to `/gosaki-piano/`.
- Live `https://www.gosaki-piano.com/` is still **Wix** (`server: Pepyaka`, `x-wix-request-id`, parastorage preconnect).

**Operator (1–2 lines):** ロリポップ「独自ドメイン設定」で `www.gosaki-piano.com`（と必要なら apex）の **公開フォルダ** が `/gosaki-piano/` または `gosaki-piano` であること。`/` や `/cms-kit-staging/...` になっていないこと。

### B. Current DNS (read-only, 2026-08-18)

Queried with `dig` / `nslookup`. **No records changed.**

| Name | Type | Value | TTL (observed) |
| --- | --- | --- | --- |
| `gosaki-piano.com` | NS | `ns12.wixdns.net.` / `ns13.wixdns.net.` | 86400 |
| `gosaki-piano.com` | SOA | `ns12.wixdns.net.` / `support.wix.com.` serial `2020010211` | — |
| `gosaki-piano.com` | A | `185.230.63.107` `185.230.63.186` `185.230.63.171` | ~3553s |
| `gosaki-piano.com` | AAAA | **none** | — |
| `gosaki-piano.com` | CNAME | **none** (apex) | — |
| `gosaki-piano.com` | MX | **none** | — |
| `gosaki-piano.com` | TXT / CAA / `_dmarc` / `mail` A | **none** | — |
| `www.gosaki-piano.com` | CNAME | `cdn1.wixdns.net.` → `td-ccm-neg-87-45.wixdns.net.` → A `34.149.87.45` | CNAME ~2432s |
| `https://gosaki-piano.com/` | HTTP | **301** → `https://www.gosaki-piano.com/` (Wix) | — |

**Currently pointing at Wix (do not change this phase):** NS, apex A (Wix pointing IPs), www CNAME chain.

**Likely to change at cutover (values = Lolipop instructions, not guessed):** NS and/or apex A and/or www CNAME/A so both apex and www leave Wix. Prefer **web records only**; avoid a nameserver move if Lolipop can be targeted without it (often Wix NS **cannot** point at Lolipop — confirm in Wix/Lolipop panels).

Lolipop destination IPs/hostnames: **`OPERATOR_CONFIRMATION_REQUIRED`** (not in public DNS today).

### C. Email / MX — gate (do not infer usage)

Public DNS has **no MX, SPF, DMARC, or `mail` A**. That is **not** proof that `@gosaki-piano.com` is unused.

```txt
EMAIL_USAGE: OPERATOR_CONFIRMATION_REQUIRED
MX_OBSERVED: none
```

Cutover gates:

- Do **not** break MX if any appears at switch time (re-`dig MX` immediately before change).
- Prefer changing **web** A/CNAME only.
- Avoid NS change unless required. NS TTL is **86400s** — slow to roll back.
- If NS must move: copy any MX/TXT that exist **at that moment** onto the new DNS first.

### D. SSL — `OPERATOR_CONFIRMATION_REQUIRED`

Live www HTTPS is **Wix** (HSTS present). Whether Lolipop can issue `www.gosaki-piano.com` **before** DNS points at Lolipop is **not** known from this probe.

Operator: ロリポップ「独自SSL」で `www.gosaki-piano.com` が 未設定 / 設定可 / 発行済 のどれか。**発行・変更ボタンは押さない。** DNS 前に可能かはパネル表記をそのまま返す。

### E. Rollback — DNS back to Wix, never remote delete

Save **before** any DNS edit (this snapshot):

```txt
NS:    ns12.wixdns.net. ns13.wixdns.net.
APEX A: 185.230.63.107  185.230.63.186  185.230.63.171
WWW:   CNAME cdn1.wixdns.net.
MX:    (none observed 2026-08-18)
Wix live: https://www.gosaki-piano.com/  (Pepyaka)
```

After cutover, if production HTML/SSL fails: **restore the records above** (or restore Wix nameservers). Leave `/gosaki-piano/` in place. **Do not** remote-delete as rollback.

Also log: each changed record, old value, new value, time.

### F. Content / client signoff

Preview technical QA is **PASS**. Client **production go-live** approval is **not** in repo.

```txt
CLIENT_SIGNOFF_REQUIRED: true
```

This is **not** a technical HTML blocker. Do not treat it as `PREVIEW_TECHNICAL_QA` failure.

### G. Wix dependency (inherited)

```txt
Wix hotlink: POST_LAUNCH_CLEANUP
PUBLIC_CUTOVER_BLOCKER: false
WIX_CDN_DNS_CUTOVER_BREAKS_IMAGES: false
WIX_ACCOUNT_DELETE_BREAKS_HOTLINKS: true
```

Localize images **before** deleting the Wix site / Media Manager. Not a DNS-day blocker.

---

## 3. Cutover sequence (no execution)

Adjusted for same-folder preview vs production HTML:

1. Operator checklist below (mapping, SSL panel, email yes/no, client signoff).
2. **Commit / push** these docs → clean HEAD.
3. Confirm HEAD = `origin/main`, working tree clean.
4. Set production `remotePath` to `/gosaki-piano/` if mapping confirmed; generate **production** package (`deployBase=/`, origin `https://www.gosaki-piano.com`); verify. **Never** reuse ciao-preview.
5. FileZilla: contents of `output/manual-upload/gosaki-piano-production/public-dist/` → remote `/gosaki-piano/` (overwrite OK, **no delete**).
   **Expected side effect:** ciao.jp preview **breaks** (wrong `deployBase`). Do this immediately before DNS, not days early.
6. Re-check MX. Change **web** DNS (apex + www) toward Lolipop. Avoid NS change if possible.
7. Confirm HTTPS on `https://www.gosaki-piano.com/` (Lolipop SSL).
8. Production browser QA on www (Home / About / Schedule / Discography / Contact; CSS; canonical `www.gosaki-piano.com`; indexable robots).
9. If bad: **DNS rollback to Wix** (section E). No remote delete.
10. After PASS: Wix image localize = post-launch cleanup. Do not delete Wix media until then.

Auto FTP `--apply` stays **off**.

---

## 4. Remaining lists

### PUBLIC_CUTOVER_BLOCKERS (technical, still open for go-live)

| Item | Class |
| --- | --- |
| No production package at HEAD `0f84b2d1` | **CONFIRMED** (generate after clean HEAD) |
| ciao-preview tree must not be the public www HTML | **CONFIRMED** (process; not a code bug) |

DNS-still-on-Wix is the **planned switch**, not a defect.

### OPERATOR_CONFIRMATION_REQUIRED

1. Lolipop: `www.gosaki-piano.com` 公開フォルダ = `/gosaki-piano/`（apex も同様か）。
2. クライアントが `@gosaki-piano.com` メールを使っているか（MX 空でも確認）。
3. ロリポップ独自SSL: www の状態と、DNS 前に発行できるか（パネル表記）。
4. 切替で変える record（A/CNAME only vs NS）と Lolipop が指定する値。
5. 本番公開のクライアント承認（`CLIENT_SIGNOFF_REQUIRED`）。
6. Contact / HubSpot に `www.gosaki-piano.com` を許可するか（フォームのみ。site chrome の BLOCKER ではない）。

### OPERATOR checklist (short)

```txt
[ ] 独自ドメイン: www → 公開フォルダ /gosaki-piano/ （staging や / ではない）
[ ] メール利用 yes/no（yes なら MX を切替対象から外す）
[ ] 独自SSL: www の表示を一文で返す（ボタンは押さない）
[ ] クライアント本番公開 OK
[ ] 切替 record 案（Lolipop 案内のコピー）。NS 変更が必要なら理由
[ ] HubSpot 本番ドメイン（Contact を使う場合）
```

---

## 5. This phase did not

Package generate · FTP · DNS/NS/SSL/Wix edits · DB · Secret · Edge · commit/push.

---

## 6. Next

```txt
gosaki-production-cutover-docs-commit-push
```

After clean HEAD: operator confirmation (parallel OK) → `gosaki-production-package-generation` (not this phase).

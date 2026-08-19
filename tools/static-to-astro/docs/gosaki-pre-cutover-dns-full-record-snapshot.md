# Gosaki pre-cutover DNS full record snapshot

Phase: `gosaki-pre-cutover-dns-full-record-snapshot`
Date: 2026-08-19
HEAD: `fb6c567e2bf24a3f1b512edb12c02410a0d35f4f`
Prior public snapshot: `gosaki-production-cutover-final-operator-gates.md` §B (2026-08-18)

```txt
DNS_SNAPSHOT_RESULT: COMPLETE
DNS_CHANGE_EXECUTED: false
NAMESERVER_CHANGE_EXECUTED: false
PUBLIC_CUTOVER_BLOCKER_FROM_DNS_SNAPSHOT: false
READY_FOR_DNS_CUTOVER: false
PACKAGE_GENERATE_EXECUTED: false
RECOMMENDED_NEXT_PRIMARY: gosaki-contact-hubspot-production-domain-readiness-audit
```

## Scope / safety

Read-only public DNS audit + docs only.

**Executed:** `dig` / `nslookup` / `whois` / HTTP HEAD (routing confirmation only).

**Not executed:** DNS change · nameserver change · Lolipop/Wix panel clicks · source change · package generate · FTP · DB write · Secret / Edge · commit / push.

**Rule:** record only what public DNS returned. Do **not** invent records. NXDOMAIN / NODATA is “not observed”, not “this service is unused forever”.

Resolvers: `8.8.8.8`, `1.1.1.1`, authoritative `ns12.wixdns.net` / `ns13.wixdns.net`.
First query batch UTC: `2026-08-19T06:16:27Z`. HTTP HEAD UTC: `2026-08-19T06:18:00Z`.

---

## 1. Query inventory

Minimum types on `gosaki-piano.com` and `www.gosaki-piano.com`:

`NS` `SOA` `A` `AAAA` `CNAME` `MX` `TXT` `CAA`

Additional hostnames probed (presence only; not treated as existing unless answered):

| Hostname | Result @8.8.8.8 |
| --- | --- |
| `_dmarc.gosaki-piano.com` | **NXDOMAIN** (A/CNAME/TXT/MX) |
| `_domainkey.gosaki-piano.com` | **NXDOMAIN** (A/CNAME/TXT/MX) |
| `mail.gosaki-piano.com` | **NXDOMAIN** |
| `autodiscover.gosaki-piano.com` | **NXDOMAIN** |
| `smtp` / `imap` / `pop` / `pop3` / `webmail` | **NXDOMAIN** |
| `ftp` / `m` / `blog` / `shop` / `api` / `staging` / `www2` | **NXDOMAIN** |
| `_autodiscover._tcp` and common mail SRV | **NXDOMAIN** |

DKIM selector brute-force was **not** performed. Selector = **UNKNOWN**.

Apex `TXT` / `MX` / `AAAA` / `CAA` / `DNSKEY` / `DS`: name exists, type **NODATA** (`NOERROR`, empty ANSWER, SOA in authority). That is different from NXDOMAIN.

---

## 2. NS

| Source | Value | TTL |
| --- | --- | --- |
| Authoritative (`ns12` / `ns13`) | `ns12.wixdns.net.` `ns13.wixdns.net.` | **86400** |
| `8.8.8.8` | same | remaining **21600** (cache) |
| `1.1.1.1` | same | **86400** |
| Registry whois | `NS12.WIXDNS.NET` `NS13.WIXDNS.NET` | — |

Registrar: **Wix.com Ltd.** (IANA 3817). DNSSEC: **unsigned**.

vs 2026-08-18: **no value change**. TTL remaining on Google Public DNS is not a zone change.

---

## 3. SOA

Authoritative:

```txt
gosaki-piano.com. 3600 IN SOA ns12.wixdns.net. support.wix.com. 2020010211 10800 3600 1209600 3600
```

| Field | Value |
| --- | --- |
| MNAME | `ns12.wixdns.net.` |
| RNAME | `support.wix.com.` |
| SERIAL | `2020010211` |
| REFRESH | 10800 |
| RETRY | 3600 |
| EXPIRE | 1209600 |
| MINIMUM | 3600 |

Serial matches 2026-08-18 and the domain creation date style (`2020-01-02`). Public evidence: zone has not been republished with a new serial since that snapshot.

---

## 4. Apex A / AAAA

| Type | Observed | Notes |
| --- | --- | --- |
| A | `185.230.63.107` `185.230.63.186` `185.230.63.171` | Wix pointing set. Order varies by resolver. Auth TTL **3600**. |
| AAAA | **none** (NODATA) | — |
| CNAME | **none** (NODATA) | Apex is A, not CNAME. |

vs 2026-08-18: **same three A records**. No AAAA then or now.

---

## 5. www CNAME / A resolution

Authoritative www:

```txt
www.gosaki-piano.com. 3600 IN CNAME cdn1.wixdns.net.
```

Recursive A chain (`8.8.8.8` / `1.1.1.1`):

```txt
www.gosaki-piano.com.          CNAME  cdn1.wixdns.net.
cdn1.wixdns.net.               CNAME  td-ccm-neg-87-45.wixdns.net.
td-ccm-neg-87-45.wixdns.net.   A      34.149.87.45
```

www has **no** own A/AAAA/TXT/MX/CAA/NS at the Wix zone. Queries for those types follow the CNAME. Do not treat the CNAME chain as www TXT/MX/CAA records.

www AAAA: CNAME followed, **no AAAA** on the Wix CDN target (NODATA after CNAME).

vs 2026-08-18: **same CNAME target and same A `34.149.87.45`**.

---

## 6. MX

Apex MX: **none** (NODATA, `NOERROR`).

www MX: CNAME only (no independent MX).

`mail.gosaki-piano.com`: **NXDOMAIN**.

```txt
MX_OBSERVED: none
EMAIL_USAGE: OPERATOR_CONFIRMATION_REQUIRED
```

Absence of MX is **not** proof that `@gosaki-piano.com` is unused (Wix forms, off-domain mail, unpublished panel records, future MX).

---

## 7. TXT

Apex TXT: **none** (NODATA).

www TXT: CNAME only (not a TXT RRset on www).

No `google-site-verification=`, `facebook-domain-verification=`, `MS=`, `wix-verification`, or other verification strings observed.

---

## 8. SPF

No apex TXT → **no SPF record observed**.

Do not infer `v=spf1` from Wix product features. Classification: **not present in public DNS**.

---

## 9. DKIM

| Item | Value |
| --- | --- |
| Selector | **UNKNOWN** (not brute-forced) |
| `selector._domainkey` | not queried as a dictionary |
| `_domainkey.gosaki-piano.com` | **NXDOMAIN** |
| Public DKIM TXT | **none observed** |

---

## 10. DMARC

`_dmarc.gosaki-piano.com` TXT: **NXDOMAIN**.

**No DMARC policy observed.**

---

## 11. CAA

Apex CAA: **none** (NODATA).
www CAA: CNAME only.

Any CA may issue until a CAA RRset is published. **Not** a cutover blocker.

---

## 12. Other records

| Type / name | Result |
| --- | --- |
| DNSKEY / DS | NODATA; whois `DNSSEC: unsigned` |
| SRV (autodiscover / imap / submission / caldav / carddav / pop3s) | NXDOMAIN |
| Common extra hostnames listed in §1 | NXDOMAIN |
| Registry | Wix registrar; `clientTransferProhibited` `clientUpdateProhibited` |

No public extra web hosts (`m`, `blog`, `shop`, `api`, `staging`, `www2`, `ftp`).

---

## 13. Wix web routing baseline (current)

Still on **Wix**. Expected. Not a `PUBLIC_CUTOVER_BLOCKER`.

| Surface | Current |
| --- | --- |
| Nameserver | `ns12.wixdns.net.` `ns13.wixdns.net.` |
| Apex A | `185.230.63.107` `185.230.63.186` `185.230.63.171` |
| www | CNAME `cdn1.wixdns.net.` → A `34.149.87.45` |
| HTTPS apex | HTTP/2 **301** → `https://www.gosaki-piano.com/` (`server: Pepyaka`, `x-wix-*`) |
| HTTPS www | HTTP/2 **200** HTML, HSTS, `server: Pepyaka`, parastorage / wixstatic preconnect |

**Diff vs 2026-08-18 snapshot:** NS / SOA serial / apex A set / www CNAME / www A / MX-none / TXT-none / CAA-none / `_dmarc`-none / `mail`-none — **no material change**. Only cached TTL remaining differed.

---

## 14. Web vs keep (non-web)

### Web records (will change at DNS cutover — values from Lolipop panel later, not guessed)

- Apex **A** (three Wix IPs)
- www **CNAME** `cdn1.wixdns.net.`
- **NS** only if Option B is chosen

### Non-web records to retain at cutover

**Public DNS currently has none** of: MX, SPF, DKIM, DMARC, CAA, verification TXT, mail/autodiscover hosts, extra A/CNAME.

```txt
NON_WEB_RECORDS_OBSERVED: none
KEEP_LIST_FROM_PUBLIC_DNS: empty
```

Keep-list is empty **only for what public DNS shows today**. Wix DNS editor / email product UI can still hold unpublished or panel-only data. Screenshot the Wix DNS editor before any NS move.

Re-`dig` MX/TXT/CAA/NS/A/CNAME immediately before any change. If any non-web RRset appears, it joins the keep-list.

---

## 15. Cutover method implications (no DNS change this phase)

Lolipop target IPs/hostnames: **not inferred**. Confirm from Lolipop panel in a later operator gate.

### A. Keep Wix nameservers; change A / CNAME only

- Zone stays on Wix DNS.
- If Wix allows non-Wix A/CNAME: only web RRsets change; today’s empty MX/TXT/CAA stay empty on the same NS.
- If Wix **does not** allow pointing apex/www off Wix: Option A is blocked and Option B (or Wix-external DNS) is required. That is an **OPERATOR_GATE**, not proven from public DNS.
- Risk of wiping mail/security records by A/CNAME edit: **low given current public RRset**, still re-check at switch time.

### B. Change nameservers (Wix → Lolipop or other)

```txt
STOP: do not change NS until the current zone’s required records
are transplanted onto the new DNS, then re-verified.
```

What would be lost if NS moves to an empty zone:

| Must copy | Current public value |
| --- | --- |
| Apex A | three `185.230.63.*` (Wix web — replace with Lolipop **after** copy/verify, not before a rollback baseline is saved) |
| www CNAME | `cdn1.wixdns.net.` (Wix web — replace after baseline) |
| MX / TXT / CAA / SPF / DKIM / DMARC | **none today** — still copy if they exist **at switch time** |
| Panel-only records | **unknown** — screenshot Wix DNS first |

NS TTL **86400**: rollback of a nameserver change is slow. Prefer Option A if Lolipop can be targeted without leaving Wix NS.

Registrar is Wix. NS change is a **registrar** action, not only a zone-record edit.

---

## 16. Rollback baseline (restore Wix web)

Use these values to point the **public site** back at Wix. Do not remote-delete hosting as rollback.

### Human-readable

```txt
NS:      ns12.wixdns.net. ns13.wixdns.net.
SOA:     ns12.wixdns.net. support.wix.com. serial 2020010211
APEX A:  185.230.63.107  185.230.63.186  185.230.63.171
APEX AAAA: (none)
WWW:     CNAME cdn1.wixdns.net.
WWW A:   34.149.87.45 (via cdn1 → td-ccm-neg-87-45.wixdns.net.)
MX:      (none observed 2026-08-19)
TXT:     (none observed 2026-08-19)
CAA:     (none observed 2026-08-19)
Wix live: https://www.gosaki-piano.com/  (Pepyaka)
Apex HTTP: 301 → https://www.gosaki-piano.com/
```

### Machine-readable

```json
{
  "phase": "gosaki-pre-cutover-dns-full-record-snapshot",
  "queriedAtUtc": "2026-08-19T06:16:27Z",
  "httpHeadAtUtc": "2026-08-19T06:18:00Z",
  "apex": "gosaki-piano.com",
  "www": "www.gosaki-piano.com",
  "registrar": "Wix.com Ltd.",
  "dnssec": "unsigned",
  "ns": ["ns12.wixdns.net.", "ns13.wixdns.net."],
  "nsTtlAuthoritative": 86400,
  "soa": {
    "mname": "ns12.wixdns.net.",
    "rname": "support.wix.com.",
    "serial": 2020010211,
    "refresh": 10800,
    "retry": 3600,
    "expire": 1209600,
    "minimum": 3600
  },
  "apexA": ["185.230.63.107", "185.230.63.186", "185.230.63.171"],
  "apexAaaa": [],
  "apexCname": [],
  "apexMx": [],
  "apexTxt": [],
  "apexCaa": [],
  "wwwCname": "cdn1.wixdns.net.",
  "wwwAChain": [
    "www.gosaki-piano.com. CNAME cdn1.wixdns.net.",
    "cdn1.wixdns.net. CNAME td-ccm-neg-87-45.wixdns.net.",
    "td-ccm-neg-87-45.wixdns.net. A 34.149.87.45"
  ],
  "spf": null,
  "dkim": { "selector": "UNKNOWN", "observed": false },
  "dmarc": null,
  "mailHostnameObserved": false,
  "vsSnapshot2026_08_18": "NO_MATERIAL_CHANGE"
}
```

---

## 17. Findings

### PUBLIC_CUTOVER_BLOCKER

**None from this snapshot.** DNS still on Wix is planned. Empty MX/TXT is not a publication HTML blocker.

### DO_BEFORE_CUTOVER

1. Re-query NS / SOA / A / AAAA / CNAME / MX / TXT / CAA / `_dmarc` immediately before any DNS edit.
2. Screenshot Wix DNS editor (catch records not in public DNS).
3. If Option B: transplant required records onto the new DNS and verify **before** NS change (`STOP` gate in §15).
4. Confirm Lolipop **actual** web targets from the panel (do not guess).

### OPERATOR_GATE

- `EMAIL_USAGE: OPERATOR_CONFIRMATION_REQUIRED` (no public MX ≠ unused).
- Option A vs B: whether Wix NS can point apex/www at Lolipop.
- Lolipop SSL / unique-domain mapping (inherited from final operator gates; not re-audited here).
- Client production signoff (inherited).

### NON_BLOCKING

- No SPF / DKIM / DMARC / CAA / DNSSEC.
- NXDOMAIN on common mail/extra hostnames.
- Cached TTL remaining ≠ 2026-08-18 remaining (not a zone change).
- SOA serial unchanged.

### NO_ACTION

- Leave NS / A / CNAME on Wix until an explicit cutover packet.
- Do not treat this snapshot as permission to change DNS.
- Package regeneration is **not** next.

---

## 18. Next

```txt
RECOMMENDED_NEXT_PRIMARY: gosaki-contact-hubspot-production-domain-readiness-audit
PACKAGE_REGEN_THIS_PHASE: false
DNS_CHANGE_THIS_PHASE: false
```

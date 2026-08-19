# Gosaki Contact HubSpot production-domain readiness audit

Phase: `gosaki-contact-hubspot-production-domain-readiness-audit`
Date: 2026-08-19
HEAD: `fb6c567e2bf24a3f1b512edb12c02410a0d35f4f`

```txt
HUBSPOT_READINESS_AUDIT_RESULT: COMPLETE
CONTACT_SUBMISSION_EXECUTED: false
HUBSPOT_MUTATION_EXECUTED: false
PACKAGE_GENERATE_EXECUTED: false
SOURCE_FIX_REQUIRED: false
PUBLIC_CUTOVER_BLOCKER_FROM_HUBSPOT: false
READY_TO_WAIT_FOR_LOLIPOP_ADMIN: true
RECOMMENDED_NEXT_PRIMARY: gosaki-pre-cutover-residual-final-audit
```

## Scope / safety

Read-only: repo inspection · HTTP GET · production `--dry-run` (plan only) · temp render of embed HTML.

**Not executed:** form submit · HubSpot panel/API writes · source change · package 本生成 · FTP · DNS/SSL · DB · Secret/Edge · commit/push.

---

## 1. Implementation path (facts)

| Step | Location |
| --- | --- |
| Config | `config/sites/gosaki-piano-contact-hubspot.json` |
| Convert hook | `applyPostGenerate` → `applyGosakiContactHubspotEmbed` when CMS feature `contact` is true (Gosaki default **on**, all profiles) |
| Page source | convert `src/pages/contact/index.astro` (Wix crawl → Astro) |
| Replace target | Wix `#comp-jqbwo704` → `#gosaki-contact-hubspot-embed` |
| Core render | exact ID gate → `mapGosakiContactHubspotConfigToCore` → `renderHubspotConfigHtml` |

**Embed way:** HubSpot **Forms embed v3** (not a Kit-owned `<form action>`).

Static markup (identical for staging / ciao-preview / production env):

```html
<script is:inline src="https://js.hsforms.net/forms/embed/21392032.js" defer></script>
<div class="hs-form-frame" data-region="na1" data-form-id="57909d0c-9b9f-470a-8a18-e176d1d1a459" data-portal-id="21392032"></div>
```

| Item | Value |
| --- | --- |
| portalId | `21392032` |
| formId | `57909d0c-9b9f-470a-8a18-e176d1d1a459` |
| region (HTML) | `na1` |
| script | `https://js.hsforms.net/forms/embed/21392032.js` |
| Submit target in HTML | **none** (`action=` absent). Runtime iframe/POST is HubSpot JS. |
| Success / error UI | HubSpot iframe (not Kit). Historical success copy below. |
| CORS / origin in repo | **none**. No Kit fetch to HubSpot. |
| Captcha / consent in repo | **none**. Historical iframe: captcha **absent**, consent checkbox **absent**. |
| Cookie | HubSpot embed may set third-party cookies at runtime. Kit does not emit `hs-analytics` / `hs-scripts`. |

`GOSAKI_CONTACT_HUBSPOT_CORE_ENVIRONMENT` is hardcoded `"staging"` on the **apply** path. Temp render: staging HTML **===** production HTML **===** legacy builder. The constant is a Core envelope tag, **not** a URL and **not** in page HTML.

Wix leftover `#comp-kei80gar` (old “メッセージを送信しました”) is CSS-hidden (G-8f). It is not HubSpot success.

Live **www** Contact is still **Wix** `#comp-jqbwo704` (no HubSpot). After cutover, this HubSpot embed appears on `www.gosaki-piano.com` for the first time.

---

## 2. Staging E2E (do not equate with www)

Target: `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/`

| Check | G-20s2 / G-20s2b (2026-07-09) | G-20u39a2 (2026-07-16) |
| --- | --- | --- |
| Actual submit | **yes** (operator ×1) | **yes** (operator ×1) |
| portalId / formId | match config | match config |
| HTTP POST status in repo | **not captured** | **not captured** |
| HubSpot reached | **yes** (notification email + payload) | **yes** (operator in HubSpot) |
| Validation | 名* + Eメール* required | same formId |
| Success UI | 「フォームの送信」then 「ありがとうございました。後ほどご連絡差し上げます。」 | success (wording not re-quoted) |
| Error UI | none; `domainAllowlistErrorObserved: false` | none reported |
| Captcha | absent | not re-opened (same formId) |

```txt
STAGING_SUBMIT_PASS: true
STAGING_PASS_IMPLIES_WWW_PASS: false
```

Core renderer switch (2026-08-01) is **after** those submits. Markup is byte-equal to the legacy builder; display was re-checked; **submit was not re-run**. That is not a production-domain proof gap by itself.

---

## 3. Production domain dependency

| Surface | Verdict |
| --- | --- |
| Form markup / loader URL | **DOMAIN_INDEPENDENT** |
| Form submission (HubSpot JS) | **DOMAIN_INDEPENDENT** in repo; HubSpot may still filter by page origin |
| Allowed domain / origin | **UNKNOWN_REQUIRES_HUBSPOT_PANEL** |
| Tracking / analytics script | **DOMAIN_INDEPENDENT** (not in Kit HTML) |
| Cookie | runtime HubSpot; not hardcoded. Banner/consent **UNKNOWN** if they add one |
| Captcha | historically absent; **UNKNOWN_REQUIRES_HUBSPOT_PANEL** if settings changed |
| Consent checkbox | historically absent |
| Redirect after submit | **UNKNOWN_REQUIRES_HUBSPOT_PANEL** (historical = **inline** thank-you, not a Kit redirect) |
| Embedded resource | `js.hsforms.net` absolute — **DOMAIN_INDEPENDENT** |
| CSP | **none** on ciao Apache GET or in Contact HTML. Lolipop CSP later would be a new fact |

Public form-definition GET (no submit) returned **400** after 307 to `forms-na2.hsforms.com`. Allowlist cannot be read from public DNS/HTTP. Do not infer restriction from HubSpot product marketing.

---

## 4. Hard-coded hosts

| Kind | Contact embed / config | SEO (profile) |
| --- | --- | --- |
| Staging `weblike.jp` | **none** | staging profile canonical/og only |
| Preview `ciao.jp` | **none** | ciao-preview profile only |
| Production `www.gosaki-piano.com` | **none** in HubSpot JSON/HTML | production profile canonical/og |

---

## 5. ciao.jp preview (read-only GET)

`https://gotosaki.ciao.jp/gosaki-piano/contact/` → **200** (Apache, no CSP header).

| Check | Result |
| --- | --- |
| `#gosaki-contact-hubspot-embed` / `.hs-form-frame` | present |
| portalId / formId / region / script | match config |
| `#comp-jqbwo704` | absent |
| `action=` | absent |
| Runtime iframe in static HTML | absent (JS injects) |
| weblike leak | **none** |
| production host in Contact HTML | **none** |
| canonical / og:url | `https://gotosaki.ciao.jp/gosaki-piano/contact/` |
| robots | `noindex,nofollow,noarchive` (preview — expected) |
| Loader `js.hsforms.net/.../21392032.js` | **200** |
| JS errors | **not** provable from static HTML |

Preview package is **stale vs HEAD** for Sept/Home hide. Contact HubSpot embed is already on the live preview page.

---

## 6. Production profile / dry-run

`npm run build:gosaki:production:dry-run` → **DRY-RUN PASS** (no convert).

| Item | Value |
| --- | --- |
| origin / baseUrl | `https://www.gosaki-piano.com` |
| publicUrl | `https://www.gosaki-piano.com/` |
| deployBase | `/` |
| Admin | **false** |
| Contact feature | **on** (same hook) |
| Embed HTML (temp render) | identical to staging |
| Submit-after navigation in Kit | **none** |

Existing **stale** local production `contact/index.html` (not a cutover artifact): canonical/og `https://www.gosaki-piano.com/contact/`, HubSpot embed present, **no** weblike/ciao, **no** noindex. Do **not** ship this tree; facts match the profile rules.

---

## 7. HubSpot panel — only what this implementation needs

**Look (before public DNS cutover):**

1. This form’s **domain / share restriction**: unrestricted, **or** `www.gosaki-piano.com` (and apex if used) allowed. Staging weblike success only proves weblike was allowed or unrestricted.
2. **After submit:** inline thank-you (matches historical JP copy) **or** redirect URL that is **not** weblike/ciao.

**Do not add as busywork:** tracking domain (Kit does not inject HS tracking), CSP allowlist (no CSP today), notification mail (already proven on same formId), consent copy.

Optional glance: captcha still off (same form). If captcha appears with domain-locked keys, treat as a new gate.

---

## 8. Findings

### PUBLIC_CUTOVER_BLOCKER

**None.** No concrete evidence that www submit will fail. “Not confirmed in HubSpot panel” is not auto-blocker.

### DO_BEFORE_CUTOVER

- Panel: form domain restriction vs `www.gosaki-piano.com`
- Panel: thank-you vs redirect target

### OPERATOR_GATE / OPERATOR_CONFIRMATION_REQUIRED

- The two items above
- Optional: captcha still off

### POST_LAUNCH

- One operator smoke submit from live www (after DNS). Not a source fix. Do not treat missing www submit as a blocker today.

### NON_BLOCKING

- Core apply `environment: staging` constant (HTML unchanged)
- Submit E2E not re-run after Core switch (markup byte-eq)
- Public form JSON 400 / `na1` HTML vs `forms-na2` redirect
- HubSpot free branding / historical spam-class on staging tests
- Preview package stale for other content

### NO_ACTION

- Do not change Contact source for this audit
- Do not regenerate packages this phase
- Do not submit the form

```txt
SOURCE_FIX_REQUIRED: false
READY_TO_WAIT_FOR_LOLIPOP_ADMIN: true
```

Lolipop SSL/host work can proceed in parallel. Do **not** point public DNS at Lolipop until the two HubSpot panel items are confirmed (or explicitly accepted as unrestricted).

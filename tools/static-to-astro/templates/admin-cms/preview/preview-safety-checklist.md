# Admin Prototype Preview — Safety Checklist

Use this checklist **before** showing an Admin CMS prototype to a customer, stakeholder, or non-developer reviewer.

**Current default:** all registered prototypes have `customerDemoReady: false` until G-5u+ local preview harness is approved.

---

## Scaffold-only display

- [ ] The screen clearly states **scaffold only** / **not connected to runtime**
- [ ] `productionReady: false` is documented and visible to presenters
- [ ] `connectedToRuntime: false` is documented and visible to presenters
- [ ] Presenter can explain: **this is an admin UI image, not the finished product**

---

## Runtime / backend (must remain off until explicit approval)

- [ ] **Supabase Auth** — not connected
- [ ] **Supabase query** — not performed
- [ ] **DB create / DB update** — not performed
- [ ] **Storage upload** — not performed
- [ ] **Publish dispatch** (GitHub Actions) — not performed
- [ ] **Edge Function call** — not performed
- [ ] **FTP deploy** — not performed
- [ ] **Production** — disabled / not touched

---

## Staging vs production (avoid misunderstanding)

- [ ] Presenter can explain **Staging** (preview / QA) vs **Production** (live public site)
- [ ] Customer will not confuse prototype URL with the live production URL
- [ ] Production publish buttons are disabled or clearly labeled as non-functional
- [ ] No action in the demo can affect the live site

---

## Mock data / sample data

- [ ] All content is labeled as **sample / mock data** where appropriate
- [ ] No real customer PII, credentials, or production URLs in the demo
- [ ] Images are placeholders or licensed demo assets only
- [ ] Email addresses shown are clearly fake (e.g. `admin@example.com`)

---

## Customer communication

- [ ] Customer understands: **operations do not save to a real database**
- [ ] Customer understands: **publish buttons do not deploy**
- [ ] Customer understands: **this is for layout and workflow review**
- [ ] [Customer admin manual](../../../docs/customer-admin-manual-musician-basic.md) shared only with scaffold disclaimer
- [ ] [Quick checklist](../../../docs/customer-admin-quick-checklist-musician-basic.md) reviewed if discussing operations

---

## Local preview enabled (G-5u)

If using [local-only preview route](../../../docs/local-only-admin-preview-route.md):

- [ ] `ENABLE_ADMIN_PREVIEW=true` only on local dev machine
- [ ] `import.meta.env.DEV` is true (not production build)
- [ ] URL is `/__admin-preview/musician-basic/` — **not** `/admin/`
- [ ] Sticky scaffold-only banner visible
- [ ] Presenter explains mock data and disabled buttons

## Before enabling local preview (G-5u+)

- [ ] Explicit approval recorded for local-only Astro preview route
- [ ] Preview runs on localhost or isolated sandbox — not production hosting
- [ ] `src/pages/admin/` on Sariswing production is **not** used for the demo
- [ ] No secrets in preview config or committed files
- [ ] Design QA on desktop and mobile completed

---

## Manifest verification

Run read-only inspect before the session:

```bash
node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
```

Confirm for each prototype:

- `customerDemoReady: false` (until checklist + G-5u complete)
- All safety flags remain `false`
- `productionTouched: false`

---

*G-5r: safety checklist. No runtime connection.*

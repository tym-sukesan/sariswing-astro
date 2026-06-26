# G-11c15 — Gosaki YouTube URL save staging public verification

**Phase:** `G-11c15-gosaki-youtube-url-save-staging-public-verification`  
**Status:** verification complete  
**Base commit:** `213c834`  
**Prior:** G-11c14 operator manual upload (`gosaki-youtube-url-save-staging-manual-upload-execution-result.md`)  
**Verified at (UTC):** `2026-06-26` (read-only HTTP fetch)

## Summary

Read-only HTTP verification of Gosaki staging after G-11c14 upload. Home serves new YouTube embed `I-eY9YMq9GI`; old `Ke4F8JAQz-I` absent from home HTML. Spot-check routes HTTP 200.

**No FTP / upload / deploy / workflow_dispatch / Save / DB write in this phase.**

---

## 1. Target URL

| Item | Value |
|------|-------|
| **Staging base** | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| **Scope** | Gosaki CMS Kit staging only — **not** Sariswing production |

---

## 2. Home verification

| Check | Result |
|-------|--------|
| HTTP status | **200** |
| New embed `youtube-nocookie.com/embed/I-eY9YMq9GI` | **present** |
| Old `Ke4F8JAQz-I` in home HTML | **absent** |
| YouTube iframe rendered | **yes** — `class="gosaki-youtube-embed__iframe"` |
| `published=true` reflection | **reasonable** — nocookie iframe on home only |
| `noindex` meta | **present** |
| Canonical / staging host | **uses** `yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |

### Home iframe (observed)

```html
<iframe class="gosaki-youtube-embed__iframe"
  src="https://www.youtube-nocookie.com/embed/I-eY9YMq9GI"
  title="Gosaki Piano YouTube video" loading="lazy" ...>
```

---

## 3. Spot-check routes (read-only)

| Route | HTTP |
|-------|------|
| `/` (home) | 200 |
| `/about/` | 200 |
| `/contact/` | 200 |
| `/schedule/` | 200 |
| `/admin/` | 200 |
| `/robots.txt` | 200 |

No major breakage detected in sampled routes. Visual QA (mobile layout, player playback) remains optional operator follow-up.

---

## 4. Chain complete (G-11c8 → G-11c15)

```txt
G-11c8  workflow JSON patch implementation
G-11c10c workflow dispatch → JSON embedCode I-eY9YMq9GI
G-11c11 local convert + build reflection
G-11c12 static-public + manual-upload package (27 files)
G-11c13 upload preflight
G-11c14 operator manual upload
G-11c15 staging public verification ← this phase
```

---

## 5. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `stagingPublicVerificationComplete` | **true** |
| `ftpUploadExecuted` | **false** |
| `cursorFtpUploadExecuted` | **false** |
| `deployExecuted` | **false** |
| `workflowDispatchExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `cursorJsonWriteExecuted` | **false** |
| `supabaseSecretsSetExecuted` | **false** |
| `productionTouched` | **false** |

---

## 6. Verifier

```bash
node tools/static-to-astro/scripts/verify-g11c15-gosaki-youtube-url-save-staging-public-verification.mjs
```

---

## 7. Next (optional)

- Share staging URL with gosaki client for preview feedback
- Resume Schedule CMS slices (G-6-g3+) or other Gosaki CMS work per backlog
- No further upload required for this YouTube URL change unless JSON changes again

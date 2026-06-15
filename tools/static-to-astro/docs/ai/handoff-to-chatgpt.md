Paste this file at the start of a new ChatGPT thread. Cursor should update it after every meaningful task.

---

## 1. Project summary

- **Project name:** Static-to-Astro CMS / Musician CMS Kit
- **Repository:** sariswing-astro

---

## 2. Current phase

```txt
Current phase: G-7f1-ftp-deploy-safety-hardening (complete)
Previous incident: G-7f FTP root mirror delete (suspected)
All FTP apply: SUSPENDED until operator re-approval
```

---

## 3. Current state summary

G-7f FTP accident: `deploy-public-dist-ftp.mjs --apply` likely ran `mirror --delete` at login root after `cd` failure. G-7f1 hardening: fail-fast lftp, pwd verification, delete off by default, safety verifier required for apply.

Docs: `tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md`

**Do not run FTP apply.** `readyForAnyFutureFtpApply: false`

---

## 4. G-7f1 gates

```txt
ftpDeploySafetyHardeningComplete: true
ftpDeployApplyBlockedUntilSafetyPatch: true
deleteByDefaultDisabled: true
readyForAnyFutureFtpApply: false
ftpRootMirrorIncidentSuspected: true
```

---

## 5. G-7e highlights (unchanged)

```txt
Canonical: https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/ (no duplicate path)
Nav Home: withBase('/') — no www.gosaki-piano.com in nav
prepare-public: PASS
safeForStaticFtp: true
stagingPreviewOk: true
Upload plan: output/deploy/gosaki-piano/staging-upload-plan.md (gitignored)
Re-crawl: NOT executed
FTP apply: NOT executed
```

---

## 5. Gate state

```txt
gosakiLiveCrawlPilotComplete: true
gosakiStagingPreviewPreparationComplete: true
gosakiStagingUploadAttemptedInG7f: true
ftpRootMirrorIncidentSuspected: true
ftpDeploySafetyHardeningComplete: true
ftpDeployApplyBlockedUntilSafetyPatch: true
deleteByDefaultDisabled: true
readyForAnyFutureFtpApply: false
readyForG7gGosakiBrowserQaAndClientReview: false
```

---

## 6. Files to read first

```txt
tools/static-to-astro/docs/gosaki-staging-preview-preparation.md
tools/static-to-astro/docs/gosaki-live-route-static-public-compatibility-fix.md
tools/static-to-astro/scripts/lib/deploy-base.mjs
tools/static-to-astro/scripts/lib/path-transform.mjs
tools/static-to-astro/config/sites/gosaki-piano.url-to-staging.json
tools/static-to-astro/docs/ai/00-current-state.md
```

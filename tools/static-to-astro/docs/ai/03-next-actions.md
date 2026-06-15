Last updated: 2026-06-15
Project: Static-to-Astro CMS / Musician CMS Kit

## 1. Immediate priority

**Current phase:** `G-7f1-ftp-deploy-safety-hardening` (complete — **no FTP apply**)

**Incident doc:** `tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md`

**All FTP `--apply` suspended** until operator re-approval after recovery + new preflight.

### Gates

```txt
ftpDeploySafetyHardeningComplete: true
ftpDeployApplyBlockedUntilSafetyPatch: true
deleteByDefaultDisabled: true
readyForAnyFutureFtpApply: false
gosakiStagingUploadAttemptedInG7f: true
ftpRootMirrorIncidentSuspected: true
readyForG7gGosakiBrowserQaAndClientReview: false
```

## 2. G-7f1 changes (local code only)

- `ftp-remote-dir-safety.mjs` — remote dir blocklist + staging path rules
- `public-dist-ftp-deployer.mjs` — fail-fast lftp, preflight pwd, no delete by default
- `deploy-public-dist-ftp.mjs` — `--allow-delete`, `--legacy-cleanup`, safety verifier required for apply
- `verify-public-dist-ftp-deployer-safety.mjs` — static tests (no FTP)
- `AGENTS.md` — Destructive Operation Safety Rules

## 3. Before any future FTP apply

1. Operator recovery / evidence preserved
2. `npm run verify:ftp-deployer-safety` PASS
3. `verify-staging-ftp-safety.mjs` PASS → `--safety-report`
4. Explicit approval phrase
5. **Do not use `--allow-delete`** unless separately approved

## 4. AI workflow maintenance rule

Update `tools/static-to-astro/docs/ai/*` after every meaningful Cursor task.

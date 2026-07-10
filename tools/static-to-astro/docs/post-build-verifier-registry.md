# G-20u17 — Post-build verifier registry

**Phase:** `G-20u17-post-build-verifier-registry`  
**Base:** `34ada59` (G-20u18 committed)  
**Scope:** Resolve post-build verifier scripts from `config/sites/registry.json` instead of a hardcoded map in build core.

## Problem

Before G-20u17, `build-site-package-core.mjs` held a `POST_BUILD_VERIFIERS` map keyed by `siteKey` + profile. Adding a second site required editing build core.

## Solution

1. **Registry field** — each `packageProfiles.{profile}.postBuildVerifier` object:

```json
"postBuildVerifier": {
  "script": "scripts/verify-site-package.mjs",
  "argsMode": "site-package"
}
```

2. **Resolver module** — `scripts/lib/post-build-verifier-registry.mjs`
   - `resolvePostBuildVerifierConfig(siteKey, profileName)`
   - `resolvePostBuildVerifier(siteKey, profileName)` — script path only
   - `buildPostBuildVerifierArgs(siteKey, profileName, profile)` — CLI argv for `runSitePackageBuild`

3. **Build core** — imports and re-exports from the registry module; no inline map.

## `argsMode` values

| Mode | CLI args appended | Used by |
| --- | --- | --- |
| `site-package` | `--site`, `--profile`, `--package-dir` | `pilot-sample-static` staging |
| `package-dir-only` | `--package-dir` only | `gosaki-piano` staging (legacy Gosaki verifier) |
| `none` | script path only | `gosaki-piano` production (`verify-g20i3-*` has hardcoded paths) |

## Current registry entries

| Site | Profile | Script | argsMode |
| --- | --- | --- | --- |
| `gosaki-piano` | staging | `verify-manual-upload-package.mjs` | `package-dir-only` |
| `gosaki-piano` | production | `verify-g20i3-gosaki-production-package-admin-exclusion.mjs` | `none` |
| `pilot-sample-static` | staging | `verify-site-package.mjs` | `site-package` |

## Adding a new site

1. Register the site in `config/sites/registry.json` under `sites.{siteKey}`.
2. For each build profile (`staging`, `production`, …), add `postBuildVerifier` inside `packageProfiles.{profile}`:
   - `script` — path under `tools/static-to-astro/scripts/*.mjs` (must exist on disk)
   - `argsMode` — one of `site-package`, `package-dir-only`, `none`
3. Prefer `site-package` + `verify-site-package.mjs` for generic sites.
4. Use site-specific verifier scripts only when generic checks are insufficient (Gosaki month content, production admin exclusion, etc.).
5. Run `npm run verify:g20u17-post-build-verifier` and `npm run verify:current-active-regression`.

Example (new static site):

```json
"packageProfiles": {
  "staging": {
    "profileName": "staging",
    "manualUploadOut": "output/manual-upload/my-site",
    "postBuildVerifier": {
      "script": "scripts/verify-site-package.mjs",
      "argsMode": "site-package"
    }
  }
}
```

## Legacy fallback

`LEGACY_POST_BUILD_VERIFIER_FALLBACK` in `post-build-verifier-registry.mjs` mirrors the pre-G-20u17 hardcoded map for `gosaki-piano` and `pilot-sample-static`.

- **Primary path:** registry `postBuildVerifier` (all current sites use this).
- **Fallback:** used only when a profile exists but `postBuildVerifier` is omitted — same scripts/args as before G-20u17.
- **Fail fast:** unknown `siteKey`, missing `packageProfiles.{profile}`, or no registry entry and no fallback → throw before build/verify runs.

Do not rely on fallback for new sites — always set `postBuildVerifier` in the registry.

## Build flow (unchanged behavior)

```
build-site-package.mjs --site SITE --profile PROFILE
  → runSitePackageBuild()
    → convert → static-public → manual-upload package
    → resolvePostBuildVerifierConfig() from registry
    → node <script> <args per argsMode>
```

No FTP, deploy, or DB write in this phase.

## Verifier

```bash
cd tools/static-to-astro
npm run verify:g20u17-post-build-verifier
```

## Related

- G-20u3 build core: `build-site-package-core.mjs`
- G-20u4 verify CLI: `verify-site-package.mjs`
- G-20u16 audit: `remaining-site-specific-coupling-audit.md` (C item resolved by G-20u17)

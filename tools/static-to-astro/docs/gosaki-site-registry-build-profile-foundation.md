# G-20u2 — Site registry & build profile foundation

**Phase:** `G-20u2-site-registry-build-profile-foundation`  
**Status:** **complete** — registry + loader delegation · backward-compatible wrappers retained  
**Date:** 2026-07-09  
**Base commit:** `bdefcf7`  
**Prior:** G-20u1 hardcode audit

| Check | Status |
| --- | --- |
| Site registry | **yes** (`config/sites/registry.json`) |
| Profile loader via registry | **yes** (`scripts/lib/site-registry.mjs`) |
| Gosaki wrapper compatibility | **yes** (`gosaki-package-build-profile.mjs` delegates) |
| MANIFEST registry fields | **yes** (optional `siteKey`, `cmsSiteSlug`, `supabaseSiteSlug`, `packageKey`) |
| FTP / deploy | **not executed** |

---

## Gates

```txt
siteRegistryBuildProfileFoundationComplete: true
phase: G-20u2-site-registry-build-profile-foundation
ftpUploadExecuted: false
deployExecuted: false
cursorDbWriteExecuted: false
gosakiWrapperRemoved: false
```

---

## 1. Purpose

Gosaki 固有に散らばっていた `site_slug` / URL / remote path / package profile を **site registry 経由**で読める土台を追加する。既存の `build-gosaki-*` wrapper と `gosaki-package-build-profile.mjs` は維持し、出力互換を壊さない。

---

## 2. Registry design

**File:** `config/sites/registry.json`  
**Loader:** `scripts/lib/site-registry.mjs`

### Layers

| Layer | Source | Role |
| --- | --- | --- |
| **Registry** | `registry.json` | Slug semantics, package metadata overlay, pointer to deploy profiles |
| **Deploy profiles** | `gosaki-piano.deploy-profiles.json` | Build output paths, SEO flags, Supabase ref (unchanged) |
| **Gosaki wrapper** | `gosaki-package-build-profile.mjs` | Backward-compatible exports → `resolveSitePackageBuildProfile('gosaki-piano', …)` |

### API

| Function | Description |
| --- | --- |
| `loadSiteRegistry()` | Load full registry |
| `getSiteRegistryEntry(siteKey)` | Single site entry |
| `listSiteKeys()` | Registered site keys |
| `resolveSitePackageBuildProfile(siteKey, profileName)` | Merged build + package profile |
| `resolvePackageManifestMetaFromRegistry(siteKey, profileName)` | MANIFEST-oriented subset |
| `loadSiteDeployProfiles(siteKey)` | Deploy JSON via registry pointer |

---

## 3. Slug semantics (Gosaki)

| Field | Value | Meaning |
| --- | --- | --- |
| `siteKey` | `gosaki-piano` | Registry primary key |
| `packageKey` (staging) | `gosaki-piano` | Staging package / zip prefix |
| `packageKey` (production) | `gosaki-piano-production` | Production package output name |
| `filesystemSlug` | `gosaki-piano` | Fixtures, output dirs |
| `cmsSiteSlug` | `gosaki` | Legacy `gosaki.site-config.example.json` alias — **not DB** |
| `supabaseSiteSlug` | `gosaki-piano` | `public.schedules.site_slug` filter — **canonical DB value** |
| `siteSlug` (profile return) | `gosaki-piano` | Backward-compatible alias of `supabaseSiteSlug` |

**DB values are not changed.** `gosaki` vs `gosaki-piano` mismatch is documented in registry `slugMismatchNotes`.

---

## 4. Package profiles (Gosaki)

### Staging

| Field | Value |
| --- | --- |
| `targetEnvironment` | `staging` |
| `publicBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/` |
| `stagingBaseUrl` | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano` |
| `deployBase` | `/cms-kit-staging/gosaki-piano/` |
| `intendedRemotePath` | `/cms-kit-staging/gosaki-piano/` |
| `includesAdmin` | `true` |
| `manualUploadOut` | `output/manual-upload/gosaki-piano` |

### Production

| Field | Value |
| --- | --- |
| `targetEnvironment` | `production` |
| `publicBaseUrl` | `https://www.gosaki-piano.com/` |
| `deployBase` | `/` |
| `intendedRemotePath` | `TBD_G-20i` (upload blocked) |
| `includesAdmin` | `false` |
| `manualUploadOut` | `output/manual-upload/gosaki-piano-production` |

---

## 5. MANIFEST fields (G-20u2 additions)

Existing G-20t3 fields unchanged. Optional registry fields added:

- `siteKey`
- `cmsSiteSlug`
- `supabaseSiteSlug`
- `packageKey`

Populated when `create-manual-upload-package.mjs` is run with `--site-key gosaki-piano`. Existing npm scripts (explicit CLI args) remain compatible; registry fields appear when `--site-key` is used.

---

## 6. Backward compatibility

| Item | Status |
| --- | --- |
| `resolveGosakiPackageBuildProfile` | Delegates to registry — same critical fields |
| `loadGosakiDeployProfiles` | Via registry pointer |
| `build-gosaki-staging-admin-package.mjs` | Unchanged |
| `build-gosaki-production-package.mjs` | Unchanged |
| `package.json` npm scripts | Unchanged |
| Gosaki path guards | Retained for `siteKey === gosaki-piano` |

---

## 7. Not executed

| Item | Status |
| --- | --- |
| FTP / deploy | **no** |
| DB write | **no** |
| Wrapper removal / large rename | **no** |
| Package regen (optional) | **skipped** — existing packages remain freshness STOP |

---

## 8. Verifier

```bash
node tools/static-to-astro/scripts/verify-g20u2-site-registry-build-profile-foundation.mjs
```

---

## 9. Next

| Phase | Scope |
| --- | --- |
| **G-20u3** | `build-site-package.mjs --site --profile` generic CLI |
| **G-20u4** | `verify-site-package.mjs` parameterized |
| **G-20u5** | npm scripts use `--site-key` by default |

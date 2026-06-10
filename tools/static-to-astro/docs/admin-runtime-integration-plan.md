# Admin Runtime Integration Plan

**Phase:** G-5t — runtime integration plan (planning only)  
**Status:** no runtime connection — no files written to `src/pages/admin/`

Related: [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json)

---

## 1. Purpose

G-5t defines how CMS Kit Admin scaffolds (G-5l〜G-5s) will be **safely connected to a real project runtime** in future phases.

This document is a **plan only**. It does not:

- Write runtime admin files
- Connect Supabase Auth, DB, Storage, or Publish
- Deploy to staging or production
- Modify existing Sariswing admin code

Goals:

- Define integration order (local preview → demo → writer → shell → Auth → read → write → media → publish → production)
- Decide when `src/pages/admin/` may be populated (explicit approval only)
- Fix staging vs production separation
- Document approval gates, backup, and rollback
- List operations that must **never** run automatically

---

## 2. Current state

### Completed phases

| Phase | Deliverable |
| --- | --- |
| **G-5l** | Admin UI shell scaffold |
| **G-5m-a** | CRUD primitives + module UI scaffold |
| **G-5m-b** | Auth abstraction scaffold |
| **G-5n** | Media upload abstraction scaffold |
| **G-5o** | Publish workflow abstraction scaffold |
| **G-5p** | musician-basic Admin prototype |
| **G-5q** | Customer admin manual |
| **G-5r** | Prototype preview harness |
| **G-5s** | Site-config driven admin scaffold dry-run generator |

### What we can do today

- Generate Admin configuration **dry-run package** from site config (`generate-admin-scaffold-dry-run.mjs`)
- Produce: sections, required components, permissions, storageMappings, publishPolicy, previewPlan, safetyChecklist
- Customer-facing manual and quick checklist (G-5q)
- Preview manifest and pre-demo safety checklist (G-5r)
- Inspect registries and preview harness (read-only CLIs)

### What we cannot do yet

- Runtime admin routes with live behavior
- Login / session
- Save (DB write)
- Storage upload
- Publish / deploy
- Production deploy or production DB/Storage changes

All scaffolds remain: `productionReady: false`, `connectedToRuntime: false`.

---

## 3. Integration principles

| Principle | Meaning |
| --- | --- |
| **Staging first** | All integration starts on staging URL / staging DB / staging bucket |
| **Production disabled by default** | `production.enabled: false` until G-6e with written approval |
| **Explicit opt-in only** | Each phase requires documented approval; destructive ops need `--apply` |
| **One operation per phase** | Do not combine Auth + write + publish in a single step |
| **No hidden writes** | Every write path must be visible in plan, manifest, and audit log design |
| **No secrets in browser** | Anon key only in client; service role / GitHub token / FTP password server-side only |
| **Service role never in client** | Edge Function, CI, or server adapter only |
| **GitHub token never in client** | Dispatch via server-side adapter |
| **FTP password never in client** | Deploy via CI secrets only |
| **Backup before DB update** | Snapshot or export before first write per module |
| **Rollback plan before publish** | Document how to revert deploy and data |
| **Customer approval before production** | Written OK required for production publish |
| **Rights confirmation before production media** | Owner confirmation before production media goes live |

---

## 4. Recommended integration order

```txt
G-5u  → local-only preview route
G-5v  → customer demo package
G-5w  → explicit opt-in admin scaffold writer
G-5x  → staging runtime shell integration
G-5y  → Supabase Auth staging integration
G-5z  → read-only data integration
G-6a  → CRUD write integration for staging
G-6b  → Media upload staging integration
G-6c  → Publish workflow staging integration
G-6d  → production readiness review
G-6e  → production integration with explicit approval
```

**Order rationale:** preview → demo → writer → UI shell → Auth → read → write → media → staging publish → production review → production.

Never skip: local preview and customer demo before runtime shell; read-only before write; staging publish before production.

---

## 5. Phase details

### G-5u: local-only preview route（**完了**）

**Implemented:** [local-only-admin-preview-route.md](../../docs/local-only-admin-preview-route.md)

| Item | Value |
| --- | --- |
| Route | `/__admin-preview/musician-basic/` |
| Gate | `ENABLE_ADMIN_PREVIEW=true` + `import.meta.env.DEV` |
| Default | `ENABLE_ADMIN_PREVIEW=false` |

**Exit criteria:** Prototype renders locally; banner visible; not `/admin/`.

---

### G-5v: customer demo package（**完了**）

**Implemented:** [customer-demo-package-musician-basic/](./customer-demo-package-musician-basic/README.md)

**Purpose:** Package for showing admin UI to customers (not production).

| Allowed | Forbidden |
| --- | --- |
| screenshots / screen recording guide | production publish |
| manual + quick checklist | real customer PII without approval |
| local preview instructions | live production URL as demo |
| mock data clearly labeled | save / upload in demo |

**Contents:** demo-script, demo-checklist, customer-explanation, customer-feedback-form, screenshot-guide, demo-safety-notes, post-demo-next-steps.

**Use with:** G-5u local preview route (`/__admin-preview/musician-basic/`).

**Exit criteria:** Presenter can explain scaffold-only; preview-safety-checklist completed.

---

### G-5w: explicit opt-in admin scaffold writer

**Purpose:** Design writer that copies/generates admin scaffold from dry-run package **only with approval**.

| Allowed | Forbidden |
| --- | --- |
| dry-run by default (no `--apply`) | overwrite existing Sariswing admin |
| explicit output directory | automatic `src/pages/admin/` on production host |
| generated-files manifest | secrets generation in repo |
| backup of target before write | silent overwrite |

**Exit criteria:** Writer spec documented; `--apply` gate defined; manifest format agreed.

---

### G-5x: staging runtime shell integration

**Purpose:** Mount UI shell on **staging-only** admin route; no data layer yet.

| Allowed | Forbidden |
| --- | --- |
| `src/pages/admin/` on **new** CMS Kit project only (not Sariswing prod) | DB write |
| noindex / robots disallow | Storage upload |
| scaffold-only banner | publish dispatch |
| disabled actions | production route |

**When `src/pages/admin/` is OK:** After G-5w approval, on **target customer staging project**, never on Sariswing production without separate plan.

---

### G-5y: Supabase Auth staging integration

**Purpose:** Staging admin login only.

| Allowed | Forbidden |
| --- | --- |
| Supabase Auth on **staging project** | service role in browser |
| anon key + RLS | production auth policy change |
| admin_users / allowlist design | shared prod/staging credentials |
| password reset flow (staging) | bypass RLS in client |

**Exit criteria:** Login works on staging; roles enforced server-side; session check on admin routes.

---

### G-5z: read-only data integration

**Purpose:** Read staging DB only.

| Allowed | Forbidden |
| --- | --- |
| SELECT only | INSERT / UPDATE / DELETE |
| staging DB / staging project | production DB |
| readonly banner in UI | write APIs exposed |

**Exit criteria:** Lists and detail views load from staging; no mutation endpoints.

---

### G-6a: CRUD write integration for staging

**Purpose:** Enable save on staging for one module at a time.

| Allowed | Forbidden |
| --- | --- |
| one module per sub-phase (e.g. News first) | bulk delete |
| backup before module write enabled | production DB write |
| soft delete / restore | destructive migration in same phase |
| audit log design | skip validation |

**Modules (order suggestion):** Profile → Links → News → Schedule → Discography.

---

### G-6b: Media upload staging integration

**Purpose:** Staging Storage upload with review gates.

| Allowed | Forbidden |
| --- | --- |
| assetType-driven paths from schema adapter | production bucket overwrite |
| human review for schedule images | rights-unknown → production |
| rights confirmation UI (staging) | client-side service role |
| resize / WebP pipeline (staging) | skip review for production-bound assets |

**Asset types (musician-basic):** `discography_cover`, `schedule_home`, `schedule_flyer`; future: `profile_image`.

---

### G-6c: Publish workflow staging integration

**Purpose:** Staging site publish only.

| Allowed | Forbidden |
| --- | --- |
| server-side GitHub dispatch or Edge wrapper | token in browser |
| staging workflow only | production publish |
| explicit approval gate | FTP from browser |
| noindex enforcement post-deploy | disable staging noindex |

---

### G-6d: production readiness review

**Purpose:** Gate before any production integration.

**Required:**

- Customer written approval
- Media rights confirmation complete
- Rollback plan documented
- SEO / canonical / OGP reviewed for production URL
- Domain / server / FTP targets verified
- Backup of DB and public artifacts

No production changes in this phase — review only.

---

### G-6e: production integration with explicit approval

**Purpose:** First allowed production publish and production DB/Storage (if approved).

**Conditions:**

- Written customer approval on file
- admin role + production readiness gate passed
- Environment separation verified (separate workflows, secrets, URLs)
- Rollback plan tested on staging
- Audit logging enabled

Production remains **opt-in per site**; never default-on.

---

## 6. Runtime architecture plan

| Layer | Role |
| --- | --- |
| `templates/admin-cms/` | Source scaffold (CMS Kit); not runtime |
| Generated runtime | Project `src/pages/admin/`, `src/components/admin/`, etc. |
| Site config | Enabled modules, deploy URLs, staging flags |
| Template registry | Pages and content models per template |
| Schema adapter | Tables, columns, storageMappings |
| Admin components registry | Available UI components and scaffold status |
| Permissions model | admin / editor / viewer per module |
| Publish policy | staging vs production, approval requirements |
| Preview manifest | Demo readiness (`customerDemoReady`) |

**Recommended runtime layout (future — not created in G-5t):**

```txt
src/pages/admin/
src/components/admin/
src/lib/admin/
src/lib/admin/adapters/
src/lib/admin/permissions/
src/lib/admin/publish/
src/lib/admin/media/
```

Dry-run package from G-5s informs which sections and components each site needs before any writer runs.

---

## 7. Auth integration plan

| Topic | Plan |
| --- | --- |
| Provider | Supabase Auth (staging project first) |
| Roles | admin, editor, viewer |
| Identity | admin_users table or email allowlist + RLS |
| Client | anon key only; session from Supabase client |
| Server | service role only in Edge Function / CI / server routes |
| Password reset | Supabase reset flow; documented in customer manual |
| Session check | Middleware or layout guard on `/admin/*` |
| Role check | Module-level permissions from `admin-permissions.generated.json` |
| Module permissions | Enforce read/create/update/delete/upload/publish per role |

**G-5t:** not implemented. **Sariswing production auth:** not modified.

---

## 8. CRUD integration plan

| Step | Approach |
| --- | --- |
| 1 | Read-only lists (G-5z) |
| 2 | Single-module write on staging (G-6a) |
| 3 | Soft delete + restore before hard delete |
| 4 | Duplicate where supported (Schedule) |
| 5 | Publish toggle per row |
| 6 | Validation aligned with schema adapter columns |
| 7 | Audit log (who, when, what changed) |
| 8 | Backup before enabling write per module |

**Modules:** Profile, Schedule, Discography, Links, News.

---

## 9. Media integration plan

| Topic | Plan |
| --- | --- |
| Mapping source | Schema adapter `storageMappings` |
| Upload | assetType → targetTable.targetColumn |
| Bucket | Staging bucket first; path `{siteSlug}/...` |
| Formats | JPEG, PNG, WebP; long-side resize (~1600px) |
| Review | humanReviewRequired for schedule images |
| Rights | staging-only default; owner confirmation before production |
| Block | production use when rights unknown or review pending |

**Asset types (musician-basic):** `discography_cover`, `schedule_home`, `schedule_flyer`; future: profile image field.

---

## 10. Publish integration plan

| Topic | Plan |
| --- | --- |
| Order | Staging publish (G-6c) before production (G-6e) |
| Default | `productionEnabled: false` |
| Dispatch | GitHub Actions via server-side adapter only |
| Edge | Optional Edge Function wrapper for token isolation |
| Client | Publish button triggers server route — no token in browser |
| Status | Deploy status polling (later phase) |
| Audit | Publish history persisted |
| Rollback | Document revert deploy + content rollback |
| Staging SEO | noindex, robots Disallow |
| Production SEO | canonical / OGP on production URL only |

---

## 11. Environment separation

| Item | Staging | Production |
| --- | --- | --- |
| URL | Staging host / path (e.g. `/cms-kit-staging/{siteSlug}/`) | Customer production domain |
| noindex | **Yes** (required) | No (public index unless opted out) |
| robots | Disallow all (typical) | Allow (site policy) |
| canonical | Staging URL or omitted | Production base URL |
| Publish permission | admin + staging gate | admin + customer approval + readiness gate |
| Customer approval | Not required for staging publish | **Required** |
| Rights confirmation | Required before media visible | **Required** before go-live |
| Rollback plan | Recommended | **Required** |
| Deploy target | Staging FTP / staging workflow | Production FTP / prod workflow |
| Allowed by default | **Yes** (for integration work) | **No** |

---

## 12. Forbidden automation list

These must **never** run without explicit human approval and documented gate:

- Production publish
- Production DB write
- Production Storage overwrite
- GitHub Actions dispatch (without approval record)
- FTP deploy (without approval record)
- Domain / DNS change
- Delete production data
- Expose secrets to browser (service role, GitHub token, FTP password)
- Overwrite existing Sariswing admin code
- Disable noindex on staging
- Set production canonical URL on staging site
- Auto-enable `production.enabled` in site config
- Bulk destructive SQL
- Skip backup before first write

See also [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json) → `forbiddenAutomation`.

---

## 13. Approval gates

| Gate | Phase | Required reviewer | Requires `--apply` |
| --- | --- | --- | --- |
| Scaffold generation | G-5w | Maintainer | Yes |
| Runtime route creation | G-5x | Maintainer | Yes |
| Auth integration | G-5y | Maintainer + security | Yes |
| DB read | G-5z | Maintainer | Yes |
| DB write | G-6a | Maintainer | Yes |
| Storage upload | G-6b | Maintainer | Yes |
| Staging publish | G-6c | Admin | Yes |
| Production readiness | G-6d | Maintainer + customer | No (review doc) |
| Production publish | G-6e | Admin + customer written OK | Yes |

Each gate should record: **required evidence**, **rollback requirement**, and **command flag** (`--apply` or equivalent).

Machine-readable gates: [admin-runtime-integration-gates.json](../config/admin/admin-runtime-integration-gates.json).

---

## 14. Rollback / backup plan

| Asset | Before action | Rollback approach |
| --- | --- | --- |
| Generated admin files | Git branch / commit before G-5w `--apply` | Revert commit; restore from manifest |
| Dry-run / generation package | Keep in `output/` (not committed) | Regenerate from site config |
| DB | Backup / export before G-6a per module | Restore snapshot; soft-delete restore |
| Storage | Upload manifest per asset | Delete object; restore previous URL in DB |
| Deploy | Deploy manifest + previous artifact hash | Re-run previous workflow; FTP mirror restore |
| Public dist | Backup previous static build | Redeploy previous artifact |
| Documentation | Rollback runbook in repo | Follow runbook step-by-step |

Every `--apply` phase should append to an audit log: who, when, gate id, site slug, artifact paths.

---

## 15. Runtime integration checklist

Use before advancing to the next phase:

- [ ] Previous phase exit criteria met
- [ ] Approval gate signed off (see §13)
- [ ] Dry-run or plan artifact reviewed
- [ ] `productionReady: false` unless G-6e complete
- [ ] `connectedToRuntime` documented per phase
- [ ] Staging noindex still enforced (until production go-live)
- [ ] No secrets in client bundle (scan / review)
- [ ] Sariswing production admin untouched
- [ ] Customer manual disclaimer still accurate
- [ ] Rollback steps documented
- [ ] `git grep` secret scan clean before commit

Generated per site (G-5s): `admin-safety-checklist.generated.md` in dry-run package.

---

## 16. Future phase map

| Phase | Focus |
| --- | --- |
| **G-5t（完了）** | Runtime integration plan (this doc) |
| **G-5u（完了）** | [Local-only preview route](./local-only-admin-preview-route.md) — `/__admin-preview/musician-basic/` |
| **G-5v（完了）** | [Customer demo package](./customer-demo-package-musician-basic/README.md) |
| **G-5w** | Explicit opt-in admin scaffold writer |
| **G-5x** | Staging runtime shell integration |
| **G-5y** | Supabase Auth staging integration |
| **G-5z** | Read-only data integration |
| **G-6a** | CRUD write (staging) |
| **G-6b** | Media upload (staging) |
| **G-6c** | Publish workflow (staging) |
| **G-6d** | Production readiness review |
| **G-6e** | Production integration (explicit approval) |

---

## 17. Safety statement

```txt
G-5t is a planning phase only.
No runtime files are written.
No auth is connected.
No database is queried or updated.
No storage upload is performed.
No GitHub dispatch is performed.
No FTP deploy is performed.
No production environment is touched.
```

| Flag | G-5t value |
| --- | --- |
| `connectedToRuntime` | **false** |
| `productionReady` | **false** |
| `runtimeFilesWritten` | **false** |
| Existing Sariswing admin modified | **false** |

---

## Related docs

- [site-config-driven-admin-scaffold-generator.md](./site-config-driven-admin-scaffold-generator.md) — G-5s dry-run input
- [admin-prototype-preview-harness.md](./admin-prototype-preview-harness.md) — G-5r preview
- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — G-5m-b Auth UI
- [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) — G-5o publish policy
- [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) — G-5q operator docs

---

*G-5t: planning only. Sariswing untouched.*

# Gosaki launch critical-path repo verification

- **Phase:** `gosaki-launch-critical-path-repo-verification`
- **Date:** 2026-08-18
- **Status:** **COMPLETE (read-only audit / docs)**
- **HEAD:** `dcb9e012cd825b7c748ec30f51a4e489f941ef5d` (= `origin/main`)
- **This phase:** repo/docs inventory only · **no** implementation · **no** SQL/DB write · **no** Secret · **no** Edge deploy · **no** FTP · **no** production package generation · **no** commit/push

**Supersession (2026-08-18):** Operator confirmed Gosaki Lolipop **production server is available**. Treat `HOSTING_READY: false` (未契約) in this file as **historical**. Auto FTP stop ≠ public cutover blocker. Current operator gates: `gosaki-production-cutover-operator-gates-refresh.md`.

Staging only as CMS SoT: `kmjqppxjdnwwrtaeqjta`. Production / Sariswing `vsbvndwuajjhnzpohghh` **STOP**. Do **not** treat staging→production migration as the default plan.

---

## 0. Gates

```txt
phase: gosaki-launch-critical-path-repo-verification
GOSAKI_LAUNCH_CRITICAL_PATH_REPO_VERIFICATION_COMPLETE: true
HEAD: dcb9e012cd825b7c748ec30f51a4e489f941ef5d
ORIGIN_MAIN: dcb9e012cd825b7c748ec30f51a4e489f941ef5d
WORKING_TREE: clean
CURRENT_PHASE_AT_AUDIT_START: discography-site-owner-authz-slice-b-close CLOSED / COMPLETE / PASS
SCHEDULE_UPDATE_CLASSIFICATION: CONDITIONAL_BLOCKER
HOSTING_READY: false (SoT 2026-07-15; 2026-08 operator reconfirm required)
PRODUCTION_UPLOAD_READY: false
GO_LIVE_READY: false
READY_FOR_ANY_FUTURE_FTP_APPLY: false
REFERENCE_IMPLEMENTATION_FREEZE_READY: false
PRODUCTION_PACKAGE_GENERATED_THIS_PHASE: false
DB_WRITE_EXECUTED: false
SQL_EXECUTED: false
SECRET_CHANGED: false
EDGE_DEPLOY_EXECUTED: false
FTP_UPLOAD_EXECUTED: false
COMMIT_EXECUTED: false
PUSH_EXECUTED: false
LINKED_CLI_PROJECT_REF: vsbvndwuajjhnzpohghh
LINKED_CLI_PROJECT_NAME: sari-site
CLI_LIVE_INVENTORY_EXECUTED: false
RECOMMENDED_PATH: PARALLEL_WITH_GENERALIZATION
RECOMMENDED_NEXT_PRIMARY: gosaki-production-cutover-operator-gates-refresh
PRIOR_NEXT_PRIMARY_NOT_AUTO_SELECTED: schedule-update-site-writer-rls-planning
```

Do **not** re-arm Discography Save. Do **not** re-run Schedule CREATE PoC. Do **not** use `supabase` CLI against the linked production project.

---

## 1. REPO_BASELINE

| Item | Value |
| --- | --- |
| HEAD | `dcb9e012cd825b7c748ec30f51a4e489f941ef5d` |
| Subject | `docs(cms): close discography site-owner authz slice b` |
| origin/main | **identical** (0 ahead / 0 behind) |
| Working tree | **clean** |
| Slice B close doc HEAD | `30353d73` (parent of current HEAD; docs lag only) |
| Current phase at start | `discography-site-owner-authz-slice-b-close` **CLOSED / COMPLETE / PASS** |
| CLI linked project | `supabase/.temp/linked-project.json` → **`vsbvndwuajjhnzpohghh` (`sari-site`)** |

Safety: linked CLI currently points at **Sariswing production**, not Kit staging. Any future CLI must pass `--project-ref kmjqppxjdnwwrtaeqjta` explicitly. This audit did **not** run `supabase` CLI.

---

## 2. A. Schedule UPDATE classification

**Verdict: `CONDITIONAL_BLOCKER`**

Not a confirmed publication blocker for the documented first production upload (static public site, admin excluded). Becomes a publication blocker **only if** launch scope requires the client (`site_members.owner`, `is_admin=false`) to edit existing schedule rows on day 1.

### 2.1 Authz paths (code / staging docs)

| Path | Authz | Write mechanism | Evidence |
| --- | --- | --- | --- |
| **CREATE** (TBD oneshot) | signed-in → `sites` resolve (`site_slug=gosaki-piano`) → `rpc('can_write_site')` · **not** `is_admin` | PostgREST INSERT + RLS `schedules_site_writer_insert` (+ `schedules_site_writer_select`) | staging-proven · oneshot SUCCESS then cleanup · **do not re-run** |
| **UPDATE** (general / Edge / practical edit) | Edge `assertOperatorIsAdmin` → `rpc('is_admin')` · RLS `schedules_admin_all` | PostgREST `.update()` (`schedule-write-adapter.ts`) and/or Edge `gosaki-schedule-save-dry-run` | staging under **admin JWT** · owner UPDATE **not proven** |
| Site-writer RLS | SELECT + INSERT only | no `schedules_site_writer_update` | template + apply result (policy_count **4**) |
| GRANT | `grant update on public.schedules to authenticated` (G-6-e4 staging) | GRANT ≠ policy; owner still fails UPDATE without `is_admin` policy | staging apply recorded |

Legacy remaining on UPDATE: `public.is_admin()` / `admin_users` / `schedules_admin_all`. Do **not** add the client to `admin_users`.

### 2.2 What works without owner UPDATE

| Can | Cannot |
| --- | --- |
| Static production public site from baked HTML | Client (`is_admin=false`) Save existing events |
| Operator / legacy admin JWT UPDATE on staging (gated slices) | Owner self-service edit of title/time/venue/price/description |
| Owner CREATE new TBD row on staging (PoC closed; not a product UI for production) | Production hosted Admin (see §3) |
| Public read of `published=true` rows at **build time** | Runtime public write |

### 2.3 Client production Admin path vs UPDATE need

Documented first-upload design **excludes** `/admin/` from the production package and keeps the operational shell on **local DEV**. Under that design, the client does not reach Schedule UPDATE at all on production day 1. Therefore UPDATE is **not** an automatic go-live blocker.

If the operator later chooses “本人が本番公開直後から既存ライブを直す”, UPDATE becomes **PUBLICATION_BLOCKER**.

---

## 3. B. PRODUCTION_ADMIN_PATH

| Question | Repo/docs finding | Status |
| --- | --- | --- |
| Client login URL / route | `/__admin-staging-shell/musician-basic/` (+ `/admin/schedule|discography|youtube|about/`, auth forgot/reset) | **local DEV only** |
| Gate | `import.meta.env.DEV && ENABLE_ADMIN_STAGING_SHELL=true` | production build **cannot** serve this shell |
| Production package includes Admin? | `includeReadOnlyAdmin: false` · G-20i3 Option B exclude | **no** |
| Staging shell as production Admin? | Explicitly not; AGENTS.md forbids connecting new work to `/admin` | **no** |
| Production-only Admin route | Not implemented | **UNRESOLVED** (plan missing) |
| Supabase Auth | Staging auth client → `kmjqppxjdnwwrtaeqjta` | production Auth users / hosted session **UNRESOLVED** |
| Save → public site | Save DB/JSON → `build:gosaki:*` / convert → local verify → **operator manual upload** of baked HTML. No one-click Publish. FTP auto-apply **suspended**. | documented |
| Schedule | Staging shell `#schedule` · CREATE owner-aligned · UPDATE legacy-admin · public HTML baked at build | operational = operator until hosted Admin |
| Discography | Staging Edge `can_write_site` → DEFINER RPC (Slice B PASS) · UI live-read wiring **deferred** | owner write proven on staging; production Admin **UNRESOLVED** |
| About | Contents API = operator/`ADMIN_EMAILS` **LEGACY** · Supabase `site_page_fields` = `can_write_site` **ALIGNED** (Save often disarmed) | dual path **UNRESOLVED** for production default |
| YouTube | Contents API **LEGACY** · `site_embeds` **ALIGNED** (Save often disarmed) | dual path **UNRESOLVED** for production default |

**Decide before production self-service (not necessarily before static go-live):**

1. Client uses operator-run CMS (local shell / operator FTP) after launch, **or** a hosted Admin must be designed.
2. If hosted: which host, which route (not `/admin` without an explicit phase), which Supabase project, how DEV gate is lifted.
3. Default Save backend for About / YouTube: Contents vs Supabase.

`CLIENT_SHARE_READY: true` (staging preview). Formal client sign-off of production cutover is **UNRESOLVED**.

---

## 4. C. PRODUCTION_SUPABASE_DIFF

Do **not** “migrate staging into `vsbvndwuajjhnzpohghh`”. That ref is **Sariswing production (`sari-site`)**. Gosaki production profile currently uses staging as **build-time interim SoT**.

### 4.1 Inventory (repo/docs only — no live CLI)

| Area | staging `kmjqppxjdnwwrtaeqjta` | production `vsbvndwuajjhnzpohghh` |
| --- | --- | --- |
| Role | CMS Kit staging · Gosaki `site_slug=gosaki-piano` SoT | Sariswing live · **STOP** for Gosaki/Kit writes |
| `public.schedules` | Gosaki rows (~79 total / 74 published post-cleanup) · `site_slug` · `updated_at` trigger · site-writer SELECT/INSERT RLS | Sariswing schema historically (`is_published` / `deleted_at` in older planning) · **UNKNOWN_NEEDS_LIVE_READ_ONLY_CHECK** · do not apply Kit RLS here |
| Discography | 4 albums / 34 tracks · owner RPC `gosaki_discography_operational_save` · Slice A/B applied | **UNKNOWN** · do not assume Gosaki tables exist |
| `sites` / `site_members` / `platform_admins` | Present · gosaki-piano owner fixture (`can_write_site=true`, `is_admin=false`) | **UNKNOWN** |
| `can_write_site` / `is_admin` | Both present · CREATE uses former · UPDATE uses latter | **UNKNOWN** |
| About `site_page_fields` / YouTube `site_embeds` | Core v2 vertical slices on staging | **UNKNOWN** |
| Edge (Gosaki) | `gosaki-*-save-dry-run` / Contents save · Discography live VERSION **58** | **UNKNOWN_NEEDS_LIVE_READ_ONLY_CHECK** · do not list via linked CLI |
| Edge (Sariswing) | n/a | `admin-schedule`, `admin-news`, `admin-site-page`, `admin-instagram`, `trigger-deploy`, `deploy-status` in repo `config.toml` |
| Secrets (names only) | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` · `GOSAKI_SCHEDULE_SAVE_ARMED` · `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` · `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` · `GOSAKI_YOUTUBE_URL_SAVE_ARMED` · `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` · plus platform `SUPABASE_URL` / `SUPABASE_ANON_KEY` / Contents `GITHUB_TOKEN` / `GITHUB_REPO` | **do not set Gosaki arms here** · values **not** recorded |
| Gosaki data | Yes | **must not** be assumed |

### 4.2 Apply classification

| Target | Class | Meaning |
| --- | --- | --- |
| Apply Kit schema/RLS/RPC/Edge to `vsbvndwuajjhnzpohghh` | **NO_APPLY_REQUIRED** (forbidden) | Wrong project. Not Gosaki production. |
| Dedicated Gosaki production Supabase project | **UNRESOLVED** | Not in repo as created. Do not invent. |
| Keep using staging as build-time SoT for first static publish | **NO_APPLY_REQUIRED** for go-live of baked HTML | Current production profile already points `supabaseProjectRef` at staging · public pages must **not** embed anon keys |
| Runtime CMS on a future Gosaki-prod project | **UNKNOWN_NEEDS_LIVE_READ_ONLY_CHECK** then a **separate** apply plan | Only after project exists and operator chooses hosted Admin |
| Staging-only gaps vs ADR (Schedule UPDATE RLS, Contents retirement) | Kit/staging work · **not** an apply onto `vsbvndwuajjhnzpohghh` | CONDITIONAL for self-service, not for static publish |

Live SELECT-only inventory of production was **not** run (linked CLI risk).

---

## 5. D. PRODUCTION_HOSTING

**Latest SoT:** `gosaki-production-hosting-not-ready-and-return-to-staging-p1-record.md` (2026-07-15). No later doc records a hosting contract.

| Item | Repo/docs | Operator |
| --- | --- | --- |
| Live production today | `https://www.gosaki-piano.com/` = **Wix** | **OPERATOR_READ_ONLY_CHECK_REQUIRED** (2026-08 reconfirm) |
| Replacement hosting | **not contracted** as of 2026-07-15 | **OPERATOR_READ_ONLY_CHECK_REQUIRED** |
| Document root | `TBD_G-20i` · do not guess `public_html/` | **OPERATOR_READ_ONLY_CHECK_REQUIRED** |
| Deploy target path | production profile `remotePath: TBD_G-20i` | same |
| Existing remote files | Unknown on client domain. Operator Lolipop staging exists at `/cms-kit-staging/gosaki-piano/`. G-7f near-miss may have affected **operator account root** (other sites). | **OPERATOR_READ_ONLY_CHECK_REQUIRED** |
| Overwrite risk | First full upload to document root would replace whatever is there. Wix remains live until DNS cutover. Do not upload into operator FTP root `/`. | high until path confirmed |
| Backup | G-7f: “No Lolipop backup available (operator confirmed)” at incident time | **OPERATOR_READ_ONLY_CHECK_REQUIRED** — take a dated copy **before** any upload |
| Rollback | Restore from that backup / Wix remains origin until DNS moves | plan **UNRESOLVED** until host exists |
| Package upload design | Upload **contents** of `public-dist/` (not the folder name) · FileZilla manual · admin excluded | documented |
| FTP delete | **Forbidden.** `readyForAnyFutureFtpApply: false`. Do not `mirror --delete`. | permanent |
| `.ftpaccess` | Do not edit or delete | protection target |
| SSL / domain / DNS | Let's Encrypt / Wix→host cutover **TBD** | **OPERATOR_READ_ONLY_CHECK_REQUIRED** |
| MX / mail | Must review **before** DNS change | **OPERATOR_READ_ONLY_CHECK_REQUIRED** |

G-20d “production” Discography 1-file upload in docs is the **staging** remote `/cms-kit-staging/gosaki-piano/discography/index.html` — not a confirmed `gosaki-piano.com` document-root upload. Do not treat www as already on Astro.

---

## 6. E. PRODUCTION_PACKAGE / 公開設定

| Check | Repo finding | This phase |
| --- | --- | --- |
| Generation path | `npm run build:gosaki:production` → `output/static-public/gosaki-piano-production` → `manual-upload:package:gosaki:production` | **not executed** (hosting blocked · stale HEAD · PoC row bake risk) |
| deployBase | `/` | config locked |
| canonical / og:url | `https://www.gosaki-piano.com/...` | spec locked; on-disk package **stale / absent in workspace glob** |
| robots | productionIndexable · not `Disallow: /` | spec locked |
| sitemap | production host · exclude `/admin/` | spec locked |
| noindex | staging on; production off | spec locked |
| staging URL leak | must not ship `yskcreate` / `/cms-kit-staging/gosaki-piano` | verifier exists; needs fresh package |
| test / PoC strings | staging schedule row `aa440e29` / `schedule-2026-07-010` still holds G-6-e5/f6/g1/g2 PoC title/venue/times/description | **BLOCKER_CANDIDATE** if that row is published at bake |
| Discography Slice B marker | restored on staging | CLOSED |
| broken-link verifier | no dedicated `broken-link` npm script found | use existing `verify:gosaki:production` / static-public artifact verify |
| assets | `_astro/` required on first full upload · band images under `assets/about/bands/` | documented |
| mobile | G-8* staging visual work; production package must be rebuilt at HEAD | QA after host |
| Contact | HubSpot on staging E2E **PASS**; production domain allowlist **UNRESOLVED** | P0 after DNS |
| Last local production package | G-20u38b2 at `1c1fb97` (2026-07-15) · **stale vs HEAD `dcb9e012`** · do not upload | regen required before any future upload |

P0-REF1: never wire public/runtime to `vsbvndwuajjhnzpohghh`. P0-REF2: staging ref at **build time** is currently expected.

---

## 7. PUBLICATION_BLOCKERS (confirmed)

1. **Replacement hosting not contracted / `HOSTING_READY: false`** (SoT 2026-07-15; reconfirm).
2. **Production document root / remote path `TBD_G-20i`.**
3. **DNS / SSL / MX cutover plan not confirmed.**
4. **`PRODUCTION_UPLOAD_READY: false`** — no confirmed upload target; FTP `--apply` suspended.
5. **Fresh production package at current HEAD does not exist** (last build stale). Upload of any current on-disk production artifact is forbidden.

These are infra/operator gates. They do **not** require Schedule UPDATE RLS first.

---

## 8. BLOCKER_CANDIDATES

| Item | Class | Turns into blocker if |
| --- | --- | --- |
| Schedule UPDATE owner authz | **CONDITIONAL_BLOCKER** | Client must edit existing events on day 1 without legacy admin |
| Hosted production Admin | **CONDITIONAL_BLOCKER** | Launch scope = 本人CMS rather than operator FTP |
| Production Supabase project | **CONDITIONAL_BLOCKER** | Runtime CMS on production domain needs a dedicated project (not `vsbvndwuajjhnzpohghh`) |
| G-6 PoC strings on staging schedule row | **CONDITIONAL_BLOCKER** | Row is published and baked into production HTML |
| Client formal sign-off | **UNRESOLVED** | Operator requires written OK before DNS |
| Contact HubSpot production domain | **CONDITIONAL_BLOCKER** | Form must work on `www.gosaki-piano.com` at cutover |
| Contents vs Supabase default for About/YouTube | **NON_BLOCKER** for static launch · **CONDITIONAL** for self-service |

---

## 9. SHARED_HIGH_VALUE_TASKS

Work that helps Gosaki launch **and** Kit reuse (永野寛子さん etc.):

1. **Operator cutover gates packet** (hosting, root, DNS/SSL/MX, backup, no `--delete`) — reusable per site.
2. **Production profile contract** (`deployBase=/`, canonical, robots, admin exclusion, freshness, staging-URL leak).
3. **Build-time bake vs runtime Admin** decision template.
4. **`can_write_site` owner model** already proven on CREATE + Discography; Schedule UPDATE alignment later.
5. **Manual upload without `mirror --delete`.**

---

## 10. PUBLICATION_NON_BLOCKERS (after static go-live)

- Schedule UPDATE site-writer RLS / Edge cutover from `is_admin`
- Discography UI live-read wiring
- About/YouTube Contents retirement
- Staging shell membership gate (mock role → `can_write_site`)
- Image Storage CMS
- Bands/Projects CMS (keep static JSON)
- FTP auto-apply (G-7f1 still suspended)
- Physical DELETE
- `REFERENCE_IMPLEMENTATION_FREEZE`
- Mio / second-site seed apply

---

## 11. CRITICAL_PATH_ESTIMATE (provisional)

Do **not** treat as a calendar commitment. Hosting contract date is unknown.

| Task | Grain |
| --- | --- |
| Operator hosting / document-root / DNS-SSL-MX / backup reconfirm | **不明** (operator / client) |
| Production Admin / Supabase SoT decision (docs) | **<数時間** |
| Staging PoC-string content hygiene (if published) | **<数時間** (needs separate approval; not this phase) |
| Production package regen + local verify at HEAD | **0.5日程度** |
| Manual first upload (after path confirmed; no delete) | **0.5日程度** |
| Post-upload HTTP / visual / Contact QA | **0.5日程度** |
| DNS cutover + SSL + MX verify | **不明** |
| Hosted Admin for 本人 | **1日程度** planning + **不明** implementation |
| Schedule UPDATE owner authz (planning→apply) | **1日程度** (not on static-publish critical path) |

---

## 12. RECOMMENDED_PATH

```txt
PARALLEL_WITH_GENERALIZATION
```

Publication is blocked by **hosting/DNS**, not by Schedule UPDATE. Kit owner-authz work can continue **in parallel** and must not be mistaken for the go-live gate. Freeze Kit until hosting exists (`PUBLICATION_FIRST`) would stall generalization for an operator-gated item that has not moved since 2026-07-15.

---

## 13. NEXT_PRIMARY

```txt
gosaki-production-cutover-operator-gates-refresh
```

**Why this, not `schedule-update-site-writer-rls-planning`:**

1. Confirmed blockers are hosting / remote path / DNS-SSL-MX / fresh package — SoT is a month stale and needs operator reconfirm.
2. Schedule UPDATE is **CONDITIONAL_BLOCKER**; classification depends on the Admin-path decision this refresh must ask.
3. Discography Slice B stays CLOSED; do not re-open as Primary.
4. After gates refresh: if launch is static+operator CMS, next Cursor task is production-package preflight/regen (still no upload). If launch is 本人CMS day 1, **then** Schedule UPDATE planning becomes Primary.

---

## 14. Explicit non-actions (this phase)

- No production write / deploy / FTP / `mirror --delete`
- No SQL / RLS / GRANT / Secret / Edge
- No Discography Save / restore / Schedule CREATE re-proof
- No production package generation
- No commit / push

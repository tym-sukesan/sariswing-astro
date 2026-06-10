# Supabase Auth Staging Integration Plan

**Phase:** G-5y-a — Supabase Auth staging integration plan  
**Status:** planning only · no Auth connection · no DB/RLS changes · production Auth untouched

Related config: [`config/admin/admin-auth-integration-plan.json`](../config/admin/admin-auth-integration-plan.json)

---

## 1. Purpose

G-5y-a defines how CMS Kit Admin will connect **Supabase Auth** to the staging runtime shell at `/__admin-staging-shell/musician-basic/` — **before any real connection is made**.

This phase is **plan only**. It does **not**:

- Connect Supabase Auth
- Add Supabase client imports
- Implement login routes with real auth
- Create `admin_users` table
- Create or change RLS policies
- Query or update the database
- Modify production Auth or existing Sariswing admin/Auth code

Goals:

- Document staging-only Auth connection policy
- Fix admin / editor / viewer role design
- Compare allowlist vs `admin_users` table approaches
- Separate anon key (browser) from service role (server/CI only)
- Draft minimal RLS policy direction
- Design password reset, session check, and role check flows
- Clarify `/__admin-staging-shell` vs future `/admin`
- Split G-5y-b / G-5y-c / G-5y-d safely

---

## 2. Current state

After G-5x:

| Item | Status |
| --- | --- |
| Route | `/__admin-staging-shell/musician-basic/` exists |
| Gate | `ENABLE_ADMIN_STAGING_SHELL=true` + `import.meta.env.DEV` |
| Mode | Shell-only |
| Data | Mock/static data only |
| Actions | Disabled |
| Supabase Auth | **Not connected** |
| DB query | **Not performed** |
| Storage upload | **Not performed** |
| Publish dispatch | **Not performed** |
| Production | **Disabled** |
| Sariswing `/admin/` | **Untouched** |
| Sariswing production Auth | **Untouched** |

Auth UI scaffold exists from G-5m-b ([admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md)) but remains `connectedToRuntime: false`.

---

## 3. Integration principles

| Principle | Meaning |
| --- | --- |
| **staging first** | All Auth work targets a staging Supabase project only |
| **production auth disabled by default** | No production Auth policy or login until G-6e + written approval |
| **no service role in browser** | Service role only in Edge Functions, CI, or server adapters |
| **anon key only in browser** | Client uses `PUBLIC_SUPABASE_ANON_KEY` with RLS enforcement |
| **RLS required before data access** | No SELECT/INSERT/UPDATE/DELETE until RLS reviewed and applied |
| **no DB write before Auth + RLS review** | Auth gate → RLS review → read-only (G-5z) → write (G-6a) |
| **one auth feature per phase** | Do not combine login + role table + RLS + data in one step |
| **explicit approval before connecting real project** | Staging project selection requires documented approval |
| **no Sariswing production auth changes** | Existing Sariswing admin Auth code and prod credentials untouched |

---

## 4. Environment separation

| Item | Staging (CMS Kit target) | Production (later, G-6e+) |
| --- | --- | --- |
| **Supabase project** | Dedicated staging project per client (recommended) | Separate production project |
| **Auth enabled** | Yes, after G-5y-d approval | Yes, only after production readiness review |
| **Allowed users** | Allowlist or `admin_users` (staging only) | `admin_users` + customer approval |
| **Roles** | admin / editor / viewer on staging | Same model; stricter audit |
| **RLS** | Draft → review → apply on staging | Copy/review; never copy blindly |
| **Redirect URL** | Staging shell URL / staging host | Production `/admin/` host only after approval |
| **Password reset** | Staging email templates / redirect | Production domain only after approval |
| **Production publish permission** | **Disabled** for all roles | Admin + explicit approval record |
| **Default enabled** | **false** (`ENABLE_ADMIN_STAGING_AUTH=false`) | **false** until G-6e |
| **Approval required** | **Yes** for each G-5y sub-phase | **Yes** + customer written OK |

**Recommendation:** One Supabase project per client site. Staging and production projects must be **separate**, or environments must be **explicitly isolated** with no shared credentials. Production Auth remains disabled until a later phase with written approval.

---

## 5. Role model

### admin

| Aspect | Detail |
| --- | --- |
| **Can do** | All CMS module read/write (when enabled in later phases); media upload (G-6b); staging publish **request/trigger** (G-6c, staging only); settings read |
| **Cannot do** | Production publish without separate approval; bypass RLS; use service role in browser |
| **Initial rollout** | Start with 1–2 trusted maintainers on staging only |
| **Production publish** | **Disabled by default**; requires explicit approval even for admin |

### editor

| Aspect | Detail |
| --- | --- |
| **Can do** | Read dashboard; create/update Profile, Schedule, Discography, Links, News (when write enabled) |
| **Cannot do** | Delete/restore/duplicate (unless explicitly granted later); media upload; publish trigger; settings manage; production publish |
| **Initial rollout** | Optional after admin staging login verified |
| **Production publish** | **Disabled** |

### viewer

| Aspect | Detail |
| --- | --- |
| **Can do** | Read-only access to permitted modules |
| **Cannot do** | Any create/update/delete/upload/publish/settings change |
| **Initial rollout** | Useful for customer preview of staging content |
| **Production publish** | **Disabled** |

---

## 6. Permission matrix

Legend: ✓ = allowed (when runtime connected), — = denied, ⚠ = admin role only with **separate production approval** (still disabled in initial phases).

| Module | Operation | viewer | editor | admin |
| --- | --- | --- | --- | --- |
| **dashboard** | read | ✓ | ✓ | ✓ |
| **profile** | read | ✓ | ✓ | ✓ |
| **profile** | create / update | — | ✓ | ✓ |
| **profile** | delete / restore | — | — | ✓ |
| **schedule** | read | ✓ | ✓ | ✓ |
| **schedule** | create / update | — | ✓ | ✓ |
| **schedule** | delete / restore / duplicate | — | — | ✓ |
| **discography** | read | ✓ | ✓ | ✓ |
| **discography** | create / update | — | ✓ | ✓ |
| **discography** | delete / restore | — | — | ✓ |
| **links** | read | ✓ | ✓ | ✓ |
| **links** | create / update | — | ✓ | ✓ |
| **links** | delete / restore | — | — | ✓ |
| **news** | read | ✓ | ✓ | ✓ |
| **news** | create / update | — | ✓ | ✓ |
| **news** | delete / restore | — | — | ✓ |
| **media** | read | ✓ | ✓ | ✓ |
| **media** | upload | — | — | ✓ |
| **media** | update / delete | — | — | ✓ |
| **publish** | stagingPublish | — | request only | trigger (staging) |
| **publish** | productionPublish | — | — | ⚠ disabled by default |
| **settings** | settingsManage | — | — | read only initially |

**Initial state (G-5y-a through G-5y-d):** All write/publish/upload cells are **UI-disabled** regardless of role. Matrix applies only after explicit phase approval.

**productionPublish:** Disabled for all roles in config (`productionPublish.enabledByDefault: false`). Admin requires separate approval record before any production publish capability is even considered (G-6e+).

Source draft: [`templates/admin-cms/auth/permissions.example.json`](../templates/admin-cms/auth/permissions.example.json)

---

## 7. Identity source options

### Option A: email allowlist

**Description:** Permitted emails stored in env or site config (e.g. `ADMIN_ALLOWED_EMAILS`). After Supabase sign-in, app checks email against allowlist and assigns a default role (usually `admin` for initial staging).

| | |
| --- | --- |
| **Pros** | No table required; fast to introduce; simple for first staging login |
| **Cons** | Weak per-user role management; weak audit trail; awkward for production ops |

**Best for:** G-5y-b / G-5y-c / early G-5y-e staging validation.

### Option B: admin_users table

**Description:** Supabase DB table maps `user_id` / `email` → `role` / `active`. RLS policies reference role claims or join to `admin_users`.

| | |
| --- | --- |
| **Pros** | Fine-grained roles; auditable; production-ready pattern |
| **Cons** | Requires table design, migrations, and RLS before use |

**Best for:** Before production go-live; migrate from allowlist when multiple roles needed.

### Recommendation

| Phase | Approach |
| --- | --- |
| **G-5y-b / G-5y-c** | Allowlist plan + adapter scaffold (dry-run only) |
| **G-5y-d / G-5y-e** | Staging connection with allowlist first |
| **Before production** | Evaluate migration to `admin_users` table |
| **G-5y-a** | **No implementation** — design only |

---

## 8. Proposed admin_users table design

**DO NOT RUN IN G-5y-a.** Draft for future approval only.

```sql
-- draft only, do not run in G-5y-a
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index admin_users_email_key on admin_users (lower(email));
create index admin_users_user_id_idx on admin_users (user_id) where user_id is not null;
```

**RLS draft (do not run):**

```sql
-- draft only, do not run in G-5y-a
alter table admin_users enable row level security;

-- Authenticated users can read their own row only
create policy "admin_users_select_own"
  on admin_users for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete from browser client in initial design;
-- role changes via service role / migration tooling only
```

Table creation and policy application require **admin_users table approval** and **RLS review approval** gates (Section 15).

---

## 9. RLS policy approach

| Rule | Detail |
| --- | --- |
| **Mandatory before data access** | No real CMS data reads until RLS policies reviewed |
| **Read-only before write** | G-5z SELECT-only policies before G-6a writes |
| **Module-level policies** | Separate policies per content table (news, schedule, etc.) |
| **Role separation** | Policies enforce admin/editor/viewer via JWT claims or `admin_users` join |
| **No service role in browser** | Client never holds service role key |
| **Service role server-side only** | Edge Functions, CI, migration scripts |
| **Staging first** | All policies tested on staging project |
| **DB write before RLS forbidden** | Blocked by integration gates |

**Example module policy draft (do not run):**

```sql
-- draft only, do not run in G-5y-a
-- news: editors and admins can read staging rows
create policy "news_select_staging"
  on news for select
  to authenticated
  using (
    exists (
      select 1 from admin_users au
      where au.user_id = auth.uid()
        and au.active = true
        and au.role in ('admin', 'editor', 'viewer')
    )
  );
```

Actual table names and policies must match site schema adapter output — not applied in G-5y-a.

---

## 10. Supabase client approach

| Item | Policy |
| --- | --- |
| **Browser** | `createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)` only |
| **Public-ish keys** | URL and anon key are client-visible but **environment-separated** (staging vs prod projects) |
| **Service role** | Never in browser, never in `PUBLIC_*` env, never in Astro client bundle |
| **Session** | `@supabase/supabase-js` session from Auth; refresh handled by client library |

**Future file layout (G-5y-b+, not created in G-5y-a):**

```txt
src/lib/admin/auth/client.ts       — browser Supabase client factory (anon only)
src/lib/admin/auth/session.ts      — getSession / onAuthStateChange helpers
src/lib/admin/auth/roles.ts        — resolve role from allowlist or admin_users
src/lib/admin/auth/permissions.ts  — module permission checks from matrix
```

**Helper responsibilities:**

| Helper | Purpose |
| --- | --- |
| `client.ts` | Single anon-key client; throws if service role detected |
| `session.ts` | Returns `{ user, session }` or null; no DB writes |
| `roles.ts` | Maps authenticated user → role; staging only |
| `permissions.ts` | `can(user, module, action)` using permission matrix |

G-5y-a creates **none** of these files.

---

## 11. Login / logout / password reset flow

### Login

1. User opens staging shell (G-5y-c: login UI shell; G-5y-d: real Auth).
2. `AdminLoginForm` → `signInWithPassword` (G-5y-d+ only).
3. On success: session stored by Supabase client; redirect to staging shell dashboard section.
4. On failure: Japanese error message (see below); no credential logging.

### Logout

1. `signOut()` via auth helper.
2. Clear local session state; show logged-out banner.
3. Remain on staging shell route (not `/admin/`).

### Forgot password

1. User submits email on `AdminPasswordResetForm` (request mode).
2. `resetPasswordForEmail(email, { redirectTo: stagingCallbackUrl })`.
3. Staging Supabase project sends reset email with staging redirect only.

### Reset password

1. User lands on staging callback URL with recovery token.
2. `AdminPasswordResetForm` (reset mode) → `updateUser({ password })`.
3. Redirect to staging shell with success message.

### Redirect / callback URLs

| Environment | Callback base (example) |
| --- | --- |
| Local dev | `http://localhost:4321/__admin-staging-shell/musician-basic/` |
| Staging host | `https://staging.example.com/__admin-staging-shell/musician-basic/` |
| Production `/admin/` | **Not configured until G-6e approval** |

Configure allowed redirect URLs in **staging Supabase project only** (G-5y-d gate).

### Error handling (Japanese, user-facing)

| Condition | Message (draft) |
| --- | --- |
| Invalid credentials | メールアドレスまたはパスワードが正しくありません。 |
| Email not allowlisted | このアカウントは管理画面へのアクセスが許可されていません。 |
| Session expired | セッションの有効期限が切れました。再度ログインしてください。 |
| Network error | 認証サービスに接続できませんでした。しばらくしてから再度お試しください。 |
| Production auth disabled | 本番環境の認証は現在無効です。 |

### Disabled production auth

Production Supabase Auth settings and Sariswing production login remain **unchanged** in all G-5y sub-phases.

---

## 12. Route protection plan

| Route | G-5x (now) | G-5y-b/c | G-5y-d/e | Future `/admin/` |
| --- | --- | --- | --- | --- |
| `/__admin-staging-shell/musician-basic/` | Open with dev gate; mock data | Auth status UI (disconnected) | Login + session; role badge | N/A (stay on staging shell until approved) |
| `/admin/` | **Not used** | **Not protected** | **Not connected** | Guard only after G-6e + customer approval |

**Incremental rollout (do not skip steps):**

1. **G-5y-b:** Auth adapter scaffold + dry-run CLI; no network calls.
2. **G-5y-c:** Login UI on staging shell; `disabled={true}` / mock session display.
3. **G-5y-d:** Real staging Auth connection with explicit approval.
4. **G-5y-e:** Role check + allowlist enforcement.
5. **Route guard:** Session required to view shell sections (staging only).
6. **`/admin/` guard:** Last — only after staging Auth QA complete and separate route approval.

Never protect `/admin/` before staging shell Auth is approved and tested.

---

## 13. Environment variables plan

**Draft only.** Do not enable production auth with these flags.

```env
# Staging-only Admin Auth draft. Disabled by default.
ENABLE_ADMIN_STAGING_AUTH=false

# Future (G-5y-d+, staging project only — empty until approved):
# PUBLIC_SUPABASE_URL=
# PUBLIC_SUPABASE_ANON_KEY=
# ADMIN_ALLOWED_EMAILS=
# ADMIN_AUTH_ENV=staging
```

| Variable | Purpose | Browser-safe |
| --- | --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | Gate real Auth on staging shell | Yes (flag only) |
| `PUBLIC_SUPABASE_URL` | Staging project URL | Yes (staging project) |
| `PUBLIC_SUPABASE_ANON_KEY` | Staging anon key | Yes (with RLS) |
| `ADMIN_ALLOWED_EMAILS` | Comma-separated allowlist | Server-side preferred; never commit real values |
| `ADMIN_AUTH_ENV` | Must be `staging` for CMS Kit Auth | Yes |

**Never add to browser env:**

- `SUPABASE_SERVICE_ROLE_KEY`
- GitHub tokens
- FTP passwords

G-5y-a adds only `ENABLE_ADMIN_STAGING_AUTH=false` to [`.env.example`](../../../.env.example). URL, anon key, and allowed emails are **not** added yet.

---

## 14. Future phase breakdown

| Phase | Focus | Runtime connection |
| --- | --- | --- |
| **G-5y-a（完了）** | Supabase Auth staging integration **plan** (this doc) | **None** |
| **G-5y-b（完了）** | [Auth adapter scaffold / dry-run](./admin-auth-adapter-scaffold.md) | **None** |
| **G-5y-c（完了）** | [Staging login UI shell](./staging-login-ui-shell.md) — disabled real auth | None |
| **G-5y-d-prep（完了）** | [Connection checklist](./supabase-auth-staging-connection-checklist.md) — preflight | None |
| **G-5y-d（完了）** | [Staging Supabase Auth connection](./staging-supabase-auth-connection.md) | Staging shell Auth only |
| **G-5y-e** | Staging role check / allowlist | Allowlist enforcement |
| **G-5y-e** | Staging role check / allowlist enforcement | Staging Auth + allowlist |
| **G-5z** | Read-only data integration (SELECT + RLS) | Staging DB read |
| **G-6a+** | CRUD write, media, publish (separate phases) | Staging write paths |

Adjust sub-phase IDs if needed; do not merge Auth + DB write + publish in one phase.

---

## 15. Approval gates

| Gate | Required reviewer | Required evidence | Allowed | Forbidden |
| --- | --- | --- | --- | --- |
| **Auth plan approval** | Maintainer | This doc reviewed; role matrix agreed | Plan docs, config JSON | Any Auth connection |
| **Auth adapter scaffold approval** | Maintainer | Dry-run output reviewed; no secrets | Scaffold files, CLI dry-run | Network Auth calls |
| **Supabase project selection approval** | Maintainer + customer (if client project) | Staging project ID documented; prod project separate | Record project ref in internal runbook | Use production project |
| **Env setup approval** | Maintainer | `.env` staging values set locally; not committed | Local staging env | Commit secrets; prod env |
| **Login connection approval** | Maintainer + security review | Redirect URLs configured; anon key only in client | Enable `ENABLE_ADMIN_STAGING_AUTH` on staging | Production Auth changes |
| **Role / allowlist approval** | Maintainer | Allowlist emails documented; lockout plan | Update allowlist config | Public exposure of sensitive emails |
| **RLS review approval** | Maintainer + security review | Policy draft reviewed; read-before-write order | Apply staging RLS (G-5z prep) | RLS mutation without review |
| **admin_users table approval** | Maintainer + security review | Schema draft + migration plan | Create table on staging | Create without approval |
| **Production auth approval** | Maintainer + customer written OK | G-6d readiness review passed | Production Auth (G-6e) | Enable before G-6e |

Each gate requires rollback/disable steps documented before proceeding.

---

## 16. Forbidden operations

The following are **forbidden** in G-5y-a and remain forbidden until their explicit approval gate passes:

- production Auth changes
- service role in browser
- DB write before RLS review
- RLS policy mutation without approval
- `admin_users` table creation without approval
- exposing allowed emails publicly if sensitive
- connecting `/admin/` before staging shell Auth is approved
- enabling production publish through Auth role alone
- GitHub dispatch
- FTP deploy
- modifying existing Sariswing admin Auth code
- Supabase client import in G-5y-a

---

## 17. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| **Service role leak** | Never in client; scan bundle; gate in CI; adapter scaffold rejects service role env names |
| **Wrong environment** | Separate staging/prod projects; `ADMIN_AUTH_ENV=staging` check; no shared credentials |
| **Production auth modification** | Explicit forbidden list; no changes to Sariswing prod Auth; production disabled by default |
| **Lockout** | Maintain break-glass maintainer account; document recovery; test password reset on staging |
| **Role misconfiguration** | Start allowlist with admin only; permission matrix in config JSON; audit role changes |
| **RLS too permissive** | Read-only phase first; security review gate; no write before RLS sign-off |
| **Redirect URL mismatch** | Document exact URLs; configure Supabase allowlist before G-5y-d |
| **Exposing user emails** | Allowlist in server env where possible; do not render full allowlist in UI |
| **Confusing staging shell with real admin** | Persistent banners; `/__admin-staging-shell` path; not `/admin/` |
| **Skipping phases** | One auth feature per phase; acceptance criteria per sub-phase |

---

## 18. Acceptance criteria for G-5y-b

**G-5y-b（完了）:** [admin-auth-adapter-scaffold.md](./admin-auth-adapter-scaffold.md)

Proceed to **G-5y-c (staging login UI shell)** when:

- [x] G-5y-a plan reviewed
- [x] Auth adapter types + mock provider added
- [x] Session / role / permission checkers added
- [x] Dry-run CLI produces report with `supabaseAuthConnected: false`
- [x] Staging shell shows Auth mock status panel
- [ ] G-5y-c login UI shell reviewed (next phase)

---

## 18b. Acceptance criteria for G-5y-c

**G-5y-c（完了）:** [staging-login-ui-shell.md](./staging-login-ui-shell.md)

Proceed to **G-5y-d (staging Supabase Auth connection)** when:

- [x] Login UI shell on staging route
- [x] Login / reset buttons disabled; no credentials submitted
- [x] Route guard planned notice visible
- [ ] G-5y-d: Supabase project + redirect URL + env approval

---

## 18c. Acceptance criteria for G-5y-d (next)

**G-5y-d-prep（完了）:** [supabase-auth-staging-connection-checklist.md](./supabase-auth-staging-connection-checklist.md)

Proceed to **G-5y-d implementation** when:

- [x] Connection checklist documented
- [x] Project selection / redirect / env / allowlist / rollback defined
- [ ] Preflight Section 12 completed
- [ ] Approval ID `G-5y-d-staging-auth-connect` recorded

---

**G-5y-a is a planning phase only. G-5y-b is scaffold / dry-run only. G-5y-c is login UI shell only. G-5y-d-prep is checklist / approval only.**

- No Supabase Auth is connected.
- No Supabase client is added.
- No `admin_users` table is created.
- No RLS policy is created or changed.
- No database is queried or updated.
- No storage upload is performed.
- No GitHub dispatch is performed.
- No FTP deploy is performed.
- No production Auth is touched.
- Existing Sariswing admin and Auth code remain unchanged.

---

## Related

- [staging-runtime-shell-integration.md](./staging-runtime-shell-integration.md) — G-5x staging shell route
- [supabase-auth-staging-connection-checklist.md](./supabase-auth-staging-connection-checklist.md) — G-5y-d-prep preflight
- [admin-runtime-integration-plan.md](./admin-runtime-integration-plan.md) — full runtime phase map
- [local-only-admin-preview-route.md](./local-only-admin-preview-route.md) — G-5u preview (no Auth)

---

*G-5y-a: Supabase Auth staging integration plan only. No runtime Auth connection.*

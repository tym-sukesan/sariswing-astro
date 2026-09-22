# Gosaki production CMS Save completion

- **Phase:** `gosaki-production-cms-save-completion`
- **Date:** 2026-09-22
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **HEAD:** `078fa734` (uncommitted implementation on `hotfix/gosaki-disable-test-youtube`)
- **Status:** **CODE COMPLETE / SAVE NOT ARMED / OFFICIAL PACKAGE STOP (git-clean)**

**Forbidden this phase (honored):** DB write · Secrets · Edge deploy · FTP · DNS · Auth Dashboard · production Save arm · commit · push.

---

## 0. Gates

```txt
PRODUCTION_CMS_SAVE_IMPLEMENTATION_RESULT: CODE_COMPLETE
SAVE_ARM: false
OFFICIAL_PRODUCTION_PACKAGE: STOP git-clean (uncommitted diffs)
PRODUCTION_DRY_RUN: PASS
STAGING_DRY_RUN: PASS
VERIFIER_GOSAKI_PRODUCTION_CMS_SAVE_COMPLETION: PASS (42)
VERIFIER_G20U39B4: PASS (277)
EDGE_DEPLOY_EXECUTED: false
DB_WRITE_EXECUTED: false
SQL_APPLY_EXECUTED: false
READY_FOR_SAVE_ACTIVATION: false
READY_FOR_OPERATOR_UPLOAD: false
ORIGINAL_REPO_DIRTY_UNTOUCHED: true
```

---

## 1. Production wording

`PUBLIC_GOSAKI_ADMIN_SURFACE` is baked from package profile (`production` vs `staging`).

| Surface | Chip / footer fact | Title |
| --- | --- | --- |
| production | `本番CMS｜保存内容は公開ページへ自動反映されません` | no `テスト環境` |
| staging / unset | `テスト環境｜公開サイトには自動反映されません` | `（テスト環境）` retained |
| musician-basic shell | staging copy unchanged | `stagingLabel` unchanged |

On-disk production `public-dist` from HEAD `078fa734` still has `テスト環境` until official regen after commit.

---

## 2. Schedule authorization

Live Edge `gosaki-schedule-save-dry-run` still uses **deployed** `rpc('is_admin')` until operator deploys.

**Local source** (root + tools mirror, byte-eq):

- Save/dry-run gate: `sites` singleton `site_slug=gosaki-piano` → `rpc('can_write_site', { p_site_id })`
- Unrelated slug → 400
- Non-member / other site → 403 (row not visible or `can_write_site` false)
- Platform admin: `can_write_site` true via `is_platform_admin()` (existing helper)
- `schedules_admin_all` (`is_admin`) **not dropped**
- UPDATE still filters `.eq("site_slug", …)`
- CREATE already had `schedules_site_writer_insert` (2026-08-06)

**Owner existing-row UPDATE** still needs `schedules_site_writer_update` (template only, **not applied**).

---

## 3. Module Save readiness (code vs live)

| Module | Authz in source | Production write path | Save arm | Live until operator acts |
| --- | --- | --- | --- | --- |
| Schedule | `can_write_site` (new) | Edge `gosaki-schedule-save-dry-run` | false | Edge still `is_admin`; no UPDATE RLS |
| Discography | `can_write_site` (already) | Edge operational RPC | false | live path already owner-capable when armed |
| YouTube | `can_write_site` (already) | **Supabase** (`PATH_ENABLED=true` production bake) | false | Contents code retained, not production default |
| About | `can_write_site` (already) | **Supabase** (`PATH_ENABLED=true` production bake) | false | Contents code retained, not production default |

---

## 4. Save activation (later — not this turn)

Minimum operator sequence after commit:

1. Apply `cms-core-v2-schedules-site-writer-update-rls.template.sql` on **kmjq only** (explicit approval).
2. Deploy `supabase/functions/gosaki-schedule-save-dry-run` from **repo root** (explicit approval). Do not use linked CLI (`vsbvnd`).
3. Confirm live Edge VERSION / dry-run 200 for owner JWT (`can_write_site`, Save still 403 `save_not_armed`).
4. Arm **one** module at a time (mutex): client `PUBLIC_*_SAVE_*ARMED=true` bake **and** matching Edge secret. Prefer Supabase YouTube/About arms; do **not** arm Contents GitHub Save as production default.
5. Official `build:gosaki:production` from **clean HEAD** → FileZilla `public-dist/` contents. No FTP `--apply`.

---

## 5. Verifiers

- `npm run verify:gosaki-production-cms-save-completion` — **42 passed**
- `npm run verify:g20u39b4-gosaki-admin-multi-route-staging-package-prep` — **277 passed** (schedule Edge contract updated to `can_write_site`)
- `npm run build:gosaki:production:dry-run` — **PASS** (`includesAdmin: true`, ref `kmjqppxjdnwwrtaeqjta`)
- `npm run build:gosaki:staging:dry-run` — **PASS**
- Official `build:gosaki:production` — **STOP** (working tree dirty)

Public counts 106 / Sep 18 / Oct 14 and test YouTube hide: convert/JSON SoT unchanged (`published: false` for `I-eY9YMq9GI`). Not re-baked this phase.

---

## 6. BLOCKERS for customer Save

1. Save arms remain **false** (this phase).
2. Schedule live Edge not deployed with `can_write_site`.
3. `schedules_site_writer_update` not applied.
4. No auto-publish / public HTML reflection after Save.
5. Official production package with new banner not generated (git-clean).

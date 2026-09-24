# Gosaki leftover Contents Save Secret audit (read-only)

- **Phase:** `gosaki-contents-save-secret-readonly-audit`
- **Date:** 2026-09-24
- **Worktree:** `~/sariswing-astro-gosaki-prestage`
- **Target:** `kmjqppxjdnwwrtaeqjta`
- **Status:** **READ-ONLY COMPLETE**

**This phase did not:** secrets mutate · deploy · DB write · build · commit.

Operator premise: leftover names `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` · `GOSAKI_YOUTUBE_URL_SAVE_ARMED`. All **Supabase** Save arms used in this delivery are already **unset**. Values of the leftover secrets were **not** re-read here (name presence only).

Arming rule in both handlers: `Deno.env.get(NAME) === "true"` only. `false` / other / missing ⇒ 403 `save_not_armed`.

---

```txt
SECRET_AUDIT_RESULT: PASS
SAFE_TO_UNSET_BOTH: true
NEEDED_FOR_DELIVERY: false
UI_REACHABLE_FROM_PRODUCTION_ADMIN: false
WRITE_TARGET: GitHub Contents API · branch main
UNSET_EXECUTED: false
```

---

## GOSAKI_YOUTUBE_URL_SAVE_ARMED

| Item | Value |
| --- | --- |
| used_by | Edge `gosaki-youtube-url-save` (`_shared/gosaki-youtube-url-save.ts` · `isG11c6SaveArmed`) |
| reachable | **production Admin UI: no** — bake forces `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED=true` → `write-backend=supabase` → Save POST goes to `gosaki-youtube-supabase-save-dry-run`. Contents client arm `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` is mutex-off. Residual: JWT that passes `requireAdminUser` (`app_metadata.role=admin` or `ADMIN_EMAILS`) could still POST the Contents function **if** this Secret is exact `"true"`. Owner `can_write_site` alone is **not** enough (`requireAdminUser` ≠ `can_write_site`). |
| write_target | GitHub Contents PUT · branch **`main`** · `tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json` |
| safe_to_unset | **true** |
| needed for delivery | **false** |

## GOSAKI_ABOUT_CONTENT_SAVE_ARMED

| Item | Value |
| --- | --- |
| used_by | Edge `gosaki-about-content-save` (`_shared/gosaki-about-content-save.ts` · `isG12aSaveArmed`) |
| reachable | **production Admin UI: no** — bake forces `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED=true` → Save POST goes to `gosaki-about-supabase-save-dry-run`. Contents client arm `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` is mutex-off. Same residual curl path as YouTube Contents **if** Secret is exact `"true"`. |
| write_target | GitHub Contents PUT · branch **`main`** · `tools/static-to-astro/config/sites/gosaki-piano-about-content.json` |
| safe_to_unset | **true** |
| needed for delivery | **false** |

---

## Unset impact

- Customer `/admin/` YouTube / About Save: **unchanged** (already Supabase path + Supabase Secret unset).
- Contents functions: Save becomes 403 `save_not_armed` even if someone curls with admin JWT.
- Contents **dry-run** functions do not use these Secrets.
- If leftover values are already not `"true"`, unset is hygiene only (no behavior change).
- Future staging Contents tests would need a later explicit `secrets set …=true`.

Recommended (later explicit approval, kmjq only):

```bash
npx supabase secrets unset GOSAKI_YOUTUBE_URL_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
npx supabase secrets unset GOSAKI_ABOUT_CONTENT_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta
```

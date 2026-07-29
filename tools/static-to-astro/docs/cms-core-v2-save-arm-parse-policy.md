# CMS Core v2 — Save arm parse policy (docs-only)

- **Phase:** `cms-core-v2-save-arm-parse-policy`
- **Date:** 2026-07-29
- **Status:** **COMPLETE** (policy / inventory only · **no code change**)
- **Repo HEAD:** `98a793c0a199d8c59cd962757786855d9fbe2db6`
- **Gosaki deployed staging package (fixed):** `dc1c5b62a58d0462ad6629db4847256d316d4a38`
- **CLIENT_SHARE_READY:** **true**（維持）
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **Production STOP:** `vsbvndwuajjhnzpohghh`
- **This phase:** read-only inventory + unified policy recommendation · **no** helper / Edge / Save arm / package / FTP / commit

---

## Gates

```txt
phase: cms-core-v2-save-arm-parse-policy
CMS_CORE_V2_SAVE_ARM_PARSE_POLICY_COMPLETE: true
CODE_CHANGED: false
HELPER_IMPLEMENTED: false
EDGE_CHANGED: false
SAVE_ARM_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Parser families (as implemented today)

| Family | Condition | Used by |
| --- | --- | --- |
| **A — client / bake** | `String(value ?? "").trim() === "true"` | Admin Astro bake (`gosaki-staging-read-only-admin.ts`), package-run-marker bake flags, build-read path flags |
| **B — Edge / Deno** | `getEnv(...) === "true"` or `Deno.env.get(...) === "true"` (**no trim**, no case-fold) | Schedule / Discography / YouTube Supabase / About Supabase Edge; Contents YouTube/About shared handlers under `supabase/functions/_shared/` |
| **C — boolean hard gate** | `saveArmed === true` | `isClientSaveArmed` in `gosaki-staging-one-click-save.ts` (after dataset → boolean) |
| **D — HTML dataset** | `dataset.* === "true"` | Runtime read of baked `data-gosaki-*-save-armed` |

### Input matrix (current behavior)

| Input | A (trim) | B (Edge exact) | C (boolean) | D (dataset) |
| --- | --- | --- | --- | --- |
| unset / `undefined` | disarmed | disarmed | disarmed | disarmed |
| `null` | disarmed | n/a | disarmed | disarmed |
| `""` | disarmed | disarmed | disarmed | disarmed |
| `"false"` | disarmed | disarmed | disarmed | disarmed |
| `"true"` | **armed** | **armed** | n/a | **armed** |
| `"TRUE"` | disarmed | disarmed | n/a | disarmed |
| `" True "` | **armed** | **disarmed** | n/a | disarmed |
| `"1"` / other junk | disarmed | disarmed | disarmed | disarmed |
| boolean `true` | (stringifies to `"true"` if coerced) | n/a | **armed** | n/a |

**Critical existing mismatch:** Family A can arm the **client UI** on `" True "` while Family B keeps the **server** disarmed → UI looks armed, Save returns `save_not_armed` / 403.

---

## 2. Feature × layer arm inventory

### Schedule

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | A → bake `data-gosaki-schedule-save-armed` | disarmed |
| Client runtime | dataset → `isClientSaveArmed` | D → C | disarmed |
| Server Edge | `GOSAKI_SCHEDULE_SAVE_ARMED` | B | disarmed |

### Discography

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | A | disarmed |
| Client runtime | dataset → `isClientSaveArmed` | D → C | disarmed |
| Server Edge | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` | B | disarmed |
| Design-only Node | `gosaki-discography-save-ui-arm-design.mjs` | object `=== "true"` (no trim; non-executable) | always `executableSaveAllowed: false` |

### YouTube — Contents path

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | A | disarmed |
| Path switch | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` | A (not a Save arm) | Contents default when unset |
| Server | `GOSAKI_YOUTUBE_URL_SAVE_ARMED` (`supabase/functions/_shared/gosaki-youtube-url-save.ts`) | B | disarmed |

### YouTube — Supabase path

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | A | disarmed |
| Server Edge | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | B | disarmed |

### About — Contents path

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | A | disarmed |
| Server | `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` (`_shared/gosaki-about-content-save.ts`) | B | disarmed |

### About — Supabase path

| Layer | Env / signal | Parser | Default unset |
| --- | --- | --- | --- |
| Client bake | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | A | disarmed |
| Path switch | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | A | Contents default when unset |
| Package bake resolve | same UI arm env in `package-run-marker.mjs` | A | `aboutSaveUiArmed: false` |
| Server Edge | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | B | disarmed (**live docs: unset/false**) |

### Package / HTML verifier (About Admin-path package)

| Check | Evidence | Rule today |
| --- | --- | --- |
| About Save UI | `PACKAGE_RUN.aboutSaveUiArmed` + `data-gosaki-about-save-armed` | Must match expected bake (`"true"` / `"false"` exact attr) |
| Other CMS Save UI | `data-gosaki-youtube-save-armed` / `schedule` / `discography` | If present, must be `"false"` |
| CLI modes | `--expect-about-save-ui-armed` vs `--expect-public-about-build-read` | Mutually exclusive expect flags |
| Default verify | `EXPECTED_ABOUT_ADMIN_PATH_BAKE` | `aboutSaveUiArmed: false` |

### Related (outside operational Save UI, noted for policy scope)

- Historical Schedule/Discography **slice** arms under `src/lib/admin/` use Family A + **multi-arm exclusion** helpers — stronger than Gosaki operational multi-feature package check.
- `cms-core-v2-youtube-supabase-contract.mjs` exports `isExactTrue` as Family **A** (trim) — **name says exact, implementation trims**; **not wired into Edge**.
- Build-read flags (`CMS_KIT_SITE_EMBEDS_BUILD_READ`, `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ`) use Family A — **not Save arms**; keep separate policy.

### Documented live defaults (ops · not code)

| Arm | Documented current |
| --- | --- |
| Client feature Save UI arms | **false** / unset (client-ready package) |
| `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | unset / false |
| `GOSAKI_YOUTUBE_URL_SAVE_ARMED` | false (Contents path closed for routine) |
| Deployed package | `dc1c5b6…` · Save UI disarmed |

---

## 3. Client / server / package differences

| Concern | Client (PUBLIC_*) | Server (Secret / Deno env) | Package verifier |
| --- | --- | --- | --- |
| Who sets | Build-time `.env` / CI bake | Remote function Secret | Reads baked HTML + PACKAGE_RUN |
| Parser | A (trim) | B (no trim) | Attr equality / bake boolean |
| Effect when armed | Enables Save **button / start** | Allows DB / Contents **write** | Proves what was shipped |
| Effect when disarmed | UI Save disabled | `save_not_armed` / 403; dry-run usually still OK | Default expect disarmed |
| Production | Must not bake production host | Staging-ref + production STOP separate | Staging ref HTML checks |

**Responsibility split (recommended + current practice):**

- **Build-time PUBLIC_*:** only client/UI bake — never a substitute for server Secret.
- **Remote Secret (`GOSAKI_*_SAVE_ARMED`):** sole authority for write execution on Edge/Contents.
- **Both required** for a successful non-dry-run Save (client start + server accept).
- **Package verifier:** proves shipped HTML attrs + marker flags; does **not** read live Secrets.

---

## 4. Inconsistencies / risk points (do not silently “fix” in code this phase)

| ID | Issue | Severity | Notes |
| --- | --- | --- | --- |
| R1 | Client trim vs Edge no-trim (`" True "` mismatch) | **P2** | UI can look armed while server rejects |
| R2 | `isExactTrue` name vs trim implementation | P3 | Misleading for future Core helper |
| R3 | Operational multi-feature arms: no hard fail if several PUBLIC_* are true at once | P2 | About **package** verifier enforces other attrs false; bake-time does not globally mutex Schedule∩YouTube∩Discography∩About |
| R4 | Path env + Save UI env both true possible; path selects one | P3 | Not dual-write, but operator confusion |
| R5 | Error / detail strings differ per feature (`must be true` vs `must be exact true` vs `=false` message) | P3 | Keep feature-specific; not a parser issue |
| R6 | Historical slice arms (musician-basic) have multi-arm exclusion; operational Gosaki path weaker | P3 | Policy should converge operational toward package-style single-arm |
| R7 | Design-only Discography arm module uses no-trim `=== "true"` while live client uses trim | P3 | Non-executable today |

**Not treated as config STOP today:** unset / empty / `"false"` / junk → **disarmed** (fail-closed write), not a hard process abort. Matching safety default.

---

## 5. Recommended unified contract (CMS Core v2 policy)

> Policy target. **Existing code already diverges on trim (R1).** Do not pretend current runtime matches this until an explicit implementation phase lands.

### 5.1 Parser vs policy

| Layer | Owns |
| --- | --- |
| **Parser** | Map raw env string → boolean armed / disarmed |
| **Policy** | Which env names, dual client+server requirement, production STOP, multi-arm rules, verifier evidence |
| **Feature** | Approval IDs, Save contracts, user-facing errors, allowlists |

### 5.2 Answers to the ten policy questions

1. **Armed value:** only the exact string `"true"` (no `"TRUE"`, no `"1"`).
2. **trim / case:** **recommended SoT = no trim, no case-fold** (match Edge Family B). Client Family A trim is a **known deviation** to remove later with approval.
3. **Unset / empty / false / junk:** treat as **disarmed** (not a configuration STOP / abort). Write remains fail-closed.
4. **Client vs server parser:** **same parser semantics** should apply to both env strings; boolean hard-gate (Family C) stays after bake.
5. **Production:** arm value is irrelevant — **staging-ref + production STOP** remain mandatory separate gates.
6. **Multi-arm:** **原則禁止** for operational Save UI across Schedule / Discography / YouTube / About (and Contents vs Supabase Save UI for the same surface). Path-enable flags are not Save arms but should not be confused with them.
7. **Package verifier evidence:** `PACKAGE_RUN` bake booleans + HTML `data-gosaki-*-save-armed` exact `"true"`/`"false"`; cross-check other feature arms stay `"false"` when one feature is under test; never treat marker alone as proof without HTML.
8. **Secret vs build-time:** Secrets = server write authority; PUBLIC_* = UI bake only; both required for real Save; verifiers do not assert live Secret values.
9. **Future helper dependency:** Core site-agnostic parser (Node + shared Deno mirror later) ← feature wrappers bind env names / messages. **No Gosaki → Core reverse import.**
10. **Introduction order:** docs (this) → policy fixture verifier (docs/strings only) → optional Core `isArmedEnvExactTrue` **without** wiring → align client bake to no-trim (behavior change for `" True "` only) → Deno import of shared helper → optional multi-arm bake assert. **Never** flip live arms or package defaults in the helper phase.

### 5.3 Safety defaults (adopted)

```txt
armed ⇔ raw === "true"
unset | "" | "false" | other → disarmed
production STOP independent of arm
multi operational Save UI arms ON → forbidden (policy; enforce in later phase)
parser ≠ policy ≠ feature Save contract
```

---

## 6. Compatibility risks if / when unifying

| Change | Risk | Mitigation |
| --- | --- | --- |
| Remove client `.trim()` | Operators who set `" true "` / `"True "` lose UI arm | Document; search env files; prefer exact `true` |
| Wire Edge to shared helper | Mirror drift root↔tools | Byte-match / existing Edge deploy preflight pattern |
| Enforce multi-arm at bake | Breaks experimental dual-env local shells | Gate behind verify mode / explicit flag |
| Treat junk as STOP instead of disarm | Breaks fail-closed “silent disarm” ops habit | **Do not** — keep disarm |

---

## 7. Helper化候補（実装は次フェーズ以降）

| Candidate | Scope | Notes |
| --- | --- | --- |
| `isArmedEnvExactTrue(raw)` | Core Node (+ later Deno) | `raw === "true"` only; **no trim** |
| `assertSingleOperationalSaveArm(env, allowlist)` | Policy helper | Detect multiple PUBLIC_* Save UI arms |
| Feature wrappers | Keep env const + messages | Schedule/Discography/YouTube/About |

**Out of scope for first helper:** changing Edge Secret names, approval IDs, Save payload contracts, Admin HTML structure.

---

## 8. Introduction order (behavior-preserving first)

1. **Done:** this policy doc + AI context pointers
2. Docs/fixture verifier that locks recommended matrix + records R1 divergence
3. Add Core parser **unused** (or used only by new verifier)
4. Switch **client bake** parsers A → exact (explicit phase; tiny behavior change)
5. Point Edge Family B at shared Deno helper (deploy approval)
6. Strengthen package/bake multi-arm assert for all operational attrs
7. **Not now:** Contents YouTube retire · production arm experiments · flipping client-ready package arms

---

## 9. STOP conditions

Stop and ask the operator if a follow-up phase would:

- change live Save arm Secrets or PUBLIC_* on staging/production
- regenerate client-ready package
- unify parser in a way that arms more inputs than today (e.g. accept `"TRUE"`)
- treat disarm as process abort
- touch production or `service_role`
- wire Admin UI copy / Save contracts as part of “parser only” work

---

## 10. Next phase options

| Option | Recommendation |
| --- | --- |
| `cms-core-v2-save-arm-parse-policy-verifier` | **Next** — docs/fixture only |
| `cms-core-v2-save-arm-exact-true-helper` | After verifier; Core helper + optional unused export |
| Client bake no-trim alignment | Separate explicit approval (R1 fix) |
| Edge shared arm helper | After Deno OPTIONS / staging-ref phases as needed |
| Contents YouTube retire | Unrelated · separate |

---

## 11. Safety (this phase)

| Check | Result |
| --- | --- |
| 実装変更なし | **true** |
| Save arm 未変更 | **true** |
| package / FTP / DB / Edge なし | **true** |
| production 未操作 | **true** |
| CLIENT_SHARE_READY 維持 | **true** |
| commit / push なし（Cursor） | **true** |

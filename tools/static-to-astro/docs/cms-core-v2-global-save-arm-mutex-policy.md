# CMS Core v2 — Global Save arm mutex policy (docs-only)

- **Phase:** `cms-core-v2-global-save-arm-mutex-policy`
- **Date:** 2026-07-29
- **Status:** **COMPLETE** (design / inventory only · **no code / helper / verifier / runtime change**)
- **Repo HEAD:** `e508acf34a270b3db678301fa2812f0783f93817`
- **Gosaki deployed staging package (fixed):** `dc1c5b62a58d0462ad6629db4847256d316d4a38`
- **CLIENT_SHARE_READY:** **true**（維持 · regen 不要）
- **Related:** parse policy `cms-core-v2-save-arm-parse-policy.md` · `GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: false`（実装未）
- **This phase:** unified mutex contract for operational Save UI arms · **no** Save / package / FTP / Edge / commit

---

## Gates

```txt
phase: cms-core-v2-global-save-arm-mutex-policy
CMS_CORE_V2_GLOBAL_SAVE_ARM_MUTEX_POLICY_COMPLETE: true
CODE_CHANGED: false
HELPER_IMPLEMENTED: false
VERIFIER_ADDED: false
RUNTIME_CHANGED: false
EDGE_CHANGED: false
SAVE_ARM_CHANGED: false
PACKAGE_GENERATE_EXECUTED: false
FTP_EXECUTED: false
DB_WRITE: false
GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: false
GOSAKI_CLIENT_SHARE_READY_MAINTAINED: true
deployedPackageSourceCommitUnchanged: dc1c5b62a58d0462ad6629db4847256d316d4a38
READY_FOR_ANY_FUTURE_FTP_APPLY: false
PRODUCTION_UNCHANGED: true
```

---

## 1. Scope and non-goals

### In scope

- Operational **client Save UI** arms on Gosaki staging Admin package bake
- How Contents vs Supabase Save UI arms interact with path-enable
- Package / verifier evidence for single-arm shipping
- Site-agnostic Core vs Gosaki adapter responsibility
- Safe introduction order that **does not** regenerate the client-ready package

### Out of scope (this docs phase)

- Implementing mutex helper / wiring / verifier
- Changing `isSaveArmExactTrue` or any env parser
- Server Secret rotation / live arm flips
- Edge / Deno changes
- Legacy musician-basic slice arms (G-6 / G-9 / G-13 / …) — inventory only as **non-operational**

---

## 2. Current arm inventory

### 2.1 Operational client Save UI arms (mutex candidates)

| # | Feature | Env | Bake consumer | HTML evidence |
| --- | --- | --- | --- | --- |
| 1 | Schedule | `PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED` | `isG20u45ScheduleOperationalSaveArmed` | `data-gosaki-schedule-save-armed` |
| 2 | Discography | `PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED` | `isG20u41DiscographyOperationalSaveArmed` | `data-gosaki-discography-save-armed` |
| 3 | YouTube Contents | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_URL_WEB_SAVE_NON_DRY_RUN_ARMED` | `isG11c6aSaveEnabled` (when path **off**) | `data-gosaki-youtube-save-armed` |
| 4 | YouTube Supabase | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | `isGosakiYoutubeSupabaseSaveEnabled` (when path **on**) | same YouTube attr |
| 5 | About Contents | `PUBLIC_ADMIN_GOSAKI_ABOUT_CONTENT_WEB_SAVE_NON_DRY_RUN_ARMED` | `isG12aAboutSaveEnabled` (when path **off**) | `data-gosaki-about-save-armed` |
| 6 | About Supabase | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_SAVE_UI_ARMED` | `isGosakiAboutSupabaseSaveEnabled` (when path **on**) · also `package-run-marker` `aboutSaveUiArmed` | same About attr |

Parser (post exact-true wiring): armed ⇔ `raw === "true"` via `isSaveArmExactTrue`.

**Naming note (not a classification change):** YouTube Supabase client env ends with `SAVE_ARMED` (not `SAVE_UI_ARMED`) but is still a **client Save UI** arm.

### 2.2 Operational server Save accept arms (not v1 mutex)

| Feature | Env | Role |
| --- | --- | --- |
| Schedule | `GOSAKI_SCHEDULE_SAVE_ARMED` | Edge write accept |
| Discography | `GOSAKI_DISCOGRAPHY_SAVE_ARMED` | Edge write accept |
| YouTube Contents | `GOSAKI_YOUTUBE_URL_SAVE_ARMED` | Contents Save accept |
| YouTube Supabase | `GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED` | Edge write accept |
| About Contents | `GOSAKI_ABOUT_CONTENT_SAVE_ARMED` | Contents Save accept |
| About Supabase | `GOSAKI_ABOUT_SUPABASE_SAVE_ARMED` | Edge write accept |

Server arms remain **required** for a real non-dry-run Save together with the matching client arm. They are **not** in the package bake env set, so they cannot be enforced by the same pre-generate gate without Secret reads (forbidden in routine ops).

### 2.3 Non-Save / out of mutex

| Kind | Env / signal | Notes |
| --- | --- | --- |
| Path-enable | `PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED` | Selects Contents vs Supabase **route**; not Save arm |
| Path-enable | `PUBLIC_ADMIN_GOSAKI_ABOUT_SUPABASE_PATH_ENABLED` | Same for About |
| Build-read | `CMS_KIT_SITE_EMBEDS_BUILD_READ` | Public YouTube build overlay |
| Build-read | `CMS_KIT_SITE_PAGE_FIELDS_BUILD_READ` | Public About build overlay |
| Dry-run | feature dry-run endpoints / approvals | Always allowed when Save disarmed |
| Package fixture expect | `--expect-about-save-ui-armed` / `--expect-public-about-build-read` | Verifier **modes**, not live arms |
| Design-only | `gosaki-discography-save-ui-arm-design.mjs` | Non-executable design module |

### 2.4 Legacy / non-operational (explicitly outside operational mutex)

Historical musician-basic / slice arms under `src/lib/admin/` and kit verifiers, e.g.:

- `PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED`
- `PUBLIC_ADMIN_SCHEDULE_G9G*` / `G9G4A*` / `G13C2*` / Discography `G18G2` / `G19B1` …

These already use **pairwise** exclusion helpers in places (stronger than Gosaki multi-route package). They must **not** be mixed into the operational 6-arm mutex without a separate phase. Parse-policy verifier already allowlists them as historical extras.

### 2.5 Coverage check (this docs phase)

All six operational PUBLIC Save UI env names appear in:

- `gosaki-staging-read-only-admin.ts` (definitions + exact-true readers)
- `cms-core-v2-save-arm-parse-policy-fixtures.mjs` inventory
- About Supabase also in `package-run-marker.mjs` bake resolve
- YouTube/About contracts for constant names

Path-enable / build-read are listed separately in fixtures `NON_SAVE_ARM_ENVS` — **classification OK**.

---

## 3. Current simultaneous-arm inspection (as implemented today)

| Layer | What it checks | Gap |
| --- | --- | --- |
| Admin bake (`GosakiStagingReadOnlyAdminPage.astro`) | Path selects **one** YouTube Save env and **one** About Save env for the HTML attr | Does **not** fail if Schedule∩Discography∩YouTube∩About multiple attrs would be `"true"`; does **not** fail if dormant Contents+Supabase both `=== "true"` |
| `package-run-marker` About Admin-path validator | When validating About package HTML: YouTube / Schedule / Discography attrs must be `"false"` if present | Runs in **About package verify path only**; not a global pre-generate gate; not applied to Schedule-armed or YouTube-armed packages symmetrically |
| Parse-policy verifier | Explicitly asserts **no** global bake mutex helper; records `GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: false` | Docs/gap only |
| Musician-basic historical | Pairwise “cannot both be on” for specific slice arms | Different surface · not operational Gosaki multi-route |

**Verdict:** partial **post-bake HTML** cross-check for About-centric packages only. **No** global env-level mutex. Matches parse-policy risk **R3**.

---

## 4. Accident scenarios (why mutex)

| ID | Scenario | Risk |
| --- | --- | --- |
| A1 | Operator sets Schedule + Discography Save UI `true` in one bake | Two Save buttons live in one staging Admin package → wrong feature write / confused approval |
| A2 | YouTube Contents + YouTube Supabase both `true` while path toggles | Dormant arm still true; path flip suddenly arms the other Save contract without intentional re-arm |
| A3 | About Contents + About Supabase both `true` | Same as A2 for About |
| A4 | About Save UI armed package ships with YouTube attr `"true"` | Partial About verifier catches this **if** that validator runs; other package modes may not |
| A5 | Multi client arms armed + one server Secret armed | UI looks broadly armed; only one server may accept → confusing `save_not_armed` / wrong surface |
| A6 | Treating path-enable / build-read as Save arms | False mutex trips; blocks legitimate Admin-path + public build-read packages |

---

## 5. Recommended mutex contract (v1)

> Policy target. **Not implemented.** Do not claim `GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: true` until an explicit implementation phase.

### 5.1 Answers to design questions

| # | Question | Recommended decision |
| --- | --- | --- |
| 1 | Mutex target | **Operational client Save UI arms only** (the 6 PUBLIC envs in §2.1) |
| 2 | Server arms in same mutex? | **No for v1** — separate optional later policy (`server-save-arm-mutex`); Secrets are not bake-time |
| 3 | Contents + Supabase both ON in one feature? | **Forbidden** — count **raw** `=== "true"` on both envs (not only active path). Aligns with parse-policy “Contents vs Supabase Save UI 原則禁止” |
| 4 | Max armed count | **≤ 1** across the 6 operational client Save UI arms |
| 5 | Zero armed | **Normal** (client-ready / routine packages) |
| 6 | STOP stage for ≥2 | **Primary: package generate / bake-env evaluation before emit** · **Secondary: package verifier** · Admin runtime hard-fail = optional later (defense in depth; not first wire) |
| 7 | Fail-closed reason | See §7 |
| 8 | vs production STOP | **Production / staging-ref STOP always wins** — evaluate before or independently of mutex; mutex never relaxes production gates |
| 9 | Feature contracts | Mutex only counts / lists env ids; does **not** change approval IDs, payloads, Edge messages, or Save allowlists |
| 10 | Core vs adapter | See §6 |
| 11 | New site / feature registration | Site adapter registers `{ id, env, feature, htmlAttr? }` into a Core inventory list; Core evaluates; unknown discovered PUBLIC operational arms fail verifier |
| 12 | Unregistered new arm detection | Extend existing parse-policy discovery pattern: any new `PUBLIC_*SAVE*_ARMED` / `*NON_DRY_RUN_ARMED` literal must be inventory **or** historical allowlist |
| 13 | Package evidence | See §8 |
| 14 | Keep deployed package | Docs → inventory verifier → helper unwired → wire **only** on next intentional generate; never force regen of `dc1c5b6…` |

### 5.2 Evaluation rule (conceptual)

```txt
armedClients = { env in OPERATIONAL_CLIENT_SAVE_UI_ARMS | isSaveArmExactTrue(envValue) }
count = |armedClients|
if production/staging-ref FAIL → STOP (independent)
if count == 0 → OK (disarmed package)
if count == 1 → OK (single controlled Save UI)
if count >= 2 → FAIL multi_operational_save_ui_armed
```

Path-enable / build-read / dry-run / server Secrets: **ignored** by this counter.

### 5.3 Divergence vs current runtime (do not paper over)

| Topic | Current | Recommended | Conflict? |
| --- | --- | --- | --- |
| Active path collapses Contents/Supabase to one HTML attr | Yes | Still true at bake | **No conflict** — mutex is **stricter** on dormant env |
| About package other-attr false check | Exists | Keep + generalize | Compatible |
| Bake-time env mutex | Missing | Add at generate | New behavior for **future** generates only |
| Server multi-Secret | Unchecked | Deferred | Explicit deferral |
| Historical slice pairwise mutex | Exists on musician-basic | Stay separate | Compatible |

---

## 6. Client / server responsibility split

| Layer | Owns | Mutex v1 |
| --- | --- | --- |
| Client PUBLIC_* | UI / button start · package HTML attrs | **Yes** |
| Server Secret | Write accept · `save_not_armed` | **No** (document ops: prefer ≤1 server Secret armed too, but no automated Secret scan) |
| Dual-arm Save contract | Feature still requires **matching** client+server for success | Unchanged |
| Path-enable | Route selection only | Out of mutex |

**Ops guidance (non-code):** when arming a controlled Save, keep other feature **server** Secrets false/unset as well — but that is **runbook**, not this mutex gate.

---

## 7. Core / site adapter dependency

```txt
save-arm-utils.mjs                 ← parser SoT (exists · exact true)
  ↑
save-arm-mutex-utils.mjs (future)  ← evaluateOperationalClientSaveUiMutex(env, inventory)
  ↑                                   site-agnostic · no gosaki- imports · no feature approvals
gosaki-save-arm-inventory.mjs      ← registers 6 env names + html attrs (site adapter)
  ↑
package generate / verify / (later) Admin bake assert
```

- **Core:** inventory shape, count, reason codes, fixture matrix, production-priority note
- **Gosaki adapter:** env names, feature labels, which HTML attrs map to which arms, package marker fields
- **Feature modules:** keep approval IDs / Save payloads / user-facing Japanese reasons untouched
- **Forbidden:** Core importing Gosaki feature Save contracts

### Reason codes (proposal)

| Code | When |
| --- | --- |
| `multi_operational_save_ui_armed` | `count >= 2` |
| `operational_save_ui_arm_ok` | `count <= 1` (success path detail) |
| `production_ref_stop` / `staging_ref_required` | Existing staging-ref codes — **evaluated first / independently** |

Error detail should list **armed env names** (not rewrite feature Save error strings).

---

## 8. Package evidence (future generate)

When mutex is wired into generate/verify:

| Evidence | Content |
| --- | --- |
| `PACKAGE_RUN` (or sibling) | `operationalSaveUiArmedCount` · `operationalSaveUiArmedEnvs: string[]` · `mutexPolicyVersion` |
| HTML | At most one of `data-gosaki-*-save-armed="true"` among schedule / discography / youtube / about |
| Verifier | Default mode: all four attrs `"false"` or absent; armed expect-mode: exactly one `"true"` and others `"false"` |
| Marker alone | Never sufficient without HTML cross-check (existing About rule retained) |

Deployed `dc1c5b6…` already has all Save UI disarmed → **already satisfies** the ≤1 rule; no regen required for policy compliance of the live package.

---

## 9. Fixture matrix (for a future verifier · not implemented now)

| Case | Env set | Expected |
| --- | --- | --- |
| all unset / false | {} | OK · count 0 |
| Schedule only true | Schedule | OK · count 1 |
| Schedule + Discography true | both | FAIL · `multi_operational_save_ui_armed` |
| YouTube Contents + YouTube Supabase true | both | FAIL (even if path selects one) |
| About Contents + About Supabase true | both | FAIL |
| About Supabase true + path-enable true + build-read true | Save + non-Save | OK · count 1 (path/build-read ignored) |
| About true + Schedule true | both | FAIL |
| padded `" true "` | any | disarmed by parser · not counted |
| production host bake | any arms | **production STOP first** |

---

## 10. Phased introduction (keep client-ready package)

| Step | Phase (suggested id) | Changes deployed package? |
| --- | --- | --- |
| 0 | **This docs** `cms-core-v2-global-save-arm-mutex-policy` | No |
| 1 | Inventory + fixture verifier (assert policy flags; still `IMPLEMENTED: false` until wired) | No |
| 2 | Core `evaluateOperationalClientSaveUiMutex` **unwired** | No |
| 3 | Wire into **package generate / marker** (fail closed before emit) | Only on **next intentional** generate — not auto |
| 4 | Wire into package verifier (all profiles, not About-only) | Verifies future packages |
| 5 | Optional Admin bake assert / runtime | Optional |
| 6 | Optional server-Secret mutex runbook / tooling | Separate approval |

**Never** force FTP or regenerate `dc1c5b6…` solely to “activate” mutex docs.

---

## 11. STOP conditions (ask human)

Stop and ask before implementation if:

- Mutex seems to require reading live Supabase Secrets
- Scope expands to musician-basic historical slice arms
- Someone wants to allow Contents+Supabase dual client arms “for convenience”
- Production package or production host bake is involved
- Client-ready package regen is proposed without explicit ops need
- Mutex would change feature approval IDs or Save payloads

---

## 12. Next minimal implementation candidates

Recommended order after this docs phase:

1. **`cms-core-v2-global-save-arm-mutex-inventory-verifier`** — fixtures + discovery coverage; still `GLOBAL_MULTI_ARM_MUTEX_IMPLEMENTED: false`
2. **`cms-core-v2-global-save-arm-mutex-helper`** — Core evaluate helper, unwired
3. **`cms-core-v2-global-save-arm-mutex-package-gate`** — wire generate + verifier (explicit approval; no forced client-ready regen)

Parallel (unrelated): Edge shared `isSaveArmExactTrue` mirror · Contents YouTube retire · client staging share ops.

---

## 13. Safety

| Check | Result |
| --- | --- |
| docs-only | **true** |
| helper / verifier / runtime 未変更 | **true** |
| Save arm / Secret 未変更 | **true** |
| package / FTP / DB なし | **true** |
| production 未操作 | **true** |
| CLIENT_SHARE_READY 維持 | **true** |
| deployed package 未再生成 | **true** |
| commit / push なし（Cursor） | **true** |

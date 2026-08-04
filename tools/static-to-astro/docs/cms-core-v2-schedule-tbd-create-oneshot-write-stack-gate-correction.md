# CMS Core v2 — Schedule TBD CREATE oneshot write-stack gate correction

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction`
- **Date:** 2026-08-04
- **HEAD at start:** `8a1294deaebc8bd966c790e33f67fcdb9bea1912` (= `origin/main` · clean)
- **Status:** **COMPLETE (docs + offline matrix · no env mutation)** · superseded delivery: **process-scoped** `env … npm run dev` · **Auth packet:** `cms-core-v2-schedule-tbd-create-oneshot-process-scoped-auth-packet-correction` (**exactly 9 keys**)
- **This phase:** audit shared write-stack fan-out · prove oneshot-only when write **7 keys** exact · **no** arm ON · **no** Save · **no** DB write
- **Follow-up:** process-scoped env packet · then **Auth packet** — execution uses **exactly 9 keys** (Auth 2 + write 7) · **forbid** writing those keys into shared root `.env.local`
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **Production STOP:** `vsbvndwuajjhnzpohghh`

Prior: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-arm-gate` found write-stack insufficient for Save.

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_WRITE_STACK_GATE_CORRECTION_COMPLETE: true
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_PROCESS_SCOPED_AUTH_PACKET_CORRECTION_COMPLETE: true
IMPLEMENTATION_READY: true
PREFLIGHT_PASS: true
EXECUTION_PACKET_READY: true
ACTUAL_WRITE_READY: false
ACTUAL_WRITE_EXECUTED: false
ARMS_OFF: true
ENV_CHANGED: false
DB_WRITE_EXECUTED: false
SAVE_EXECUTED: false
PACKET_ONESHOT_ONLY_PROVEN: true
PROCESS_SCOPED_ENV_REQUIRED: true
ENV_FILE_UNCHANGED: true
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-arm-gate
```

`ACTUAL_WRITE_READY: false` until human re-runs arm-gate with **process-scoped** **exactly 9-key** `env … npm run dev` (never edit `.env.local` for these keys).
`EXECUTION_PACKET_READY: true` — process-scoped 9-key packet + offline-stack offline matrix proves oneshot-only · Auth 2 required for real login.

**Write 7 alone:** oneshot write config can `saveEnabled=true`, but Auth stays **mock** → real login **impossible** → execution **cannot** proceed.

---

## 1. Shared write-stack 4 values — call graph

Shared env (not oneshot-specific):

| Env | Role |
| --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | Master staging-write flag (`=== "true"`) |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | Provider string (oneshot: exact `"supabase"`, **no trim**) |
| `PUBLIC_ADMIN_WRITE_MODULE` | Module string (oneshot: exact `"schedule"`, **no trim**) |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | Must **exact-match** each feature’s own approval ID |

### 1.1 Runtime consumers (fan-out)

Every non-dry-run Save path that reads these four also requires **its own dedicated arm** (or dual arms) and **its own approval ID**. Setting the four to **oneshot** values cannot satisfy another feature’s approval / module / provider.

| Feature | Config / UI | Final write | Dedicated arm(s) | Dry-run | Approval required | 4-stack alone writes? |
| --- | --- | --- | --- | --- | --- | --- |
| **TBD CREATE oneshot** | `getTbdCreateOneshotConfig` · `#gosaki-add-tbd-create-oneshot-btn` | `executeTbdCreateOneshotSave` → private INSERT | client + server oneshot arms | exact `PUBLIC_ADMIN_WRITE_DRY_RUN==="false"` | `cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` | **No** (arms + dry-run false required) |
| G-22e new event INSERT | `getG22eNewEventInsertConfig` | G-22e insert save | `PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_…_ARMED` | dry-run false | G-22e approval | **No** (arm + **different** approval) |
| G-22d duplicate INSERT | `getG22dDuplicateInsertConfig` | G-22d insert | G-22d arm | dry-run false | G-22d approval | **No** |
| G-22f unpublish | `getG22fUnpublishUpdateConfig` | unpublish UPDATE | G-22f arm | dry-run false | G-22f approval | **No** |
| G-22h republish | `getG22hRepublishUpdateConfig` | republish UPDATE | G-22h arm | dry-run false | G-22h approval | **No** |
| G-9k existing Save button | `getG9kExistingEventSaveButtonConfig` | existing-event UPDATE | G-9k arm | dry-run false | G-9k approval | **No** |
| G-9j existing UPDATE | `getG9jExistingEventUpdateConfig` | UPDATE | G-9j arm | dry-run false | G-9j approval | **No** |
| G-6-g1 / G-6-g2 general edit | `getScheduleGeneralEditConfig` / G6G2 | schedule UPDATE | G-6-g1 / G-6-g2 arms | dry-run false | G-6-g1 / G-6-g2 approvals | **No** |
| G-9g2…G-9g4a2c site-slug PoCs | `getG9G2TitlePocConfig` etc. | field UPDATE | each G-9g* arm | dry-run false | each G-9g* approval | **No** |
| G-13c1 / G-13c2 cleanup | event A/B cleanup configs | DELETE/cleanup | cleanup arms | dry-run false | cleanup approvals | **No** |
| Discography scalar / G16–G19 | `getDiscographyScalarSliceSaveConfig` etc. | discography UPDATE | discography arms | dry-run false | discography approval · **module=`discography`** | **No** (module mismatch under oneshot stack) |
| YouTube static-json (G-10c) | `getG10cYoutubeEmbedStaticJsonWriteConfig` | Contents/static write | YouTube arms | dry-run false | G-10c approval · **provider=`static-json`** · module youtube-embed | **No** |
| About static-json (G-10h4*) | About write configs | Contents write | About arms | — | About approvals · different provider/module defaults | **No** under oneshot stack |
| G-6-d profile PoC | `getStagingWriteConfig` | profile update | (writeFlag+approval+module=`profile`) | dry-run gate | `G-6-d-staging-profile-update-poc` | **No** (module/`approval` mismatch) |
| Routine TBD / confirmed admin Save | `schedule-tbd-admin-ui` | uses oneshot `tbdWriteEnabled` only for non-dry CREATE | oneshot dual arms | dry-run false | oneshot approval | **No** without oneshot arms |

**STOP check:** Offline matrix **B/C** — write-stack 4 alone (arms OFF) → **all** sampled write configs `saveEnabled`/`canWrite`/`armed` **false**. No alternate write path arms from the four values alone.

Page SSR helpers (`*-page-config.ts`) only **mirror** the four into client env snapshots; they do not bypass dedicated arms.

---

## 2. Exact parse + env precedence

### 2.1 Oneshot (`getTbdCreateOneshotConfig`)

| Env | Parse |
| --- | --- |
| `ENABLE_ADMIN_STAGING_WRITE` | `=== "true"` — no trim · case-sensitive · `"True"` / `" true"` **fail** |
| `PUBLIC_ADMIN_WRITE_PROVIDER` | `String(… ?? "")` **no trim** · must `=== "supabase"` |
| `PUBLIC_ADMIN_WRITE_MODULE` | `String(… ?? "")` **no trim** · must `=== "schedule"` |
| `PUBLIC_ADMIN_WRITE_APPROVAL_ID` | `String(… ?? "")` **no trim** · must `=== cms-core-v2-schedule-tbd-create-non-dry-run-oneshot` |
| Client/server oneshot arms | `isSaveArmExactTrue` · raw `=== "true"` only |
| `PUBLIC_ADMIN_WRITE_DRY_RUN` | write path needs exact `=== "false"` |

Many peer Schedule configs **do** `.trim()` provider/module/approval. Oneshot does **not** — trailing whitespace → oneshot STOP.

### 2.1b Auth (`getStagingAuthConfig`) — required for real login

| Env | Parse |
| --- | --- |
| `ENABLE_ADMIN_STAGING_AUTH` | `=== "true"` |
| `PUBLIC_ADMIN_AUTH_PROVIDER` | trim · must `"supabase"` (default `"mock"`) |

Baseline (not process-injected): `ENABLE_ADMIN_STAGING_SHELL=true` · staging `PUBLIC_SUPABASE_URL` + anon · **no** `service_role` · **no** production URL.

### 2.2 Precedence (Astro / Vite)

Vite `loadEnv` (Astro uses prefix `""`): **process env overrides** `.env` / `.env.local` for the same keys.

For oneshot **execution**, inject **exactly 9 keys** via **process-scoped** `env … npm run dev` only (Auth 2 + write 7).
Root `.env.local` stays at **safe baseline** (shared with Sariswing本体 — **do not** write the 9 keys into it).

Effective staging URL still comes from baseline `.env.local` (overrides `.env`):

- Host contains staging ref `kmjqppxjdnwwrtaeqjta`
- Does **not** contain production `vsbvndwuajjhnzpohghh`
- Do **not** inject production URL/ref on the armed command

**Client:** PUBLIC_* (auth provider · write provider/module/approval/dry-run/client arm) via `import.meta.env`.
**SSR:** private `ADMIN_*` server arm + `ENABLE_ADMIN_STAGING_WRITE` / `ENABLE_ADMIN_STAGING_AUTH` via `import.meta.env` → booleans / gates JSON.
**Client ENABLE_*:** SSR gates → `mergeStagingShellEnv`.

### 2.3 Production STOP

`looksLikeProductionBlocked` / URL contains production ref / allowlist fail → oneshot `saveEnabled` false · INSERT boundary rejects.

---

## 3. Offline config matrix (verifier · no live env edit)

### 3.1 Write-stack matrix (oneshot `saveEnabled` only)

| Case | Setup | Expected |
| --- | --- | --- |
| **A** | baseline: write-stack empty/false · oneshot arms OFF · dry-run true | oneshot write **不可** |
| **B** | write-stack 4 oneshot values · arms OFF · dry-run true | **all** writes **不可** |
| **C** | write-stack 4 · dry-run false · arms OFF | **all** writes **不可** |
| **D** | oneshot 3 (dual arm + dry-run false) · write-stack不足 | oneshot **不可** |
| **E** | write **7 keys exact** · peers OFF · staging URL | **oneshot only** `saveEnabled=true` (Auth still mock unless Auth 2 also set) |
| **F** | E + one peer arm ON | oneshot **STOP** |
| **G** | E + production URL | oneshot **STOP** |
| **H** | E + approval/provider/module mismatch | oneshot **STOP** |
| **I** | E | routine TBD / confirmed / G-22e / G-9k / G-6-g1 / discography / YouTube / G-6-d **not** armed |

### 3.2 Auth + write execution matrix

| Case | Setup | Login | Oneshot write |
| --- | --- | --- | --- |
| **A′** | write **7 keys** only | **不可** (Auth mock) | config may arm · **実行不能** |
| **B′** | Auth **2 keys** only | staging login **可** | write **不可** |
| **C′** | **exactly 9 keys** · peers OFF · staging | owner login **可** | oneshot **のみ** |
| **D′** | C′ + production URL/ref | **STOP** | **STOP** |
| **E′** | C′ · unauthenticated / non-owner | — | **INSERT 0** (`isSignedInStagingAuth` + RLS) |
| **F′** | C′ · login only · no Save click | ok | **write 0** · `writeRequests=[]` |

Verifier: `verify:cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction`

---

## 4. Exact process-scoped 9-key ON command (human execution only)

**Forbidden:** writing these **9 keys** into root `.env.local` (shared with Sariswing本体).

```zsh
cd ~/sariswing-astro

env \
  ENABLE_ADMIN_STAGING_AUTH=true \
  PUBLIC_ADMIN_AUTH_PROVIDER=supabase \
  ENABLE_ADMIN_STAGING_WRITE=true \
  PUBLIC_ADMIN_WRITE_PROVIDER=supabase \
  PUBLIC_ADMIN_WRITE_MODULE=schedule \
  PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot \
  PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true \
  ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true \
  PUBLIC_ADMIN_WRITE_DRY_RUN=false \
  npm run dev
```

- Does **not** `export` into the parent shell
- **exactly 9** values apply **only** to that npm/Astro process
- Baseline files still provide `ENABLE_ADMIN_STAGING_SHELL=true` + staging URL/anon (secrets not documented) — **no** `service_role`
- **Do not** inject production URL/ref
- **Do not** arm peer Save envs · **Do not** armed `build`/package/FTP
- Write 7 alone → Auth mock → login **不可**
- Auth 2 alone → write **不可**
- Login alone → write **0** · Save click required
- Unauthenticated / non-owner → **INSERT 0**
- Other write paths: dedicated arm / approval mismatch → **disabled**
- **PACKET_ONESHOT_ONLY_PROVEN: true** (write matrix E/I + Auth matrix C′)

---

## 5. Exact OFF = stop armed process (no `.env.local` restore)

1. **Ctrl+C** the armed terminal — Auth **2** + write **7** all vanish
2. Confirm port 4321 has no LISTEN
3. `.env.local` was never changed — file baseline remains Auth mock / write OFF / empty provider·module·approval / dry-run true / oneshot arms unset
4. Optional plain restart: `cd ~/sariswing-astro && npm run dev` → Auth **mock** · oneshot wrap hidden · `data-save-enabled="false"`

Timeout / ambiguous: **Ctrl+C first**, then exact SELECT — do **not** re-arm by restarting with `env …` until human decides.

Cleanup: armed process must be ended **before** any DELETE.

---

## 6. SoT correction

Supersedes “temporary **3** keys”, “write 7 keys into `.env.local`”, and “process-scoped **exactly 7 keys**” as the **execution** packet.

Correct temporary arming = **process-scoped** `env … npm run dev` with **exactly the 9 keys** above (Auth 2 + write 7).

Write-stack offline proof of oneshot-only still uses write **7 keys** for `saveEnabled` (matrix E) — that does **not** replace the Auth requirement for human execution.

---

## 7. Explicit non-goals (this phase)

- No `.env.local` edit (Cursor or operator) for the oneshot **9 keys**
- No arm ON · no process start · no Save · no SQL · no DB write
- No commit/push unless operator asks

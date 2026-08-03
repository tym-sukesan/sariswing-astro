# CMS Core v2 — Schedule TBD CREATE oneshot write-stack gate correction

- **Phase:** `cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction`
- **Date:** 2026-08-04
- **HEAD at start:** `8a1294deaebc8bd966c790e33f67fcdb9bea1912` (= `origin/main` · clean)
- **Status:** **COMPLETE (docs + offline matrix · no env mutation)**
- **This phase:** audit shared write-stack fan-out · fix SoT from “3 keys” → **7 keys** · prove oneshot-only when exact · **no** arm ON · **no** Save · **no** DB write
- **Staging:** `kmjqppxjdnwwrtaeqjta` · **Production STOP:** `vsbvndwuajjhnzpohghh`

Prior: `cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-arm-gate` found write-stack insufficient for Save.

---

## 0. Gates

```txt
CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_WRITE_STACK_GATE_CORRECTION_COMPLETE: true
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
PRODUCTION_UNCHANGED: true
READY_FOR_ANY_FUTURE_FTP_APPLY: false
NEXT_PRIMARY_RECOMMENDED: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-execution-arm-gate
```

`ACTUAL_WRITE_READY: false` until human re-runs arm-gate with 7-key packet and explicit execution approval.
`EXECUTION_PACKET_READY: true` — packet definition corrected to 7 keys; offline matrix proves oneshot-only.

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

### 2.2 Precedence (Astro / Vite)

1. Process env
2. `.env.[mode].local`
3. `.env.local` (**overrides** `.env`)
4. `.env.[mode]`
5. `.env`

**Effective staging shell:** repo root `.env.local` overrides root `.env`.
Confirm without printing secrets:

- Effective URL host contains staging ref `kmjqppxjdnwwrtaeqjta`
- Does **not** contain production `vsbvndwuajjhnzpohghh`
- Or: SSR `#gosaki-schedule-tbd-create-oneshot-config` / host gate fails if production baked

`mergeStagingShellEnv` may overlay `ENABLE_ADMIN_STAGING_*` from SSR DOM gates onto client `import.meta.env` — restart after any write-flag change.

### 2.3 Production STOP

`looksLikeProductionBlocked` / URL contains production ref / allowlist fail → oneshot `saveEnabled` false · INSERT boundary rejects.

---

## 3. Offline config matrix (verifier · no live env edit)

| Case | Setup | Expected |
| --- | --- | --- |
| **A** | baseline: write-stack empty/false · oneshot arms OFF · dry-run true | oneshot write **不可** |
| **B** | write-stack 4 oneshot values · arms OFF · dry-run true | **all** writes **不可** |
| **C** | write-stack 4 · dry-run false · arms OFF | **all** writes **不可** |
| **D** | oneshot 3 (dual arm + dry-run false) · write-stack不足 | oneshot **不可** |
| **E** | **7 keys exact** · peers OFF · staging URL | **oneshot only** `saveEnabled=true` |
| **F** | E + one peer arm ON | oneshot **STOP** |
| **G** | E + production URL | oneshot **STOP** |
| **H** | E + approval/provider/module mismatch | oneshot **STOP** |
| **I** | E | routine TBD / confirmed / G-22e / G-9k / G-6-g1 / discography / YouTube / G-6-d **not** armed |

Verifier: `verify:cms-core-v2-schedule-tbd-create-oneshot-write-stack-gate-correction`

---

## 4. Exact 7-key ON packet (human execution only)

```txt
# Shared write-stack (temporary · restore after)
ENABLE_ADMIN_STAGING_WRITE=true
PUBLIC_ADMIN_WRITE_PROVIDER=supabase
PUBLIC_ADMIN_WRITE_MODULE=schedule
PUBLIC_ADMIN_WRITE_APPROVAL_ID=cms-core-v2-schedule-tbd-create-non-dry-run-oneshot

# Oneshot temporary
PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED=true
ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED=true
PUBLIC_ADMIN_WRITE_DRY_RUN=false
```

Also required (verify present · usually already true · not part of mutation if already set):

- `ENABLE_ADMIN_STAGING_SHELL=true`
- staging `PUBLIC_SUPABASE_URL` / anon (secrets not documented)

**Do not** arm peer Save envs. **PACKET_ONESHOT_ONLY_PROVEN: true** (matrix E/I).

---

## 5. Exact OFF / restore packet

Restore to **pre-execution observed baseline** (arm-gate 2026-08-04):

```txt
# unset oneshot arms (prefer remove keys):
# PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED
# ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED

PUBLIC_ADMIN_WRITE_DRY_RUN=true

# restore shared write-stack to pre-state:
ENABLE_ADMIN_STAGING_WRITE=false
PUBLIC_ADMIN_WRITE_PROVIDER=
PUBLIC_ADMIN_WRITE_MODULE=
PUBLIC_ADMIN_WRITE_APPROVAL_ID=
```

Then **restart** Astro (`cd ~/sariswing-astro && npm run dev`).
Confirm oneshot wrap hidden · `data-save-enabled="false"` · peers still OFF.

Shared 4 **must** be restored: leaving `ENABLE_ADMIN_STAGING_WRITE=true` + wrong approval widens accidental arm surface for a later mistaken arm ON.

---

## 6. SoT correction

Supersedes “temporary **3** keys only” in final-preflight / arm-gate narration.

Correct temporary mutation = **7 keys** (4 write-stack + 3 oneshot/dry-run).

---

## 7. Explicit non-goals (this phase)

- No `.env.local` edit by Cursor
- No arm ON · no process restart · no Save · no SQL · no DB write
- No commit/push unless operator asks

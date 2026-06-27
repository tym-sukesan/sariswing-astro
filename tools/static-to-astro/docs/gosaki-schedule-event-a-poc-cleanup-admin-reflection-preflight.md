# G-13d2 — Gosaki Event A PoC cleanup admin reflection preflight

**Phase:** `G-13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight`  
**Status:** preflight complete — **no Save / DB write / package regen / upload in this phase**  
**Base commit:** `bbb223c`  
**Prior:** G-13d1 local implementation (`gosaki-schedule-event-a-poc-cleanup-local-implementation.md`)  
**Type:** read-only planning — admin reflection path only

## Summary

G-13d1 で追加した **G-13c1 Event A cleanup** UI は、Gosaki **full Schedule operator admin**（staging shell）に属します。**公開サイト manual-upload パッケージ（`/cms-kit-staging/gosaki-piano/admin/` の read-only admin）には含まれません。**

したがって G-13c1 を operator が使うには **local Astro dev の再起動**で十分です。`convert` / `build` / `manual-upload:package` は **G-13d1 admin 反映には不要**（public schedule 反映は DB cleanup 後の別フェーズ）。

**No Save / DB write / SQL / FTP / package regen / commit in this phase.**

---

## 1. Git state (verified)

```txt
git status --short: (empty)
HEAD: bbb223c
origin/main: bbb223c
branch: main...origin/main
```

---

## 2. G-13d1 変更が入った admin template / 経路

### Primary — full Schedule operator (G-13c1 対象)

| Layer | Path |
|-------|------|
| **Operator markup** | `tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro` |
| **Page wrapper** | `tools/static-to-astro/templates/admin-cms/gosaki/pages/GosakiStagingAdminSchedulePage.astro` |
| **Client UI** | `src/lib/admin/staging-data/gosaki-schedule-event-a-poc-cleanup-ui.ts` |
| **Write stack** | `src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-{config,guards,dry-run,save}.ts` |
| **Route entry** | `src/pages/__admin-staging-shell/musician-basic/admin/schedule/index.astro` |
| **Astro injectRoute** | `astro.config.mjs` → `/__admin-staging-shell/musician-basic/admin/schedule` |

**Operator URL (local dev):**

```txt
http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/
```

**Gate:** `import.meta.env.DEV === true` **かつ** `ENABLE_ADMIN_STAGING_SHELL=true`（`schedule/index.astro`）。本番 static build では shell disabled ページになる。

### Not in scope — online read-only admin

| Layer | Path |
|-------|------|
| Convert hook | `scripts/lib/gosaki-staging-read-only-admin.mjs` |
| Page | `templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro` |
| Deployed URL | `https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/` |

Read-only admin は Schedule placeholder のみ。**G-13c1 パネルは含まれない。** `build-gosaki-staging-admin-package.mjs` を実行しても G-13c1 は `/admin/` に現れない。

---

## 3. Admin 反映に必要な手順

### A. G-13c1 operator UI を確認する（推奨 — 今回の目的）

```bash
# repo root (sariswing-astro)
# .env.local に staging PUBLIC_SUPABASE_* が既にある前提（変更しない）

ENABLE_ADMIN_STAGING_SHELL=true \
ENABLE_ADMIN_STAGING_WRITE=true \
PUBLIC_ADMIN_WRITE_DRY_RUN=true \
npm run dev
```

1. ブラウザで `http://localhost:4321/__admin-staging-shell/musician-basic/admin/schedule/` を開く
2. staging admin にログイン（既存 G-11c4d 手順）
3. ページ下部に **「G-13c1 — Event A PoC 文言クリーンアップ」** セクションがあることを確認
4. **「G-13c1 変更を確認（dry-run）」** で Preview のみ（Save は押さない）
5. Save ボタンが **「Event A cleanup 保存（無効）」** のままであることを確認

**FTP / manual-upload: 不要**

### B. 公開 read-only admin を更新する場合（G-13d1 とは無関係）

G-13c1 確認が目的なら **実行しない**。YouTube / About 等の read-only 表示更新が別途必要なときのみ:

```bash
cd tools/static-to-astro
node scripts/build-gosaki-staging-admin-package.mjs
# → operator manual upload（別承認）
```

---

## 4. package 再生成が必要か

| 目的 | convert / build / manual-upload 必要? |
|------|--------------------------------------|
| **G-13c1 admin UI を operator が使う** | **No** — local dev のみ |
| **公開 schedule に PoC 文言除去を反映** | **Yes** — ただし **DB cleanup 後**（G-13e 系） |
| **read-only `/admin/` を更新** | Optional — G-13c1 は載らない |

**結論（G-13d2）:** G-13d1 admin 反映のための package 再生成は **不要かつ非推奨**（無関係な public 差分リスクのみ）。

---

## 5. Save gate off のまま admin 反映は安全か

| Surface | Save gate | 反映して安全? |
|---------|-----------|---------------|
| **Local staging shell** (`__admin-staging-shell`) | `getG13c1EventAPocCleanupConfig().saveEnabled === false`（routine dev） | **Yes** — Preview only; Save disabled |
| **G-13c1 Save ボタン** | `disabled` + compile gate off + arm off | **Yes** — UI 表示のみ |
| **G-9k operator Save** | 既存 gate 維持 | **Yes** — unchanged |
| **Read-only `/admin/` upload** | Save/Publish 常に disabled | **Yes** — G-13c1 未含有 |

**Conditions for safe Preview-only reflection:**

```txt
PUBLIC_ADMIN_WRITE_DRY_RUN=true
PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED=false (or unset)
PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED=false (or unset)
ENABLE_ADMIN_STAGING_WRITE=true  # Supabase read + dry-run only
```

Preview は `executeG13c1EventAPocCleanupDryRun` — `actualWrite: false`, `supabaseWriteCalled: false`。

---

## 6. package 再生成時の不要差分リスク（参考）

`build-gosaki-staging-admin-package.mjs` は **サイト全体**を再生成する:

| Artifact | 差分要因 | G-13d1 関連 |
|----------|----------|-------------|
| `schedule/`, `2026-*/` | fixture + convert 時 Supabase read | **無関係**（DB 未変更なら現行と同等のはず） |
| `index.html` YouTube | `gosaki-piano-youtube-embed.json` | **無関係** |
| `admin/index.html` | read-only template | **G-13c1 不含** |
| `_astro/*.css` | build hash 変動 | 常に変わりうる |
| `about/` 等 | JSON / band images | **無関係** |

**推奨:** G-13d2 では package 再生成 **しない**。DB cleanup 完了後の G-13e で public schedule のみ targeted regen。

---

## 7. 手動アップロードが必要になる場合の対象パス

### G-13d1 admin UI 反映

**Upload 不要**（local dev のみ）。

### 将来 — public schedule PoC 文言除去後（G-13e 想定）

| Local source | Remote target |
|--------------|---------------|
| `tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/` **contents** | `/cms-kit-staging/gosaki-piano/` |

**Likely changed paths only (post-DB cleanup):**

```txt
schedule/2026-03/index.html   # Event A card 7
# optional: _astro/* if CSS hash changed
```

**Not required for G-13c1 admin:**

```txt
admin/                        # read-only — no G-13c1
```

**Upload rule:** G-7g manual package — overwrite only, no `--delete`, separate approval phrase.

---

## 8. まだ Save / DB write に進まない理由

| # | Reason |
|---|--------|
| 1 | **G-13d1-final-preflight** 未実施 — beforeSnapshot / rollback SQL なし |
| 2 | Operator explicit approval 未取得 |
| 3 | G-13c1 env arm / compile gate は **意図的に off** |
| 4 | Admin reflection（UI 確認）と **DB mutation は分離** — 今回は前者のみ |
| 5 | Public site 反映は cleanup **後**（G-13e） |

---

## 9. Safety gates (this phase)

| Gate | Value |
|------|-------|
| `gosakiScheduleEventAPocCleanupAdminReflectionPreflightComplete` | **true** |
| `packageRegenExecuted` | **false** |
| `ftpUploadExecuted` | **false** |
| `cursorSaveExecuted` | **false** |
| `cursorPreviewButtonClicked` | **false** |
| `cursorDbWriteExecuted` | **false** |
| `readOnlyAdminUploadRequiredForG13c1` | **false** |

---

## 10. Verifier

```bash
node tools/static-to-astro/scripts/verify-g13d2-gosaki-schedule-event-a-poc-cleanup-admin-reflection-preflight.mjs
```

---

## 11. Next phases (proposed)

| Order | Phase | Purpose |
|-------|-------|---------|
| 1 | **`G-13d2-admin-reflection-local-dev-verify`** | Operator: local dev 再起動 → G-13c1 パネル + dry-run Preview 確認（Save なし） |
| 2 | **`G-13d1-final-preflight`** | beforeSnapshot + rollback SQL + Save env stack 文書化 |
| 3 | **`G-13d1-execution`** | Operator Save once（Event A） |
| 4 | **`G-13e-public-reflection`** | convert + manual-upload — public schedule only |

**Not next:** package regen / FTP upload for G-13c1 admin（wrong surface）。

---

## 12. References

- [gosaki-schedule-event-a-poc-cleanup-local-implementation.md](./gosaki-schedule-event-a-poc-cleanup-local-implementation.md) (G-13d1)
- [gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.md](./gosaki-staging-admin-supabase-auth-public-env-wiring-package-prep.md) (G-11c4b — read-only `/admin/`)
- [gosaki-staging-online-cms-architecture-planning.md](./gosaki-staging-online-cms-architecture-planning.md) (G-11a — two admin surfaces)

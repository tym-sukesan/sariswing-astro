# Admin Auth Abstraction Scaffold

**Phase:** G-5m-b — Auth UI scaffold + permissions model (draft)  
**Status:** scaffold only — not connected to Supabase Auth or runtime  
**Location:** `templates/admin-cms/components/`, `auth/`, `examples/auth-example.astro`

関連:

- [admin-crud-ui-scaffold.md](./admin-crud-ui-scaffold.md) — G-5m-a CRUD UI
- [admin-ui-shell-scaffold.md](./admin-ui-shell-scaffold.md) — G-5l shell
- Registry: [`config/admin/admin-ui-components-registry.json`](../config/admin/admin-ui-components-registry.json)

---

## 1. Purpose

G-5m-a の CRUD / module UI scaffold の上に、CMS Kit Admin の **Auth abstraction plan** と **Auth UI scaffold** を追加しました。

- Supabase Auth 実接続・RLS 変更・`admin_users` table 作成は**未実施**
- 既存 Sariswing admin / Auth コードは**未変更**
- `src/pages/admin/` には配置していない

---

## 2. Scope

### 対象

| 種別 | 内容 |
| --- | --- |
| Auth UI | Login, password reset, auth status, permission badge, access denied |
| Auth model | `auth/auth-model.example.json` — roles, identity sources |
| Permissions | `auth/permissions.example.json` — module-level permissions draft |

### 対象外

- Supabase Auth 実接続
- RLS policy 変更
- `admin_users` table 作成
- production auth / login routes
- GitHub publish 権限の実装
- Storage upload / publish dispatch

---

## 3. Auth UI components

| Component | Purpose | Key props | Future connection |
| --- | --- | --- | --- |
| **AdminLoginForm** | Login UI | `disabled`, `forgotPasswordHref`, `readonlyNotice` | Supabase `signInWithPassword` |
| **AdminPasswordResetForm** | Forgot / reset UI | `mode: request \| reset`, `disabled` | Supabase reset email flow |
| **AdminAuthStatus** | Session state display | `status`, `email`, `role` | Session listener + guard |
| **AdminPermissionBadge** | Role badge | `variant`, `label` | `permissions.example.json` |
| **AdminAccessDenied** | 403 panel | `title`, `message`, `backHref` | Module permission check |

**Not implemented:** `admin-auth-guard` — `scaffoldStatus: planned`

---

## 4. Auth model

`templates/admin-cms/auth/auth-model.example.json`

| Field | 意味 |
| --- | --- |
| `provider` | `supabase-auth`（将来） |
| `recommendedInitialStrategy` | `single-site-supabase-project` |
| `roles` | `admin` / `editor` / `viewer` |
| `identitySources` | `supabase.auth.user.email`, allowlist or `admin_users` |
| `doNotUseInProductionYet` | **true** |

---

## 5. Permissions model

`templates/admin-cms/auth/permissions.example.json`

Module ごとに role → actions を定義:

| Module | admin | editor | viewer |
| --- | --- | --- | --- |
| dashboard | read | read | read |
| news | CRUD + restore | read/create/update | read |
| schedule | + duplicate | read/create/update | read |
| media | upload/replace/remove | read | read |
| publish | trigger-staging-publish | request-staging-publish | — |

`productionPublish.enabledByDefault: false`, `requiresExplicitApproval: true`

---

## 6. Recommended architecture

1. **Client ごと Supabase project** を初期推奨（staging で検証）
2. **Browser:** anon key + RLS のみ。service role は**絶対に出さない**
3. **Edge Functions / CI:** service role で CRUD / publish trigger
4. **Identity:** `admin_users` table または site config allowlist + `app_metadata.role`
5. **Roles:** admin / editor / viewer — permissions JSON で module action を宣言
6. **Production publish:** default disabled、explicit approval + admin role

### site config / registry 接続（将来）

- `site-config` → Supabase project URL / anon key（env 参照名のみ）
- `cms-template-registry` → enabled admin modules
- `permissions.example.json` → module action matrix（siteType で override 可）

---

## 7. Future integration plan

| Step | 内容 |
| --- | --- |
| Auth guard | Client session check + redirect（`admin-auth-guard`） |
| Supabase Auth adapter | `signIn` / `signOut` / `resetPassword` wrapper |
| `admin_users` table | Optional explicit role mapping |
| RLS policy templates | Per-module read/write policies |
| Module permissions | Runtime check against permissions JSON |
| Publish separation | staging vs production workflow + role gate |

---

## 8. Example

`templates/admin-cms/examples/auth-example.astro`

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5m-b
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category auth
```

---

## 9. Safety

| Flag | Value |
| --- | --- |
| Sariswing admin modified | **false** |
| Supabase Auth connected | **false** |
| RLS changes | **none** |
| DB update | **none** |
| Storage upload | **none** |
| Publish dispatch | **none** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

---

## 10. Next phases

| Phase | 内容 |
| --- | --- |
| **G-5n（完了）** | [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) |
| **G-5o（完了）** | [admin-publish-workflow-abstraction.md](./admin-publish-workflow-abstraction.md) |
| **G-5p（完了）** | [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) |
| **G-5q** | customer admin manual |

Auth guard 実装は runtime 接続フェーズ（G-5p 以降の明示承認後）で行う想定です。

---

*G-5m-b: Auth UI scaffold + permissions draft. No runtime auth.*

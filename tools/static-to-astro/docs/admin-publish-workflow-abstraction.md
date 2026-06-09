# Admin Publish Workflow Abstraction Scaffold

**Phase:** G-5o — Publish workflow UI + policy scaffold  
**Status:** scaffold only — not connected to GitHub / Edge / FTP  
**Location:** `templates/admin-cms/components/`, `publish/`, `examples/publish-example.astro`

関連:

- [admin-media-upload-abstraction.md](./admin-media-upload-abstraction.md) — G-5n Media
- [admin-auth-abstraction-scaffold.md](./admin-auth-abstraction-scaffold.md) — G-5m-b permissions
- G-5j inventory: Sariswing `AdminDeployBar` → `trigger-deploy` → `workflow_dispatch` → FTP（参照のみ、未変更）

---

## 1. Purpose

Sariswing で実証済みの「公開サイトを更新」パターンを、CMS Kit 用に**安全に抽象化**した Publish workflow UI と policy 例を追加しました。

- GitHub Actions dispatch / Edge Function / FTP deploy / production publish は**未実施**
- 既存 Sariswing `AdminDeployBar` / `trigger-deploy` / workflow は**未変更**
- staging / production を常に分離

---

## 2. Scope

### 対象

| 種別 | 内容 |
| --- | --- |
| Publish UI | PublishButton, DeployStatus, ApprovalGate, PublishHistory, EnvironmentBadge |
| Policy | `publish/publish-workflow-policy.example.json` |
| Environments | `publish/publish-environments.example.json` |

### 対象外

- GitHub Actions `workflow_dispatch`
- Edge Function `trigger-deploy` 呼び出し
- FTP deploy
- production publish 実行
- secret / token 実装
- runtime polling

---

## 3. Components

| Component | Purpose |
| --- | --- |
| **AdminPublishButton** | staging / production publish trigger UI（disabled） |
| **AdminDeployStatus** | idle / queued / running / success / failed |
| **AdminPublishApprovalGate** | required checks + blocking items |
| **AdminPublishHistory** | static audit log table |
| **AdminPublishEnvironmentBadge** | staging enabled / production disabled |

**Planned (not implemented):** `admin-github-dispatch-client`, `admin-edge-function-client`

---

## 4. Publish policy

`templates/admin-cms/publish/publish-workflow-policy.example.json`

| Environment | enabledByDefault | gates |
| --- | --- | --- |
| **staging** | true | admin role, explicit approval, noindex |
| **production** | **false** | customer approval, rights confirmation, rollback plan |

Safety flags: `githubTokenNeverInClient`, `ftpPasswordNeverInClient`, `secretsNeverInBrowser`

---

## 5. Environments

`templates/admin-cms/publish/publish-environments.example.json`

| Environment | enabled | noindex / robots |
| --- | --- | --- |
| staging | true | required |
| production | **false** | not required (when live) |

**Staging and production are always separated.**

---

## 6. Safety gates

1. **No production without explicit approval**
2. Customer approval required for production
3. Media rights confirmation required
4. Rollback plan required
5. No GitHub token in browser
6. No FTP password in browser
7. Staging: noindex + robots Disallow
8. Production publish **default disabled**

Auth permissions (`permissions.publish`) — UI draft only、**enforcement 未接続**

---

## 7. Future integration plan

| Step | 内容 |
| --- | --- |
| Server-side publish adapter | Edge Function wrapper（token 隔離） |
| GitHub Actions dispatch adapter | staging / production workflow 分離 |
| Deploy status polling | GitHub API（server-side） |
| Publish permission enforcement | G-5m-b permissions + approval gate |
| Audit log | Persist publish history |
| musician-basic prototype | G-5p staging-only end-to-end |

---

## 8. Example

`templates/admin-cms/examples/publish-example.astro`

```bash
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --phase G-5o
node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category publish
```

---

## 9. Safety

| Flag | Value |
| --- | --- |
| Sariswing admin modified | **false** |
| GitHub dispatch | **none** |
| Edge Function called | **false** |
| FTP deploy | **none** |
| DB / Storage | **none** |
| Production publish | **none** |
| `productionReady` | **false** |
| `connectedToRuntime` | **false** |

---

## 10. Next phase

**G-5q（完了）:** [customer-admin-manual-musician-basic.md](./customer-admin-manual-musician-basic.md) — 顧客向け Admin Manual + [Quick Checklist](./customer-admin-quick-checklist-musician-basic.md)

**G-5p（完了）:** [musician-basic-admin-prototype.md](./musician-basic-admin-prototype.md) — 開発者向け scaffold integration prototype。Runtime / Auth / DB / Storage / Publish 未接続。

**G-5r（次）:** prototype preview harness

---

*G-5o: Publish UI scaffold. G-5p: developer prototype. G-5q: customer manual. No dispatch or deploy.*

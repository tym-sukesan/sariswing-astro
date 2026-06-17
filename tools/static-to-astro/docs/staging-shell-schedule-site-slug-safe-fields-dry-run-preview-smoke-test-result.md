# Staging shell schedule site_slug safe-fields dry-run preview smoke test result (G-9g3a)

**Phase:** `G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview-smoke-test`  
**Date:** 2026-06-17  
**Prior:** G-9g3a implementation commit `54380a0`  
**Type:** operator visual smoke test — **no Save click, no DB write**

---

## 1. Background

Operator confirmed G-9g3a multi-field dry-run preview and host hard gate on staging shell after commit `54380a0`.

Implementation: [staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md](./staging-shell-schedule-site-slug-safe-fields-dry-run-preview-implementation.md)

---

## 2. Route

```txt
/__admin-staging-shell/musician-basic/#schedule
```

---

## 3. Host gate

| Field | Value |
| --- | --- |
| activeHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| expectedHost | `kmjqppxjdnwwrtaeqjta.supabase.co` |
| hostGatePassed | `true` |

---

## 4. Save / write

| Check | Result |
| --- | --- |
| Save button visible | **no** |
| DB write | **no** |
| actualWrite (preview) | `false` |

---

## 5. Dry-run preview (venue + description)

Operator entered PoC-style venue + description values and clicked **Preview dry-run**.

| Field | Result |
| --- | --- |
| actualWrite | `false` |
| changedFields | `venue`, `description` |
| optimisticLock.stale | `false` |
| wouldWrite | `true` (when fields differ from loaded row) |

Title and other safe fields unchanged in preview when only venue + description edited.

---

## 6. Target row context

```txt
id:         aa440e29-5be8-402e-9190-0d81c48434c0
legacy_id:  schedule-2026-07-010
site_slug:  gosaki-piano
title:      [CMS Kit staging] G-9g2 title PoC  (retained — no restore)
```

---

## 7. Gates

```txt
stagingShellScheduleSiteSlugSafeFieldsDryRunPreviewSmokeTestPassed: true
stagingShellScheduleHostHardGateSmokeTestPassed: true
stagingShellScheduleMultiFieldDryRunPreviewSmokeTestPassed: true
readyForG9g3bVenueDescriptionPocImplementation: true
readyForAnyDbWrite: false
```

---

## 8. Next

G-9g3b gated Save implementation + preflight (venue + description only).

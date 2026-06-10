/**
 * G-6-d — Browser UI for staging profile update PoC (staging shell only).
 */

import { refreshAuthWriteDebugPanel } from "../staging-auth/staging-auth-write-debug-ui";
import { executeProfileUpdatePoc } from "./profile-update-poc-adapter";
import { getStagingWriteConfig } from "./staging-write-config";

function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setResultHtml(html: string): void {
  const el = document.getElementById("profile-update-poc-result");
  if (!el) return;
  el.innerHTML = html;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSnapshot(label: string, row: Record<string, unknown> | undefined): string {
  if (!row) return `<p><strong>${label}:</strong> —</p>`;
  return `<pre class="profile-poc-snapshot">${escapeHtml(JSON.stringify(row, null, 2))}</pre>`;
}

function refreshProfileUpdatePocPanel(): void {
  const config = getStagingWriteConfig();
  setText("profile-poc-phase", config.phase);
  setText("profile-poc-approval-id", config.approvalId);
  setText("profile-poc-can-write", config.canWrite ? "true" : "false");
  setText("profile-poc-dry-run", config.dryRun ? "true" : "false");
  setText(
    "profile-poc-write-enabled",
    config.writeOperationsEnabled ? "true" : "false",
  );

  const reasonEl = document.getElementById("profile-poc-disabled-reason");
  if (reasonEl) {
    if (config.disabledReason) {
      reasonEl.textContent = config.disabledReason;
      reasonEl.hidden = false;
    } else {
      reasonEl.textContent = "";
      reasonEl.hidden = true;
    }
  }

  const saveBtn = document.getElementById(
    "profile-update-poc-save-btn",
  ) as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.disabled = !config.canWrite;
    saveBtn.title = config.canWrite
      ? config.dryRun
        ? "Dry-run — no Supabase update"
        : "Staging write — profile text fields only"
      : (config.disabledReason ?? "Write PoC disabled");
  }

  const nameInput = document.getElementById(
    "profile-poc-display-name",
  ) as HTMLInputElement | null;
  const bioInput = document.getElementById(
    "profile-poc-bio",
  ) as HTMLTextAreaElement | null;
  if (nameInput) nameInput.disabled = !config.canWrite;
  if (bioInput) bioInput.disabled = !config.canWrite;
  void refreshAuthWriteDebugPanel();
}

async function handleProfileUpdatePocSave(): Promise<void> {
  const config = getStagingWriteConfig();
  if (!config.canWrite) {
    setResultHtml(
      `<p class="profile-poc-error">Save disabled: ${escapeHtml(config.disabledReason ?? "gate not satisfied")}</p>`,
    );
    return;
  }

  const nameInput = document.getElementById(
    "profile-poc-display-name",
  ) as HTMLInputElement | null;
  const bioInput = document.getElementById(
    "profile-poc-bio",
  ) as HTMLTextAreaElement | null;

  const values: Record<string, string> = {};
  if (nameInput) values.display_name = nameInput.value.trim();
  if (bioInput) values.bio = bioInput.value.trim();

  setResultHtml("<p>Running profile update PoC…</p>");

  try {
    const result = await executeProfileUpdatePoc({
      url: String(import.meta.env.PUBLIC_SUPABASE_URL ?? "").trim(),
      anonKey: String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim(),
      dryRun: config.dryRun,
      approvalId: config.approvalId,
      values,
    });

    if (!result.ok) {
      setResultHtml(
        `<p class="profile-poc-error"><strong>Error:</strong> ${escapeHtml(result.error ?? "unknown")}</p>`,
      );
      return;
    }

    const modeLabel = result.dryRun
      ? "Dry-run complete — no Supabase update was called"
      : "Staging write executed — profile row updated";

    setResultHtml(
      [
        `<p class="profile-poc-success"><strong>${escapeHtml(modeLabel)}</strong></p>`,
        `<p>Target row: <code>${escapeHtml(result.targetRowId)}</code></p>`,
        `<p>Update payload: <code>${escapeHtml(JSON.stringify(result.updatePayload ?? {}))}</code></p>`,
        formatSnapshot("Before", result.before),
        result.after ? formatSnapshot("After", result.after) : "",
        result.rollbackInstruction
          ? `<p><strong>Rollback:</strong></p><pre class="profile-poc-rollback">${escapeHtml(result.rollbackInstruction)}</pre>`
          : "",
        result.rejectedFields.length > 0
          ? `<p class="profile-poc-warn">Rejected fields: ${escapeHtml(result.rejectedFields.join(", "))}</p>`
          : "",
      ].join(""),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    setResultHtml(
      `<p class="profile-poc-error"><strong>Error:</strong> ${escapeHtml(message)}</p>`,
    );
  }
}

function bindProfileUpdatePocUi(): void {
  refreshProfileUpdatePocPanel();
  const saveBtn = document.getElementById("profile-update-poc-save-btn");
  saveBtn?.addEventListener("click", () => {
    void handleProfileUpdatePocSave();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindProfileUpdatePocUi);
  } else {
    bindProfileUpdatePocUi();
  }
}

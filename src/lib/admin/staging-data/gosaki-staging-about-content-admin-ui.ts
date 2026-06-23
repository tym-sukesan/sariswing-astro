/**
 * Gosaki staging shell — About HTML content admin UI (read-only preview; G-10h3).
 */

function wireReadOnlyUi(): void {
  const root = document.getElementById("gosaki-about-operator");
  if (!root) return;

  root.querySelectorAll<HTMLTextAreaElement>("[data-gosaki-about-html-source]").forEach((textarea) => {
    textarea.readOnly = true;
    textarea.setAttribute("aria-readonly", "true");
  });

  const saveButton = root.querySelector<HTMLButtonElement>("[data-gosaki-about-save-disabled]");
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.setAttribute("aria-disabled", "true");
  }
}

export function initGosakiStagingAboutContentAdminUi(): void {
  wireReadOnlyUi();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingAboutContentAdminUi();
  });
}

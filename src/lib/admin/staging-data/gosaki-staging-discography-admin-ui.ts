/**
 * Gosaki staging shell — Discography admin UI (static JSON; no save).
 */

function wireDisabledActions(): void {
  const disabledButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-gosaki-disc-action-disabled]",
  );
  disabledButtons.forEach((button) => {
    button.disabled = true;
    button.title = "保存は次フェーズで開放予定です";
  });
}

function wireLocalReorder(): void {
  const list = document.getElementById("gosaki-disc-item-list");
  if (!list) return;

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-gosaki-disc-move]");
    if (!button || button.disabled) return;

    const item = button.closest<HTMLElement>(".gosaki-discography-admin-item");
    if (!item) return;

    const direction = button.dataset.gosakiDiscMove;
    if (direction === "up" && item.previousElementSibling) {
      list.insertBefore(item, item.previousElementSibling);
    } else if (direction === "down" && item.nextElementSibling) {
      list.insertBefore(item.nextElementSibling, item);
    }
  });
}

export function initGosakiStagingDiscographyAdminUi(): void {
  const root = document.getElementById("gosaki-discography-operator");
  if (!root) return;

  wireDisabledActions();
  wireLocalReorder();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingDiscographyAdminUi();
  });
}

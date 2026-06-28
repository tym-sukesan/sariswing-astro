/**
 * Gosaki staging shell — Discography admin UI (Supabase read; Save disabled).
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

function readRowDataset(item: HTMLElement) {
  return {
    legacyId: item.dataset.legacyId ?? "",
    title: item.dataset.title ?? "",
    artist: item.dataset.artist ?? "",
    releaseDate: item.dataset.releaseDate ?? "",
    year: item.dataset.year ?? "",
    catalogNumber: item.dataset.catalogNumber ?? "",
    label: item.dataset.label ?? "",
    description: item.dataset.description ?? "",
    coverImageUrl: item.dataset.coverImageUrl ?? "",
    purchaseUrl: item.dataset.purchaseUrl ?? "",
    streamingUrl: item.dataset.streamingUrl ?? "",
    sortOrder: item.dataset.sortOrder ?? "",
    published: item.dataset.published === "true",
    updatedAt: item.dataset.updatedAt ?? "",
    tracks: item.dataset.tracks ?? "",
  };
}

function populateEditForm(item: HTMLElement): void {
  const form = document.getElementById("gosaki-disc-edit-form");
  if (!form) return;

  const data = readRowDataset(item);

  const setValue = (name: string, value: string) => {
    const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`,
    );
    if (el) el.value = value;
  };

  setValue("legacy_id", data.legacyId);
  setValue("title", data.title);
  setValue("artist", data.artist);
  setValue("release_date", data.releaseDate);
  setValue("year", data.year);
  setValue("catalog_number", data.catalogNumber);
  setValue("label", data.label);
  setValue("description", data.description);
  setValue("cover_image_url", data.coverImageUrl);
  setValue("purchase_url", data.purchaseUrl);
  setValue("streaming_url", data.streamingUrl);
  setValue("sort_order", data.sortOrder);
  setValue("tracks", data.tracks);

  const published = form.querySelector<HTMLInputElement>('input[name="published"]');
  if (published) published.checked = data.published;

  const selectedLabel = document.getElementById("gosaki-disc-selected-legacy-id");
  if (selectedLabel) selectedLabel.textContent = data.legacyId || "—";

  document.querySelectorAll<HTMLElement>(".gosaki-discography-admin-item").forEach((row) => {
    row.classList.toggle("gosaki-discography-admin-item--selected", row === item);
  });
}

function wireRowSelection(): void {
  const list = document.getElementById("gosaki-disc-item-list");
  if (!list) return;

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const selectButton = target?.closest<HTMLButtonElement>("[data-gosaki-disc-select]");
    if (selectButton) {
      const item = selectButton.closest<HTMLElement>(".gosaki-discography-admin-item");
      if (item) populateEditForm(item);
      return;
    }

    const moveButton = target?.closest<HTMLButtonElement>("[data-gosaki-disc-move]");
    if (!moveButton || moveButton.disabled) return;

    const item = moveButton.closest<HTMLElement>(".gosaki-discography-admin-item");
    if (!item) return;

    const direction = moveButton.dataset.gosakiDiscMove;
    if (direction === "up" && item.previousElementSibling) {
      list.insertBefore(item, item.previousElementSibling);
    } else if (direction === "down" && item.nextElementSibling) {
      list.insertBefore(item.nextElementSibling, item);
    }
  });

  const initial = list.querySelector<HTMLElement>(
    ".gosaki-discography-admin-item--selected, .gosaki-discography-admin-item",
  );
  if (initial) populateEditForm(initial);
}

export function initGosakiStagingDiscographyAdminUi(): void {
  const root = document.getElementById("gosaki-discography-operator");
  if (!root) return;

  wireDisabledActions();
  wireRowSelection();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingDiscographyAdminUi();
  });
}

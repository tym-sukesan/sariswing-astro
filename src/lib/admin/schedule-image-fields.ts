import { uploadAdminImage } from "./image-upload";

const MAX_IMAGE_URL_LENGTH = 2000;

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function sanitizeImageUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > MAX_IMAGE_URL_LENGTH) return "";
  if (!isHttpUrl(trimmed)) return "";
  return trimmed;
}

function normalizeImageUrls(values: string[]) {
  return values
    .map((value) => sanitizeImageUrl(value))
    .filter(Boolean);
}

function createButton(text: string, className: string) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  return button;
}

function updatePreview(preview: HTMLImageElement, value: string) {
  const url = sanitizeImageUrl(value);
  if (!url) {
    preview.src = "";
    preview.classList.add("is-hidden");
    return;
  }

  preview.src = url;
  preview.classList.remove("is-hidden");
}

function createImageItem(urlValue = "") {
  const item = document.createElement("li");
  item.className = "schedule-images__item";

  const preview = document.createElement("img");
  preview.className = "schedule-images__preview is-hidden";
  preview.alt = "";
  preview.decoding = "async";
  preview.loading = "lazy";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "schedule-images__input";
  input.placeholder = "https://...";
  input.dataset.imageUrlItem = "true";
  input.value = urlValue;

  const controls = document.createElement("div");
  controls.className = "schedule-images__controls";

  const uploadButton = createButton(
    "アップロード",
    "admin-button admin-button-secondary admin-button--small schedule-images__upload"
  );
  const upButton = createButton("↑", "admin-button admin-button-secondary admin-button--small");
  upButton.dataset.action = "move-up";
  const downButton = createButton("↓", "admin-button admin-button-secondary admin-button--small");
  downButton.dataset.action = "move-down";
  const removeButton = createButton("削除", "admin-button admin-button-danger admin-button--small");
  removeButton.dataset.action = "remove";

  controls.append(uploadButton, upButton, downButton, removeButton);

  input.addEventListener("input", () => {
    updatePreview(preview, input.value);
  });

  uploadButton.addEventListener("click", () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.click();
    fileInput.addEventListener(
      "change",
      () => {
        void (async () => {
          const file = fileInput.files?.[0];
          if (!file) return;

          const previous = uploadButton.textContent;
          uploadButton.disabled = true;
          uploadButton.textContent = "処理中...";

          try {
            const url = await uploadAdminImage(file, "schedule");
            input.value = url;
            updatePreview(preview, url);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "画像アップロードに失敗しました。";
            alert(message);
          } finally {
            uploadButton.disabled = false;
            uploadButton.textContent = previous ?? "アップロード";
          }
        })();
      },
      { once: true }
    );
  });

  updatePreview(preview, urlValue);
  item.append(preview, input, controls);
  return item;
}

function ensureAtLeastOneItem(list: HTMLUListElement) {
  if (!list.querySelector(".schedule-images__item")) {
    list.append(createImageItem(""));
  }
}

export function initScheduleImageField(
  host: HTMLElement,
  label: string,
  initialUrls: string[]
) {
  const field = document.createElement("div");
  field.className = "admin-form__field schedule-images";
  field.dataset.scheduleImageField = "true";

  const labelEl = document.createElement("span");
  labelEl.className = "admin-form__label";
  labelEl.textContent = label;

  const hint = document.createElement("span");
  hint.className = "admin-form__hint";
  hint.textContent =
    "複数登録可。URL入力またはアップロードで追加。上下ボタンで順序変更できます。";

  const list = document.createElement("ul");
  list.className = "schedule-images__list";
  list.dataset.scheduleImageList = "true";

  for (const url of normalizeImageUrls(initialUrls)) {
    list.append(createImageItem(url));
  }
  ensureAtLeastOneItem(list);

  const addButton = createButton(
    "画像を追加",
    "admin-button admin-button-secondary admin-button--small schedule-images__add"
  );

  addButton.addEventListener("click", () => {
    list.append(createImageItem(""));
  });

  list.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button");
    if (!button) return;
    const action = button.dataset.action;
    if (!action) return;
    const item = button.closest(".schedule-images__item");
    if (!(item instanceof HTMLLIElement)) return;

    if (action === "remove") {
      item.remove();
      ensureAtLeastOneItem(list);
      return;
    }

    if (action === "move-up") {
      const prev = item.previousElementSibling;
      if (prev) list.insertBefore(item, prev);
      return;
    }

    if (action === "move-down") {
      const next = item.nextElementSibling;
      if (next) list.insertBefore(next, item);
    }
  });

  field.append(labelEl, hint, list, addButton);
  host.replaceChildren(field);
}

export function collectScheduleImageUrls(form: ParentNode) {
  const inputs = form.querySelectorAll<HTMLInputElement>(
    "[data-schedule-image-field] [data-image-url-item]"
  );
  return normalizeImageUrls([...inputs].map((input) => input.value));
}

export function resolveScheduleImageUrls(record: {
  image_urls?: unknown;
  image_url?: string | null;
}) {
  if (Array.isArray(record.image_urls)) {
    const normalized = normalizeImageUrls(
      record.image_urls.map((value) => (typeof value === "string" ? value : ""))
    );
    if (normalized.length > 0) return normalized;
  }

  const fallback = sanitizeImageUrl(record.image_url ?? "");
  return fallback ? [fallback] : [];
}

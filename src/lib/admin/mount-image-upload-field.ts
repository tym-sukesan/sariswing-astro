import { uploadAdminImage, type ImageUploadPrefix } from "./image-upload";

const INIT_ATTR = "data-image-upload-initialized";

function updateImagePreview(preview: HTMLImageElement, url: string) {
  if (!url) {
    preview.src = "";
    preview.classList.add("is-hidden");
    return;
  }

  preview.src = url;
  preview.classList.remove("is-hidden");
  preview.onerror = () => {
    preview.classList.add("is-hidden");
  };
}

function mountImageUploadField(
  container: HTMLElement,
  urlInput: HTMLInputElement,
  prefix: ImageUploadPrefix
) {
  let preview = container.querySelector(".admin-image-upload__preview");
  if (!(preview instanceof HTMLImageElement)) {
    preview = document.createElement("img");
    preview.className = "admin-image-upload__preview is-hidden";
    preview.alt = "";
    preview.decoding = "async";
    preview.loading = "lazy";
    container.append(preview);
  }

  let toolbar = container.querySelector(".admin-image-upload__toolbar");

  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.className = "admin-image-upload__toolbar";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.className = "admin-image-upload__file";
    fileInput.accept = "image/jpeg,image/png,image/webp";
    fileInput.hidden = true;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-button admin-button-secondary admin-image-upload__button";
    button.textContent = "画像をアップロード";

    toolbar.append(fileInput, button);
    container.append(toolbar);

    button.addEventListener("click", () => {
      fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      void (async () => {
        const file = fileInput.files?.[0];
        fileInput.value = "";
        if (!file) return;

        button.disabled = true;
        const previousLabel = button.textContent;
        button.textContent = "画像を処理中...";

        try {
          const publicUrl = await uploadAdminImage(file, prefix);
          urlInput.value = publicUrl;
          urlInput.dispatchEvent(new Event("input", { bubbles: true }));
          updateImagePreview(preview, publicUrl);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "画像のアップロードに失敗しました。";
          alert(message);
        } finally {
          button.disabled = false;
          button.textContent = previousLabel ?? "画像をアップロード";
        }
      })();
    });
  }

  urlInput.addEventListener("input", () => {
    updateImagePreview(preview, urlInput.value.trim());
  });

  updateImagePreview(preview, urlInput.value.trim());
}

/**
 * `[data-image-upload="news"]` などのコンテナにアップロード UI を付与
 */
export function initImageUploadFields(root: ParentNode = document) {
  const containers = root.querySelectorAll(
    `[data-image-upload]:not([${INIT_ATTR}])`
  );

  for (const node of containers) {
    if (!(node instanceof HTMLElement)) continue;

    const prefix = node.dataset.imageUpload;
    if (prefix !== "news" && prefix !== "schedule" && prefix !== "discography") {
      continue;
    }

    const urlInput = node.querySelector('[data-field="image_url"], [name="image_url"]');
    if (!(urlInput instanceof HTMLInputElement)) continue;

    mountImageUploadField(node, urlInput, prefix);
    node.setAttribute(INIT_ATTR, "true");
  }
}

/**
 * 動的に生成するフォーム用（NEWS / Schedule 一覧の編集フォームなど）
 */
export function appendImageUrlField(
  parent: HTMLElement,
  labelText: string,
  value: string,
  prefix: ImageUploadPrefix,
  className = "admin-form__field"
) {
  const wrap = document.createElement("div");
  wrap.className = "admin-image-upload";
  wrap.dataset.imageUpload = prefix;

  const labelEl = document.createElement("label");
  labelEl.className = className;

  const labelSpan = document.createElement("span");
  labelSpan.className = "admin-form__label";
  labelSpan.textContent = labelText;

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.name = "image_url";
  urlInput.dataset.field = "image_url";
  urlInput.placeholder = "https://...";
  urlInput.value = value;

  const hint = document.createElement("span");
  hint.className = "admin-form__hint";
  hint.textContent =
    "URLを直接入力するか、下のボタンからアップロード（JPG / PNG / WebP・長辺1600px・2MBまで）";

  labelEl.append(labelSpan, urlInput, hint);
  wrap.append(labelEl);
  parent.append(wrap);

  initImageUploadFields(wrap);

  return urlInput;
}

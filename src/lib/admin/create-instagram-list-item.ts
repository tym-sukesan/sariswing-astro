import type { InstagramPostRecord } from "../instagram-posts";

export type InstagramAdminRecord = InstagramPostRecord;

export function createInstagramAdminListItem(item: InstagramAdminRecord) {
  const li = document.createElement("li");
  li.className = "admin-list__item instagram-admin-item";
  li.dataset.id = String(item.id);
  if (item.sort_order != null && Number.isFinite(item.sort_order)) {
    li.dataset.sortOrder = String(item.sort_order);
  }

  const previewWrap = document.createElement("div");
  previewWrap.className = "instagram-admin-item__preview";

  const embedCode = item.embed_code?.trim() ?? "";
  if (embedCode) {
    const preview = document.createElement("div");
    preview.className = "instagram-admin-preview";
    preview.innerHTML = embedCode;
    previewWrap.append(preview);
  }

  const editor = document.createElement("div");
  editor.className = "instagram-admin-item__editor";

  const form = document.createElement("div");
  form.className = "admin-form";

  const sortField = document.createElement("label");
  sortField.className = "admin-form__field instagram-admin-item__sort-field";

  const sortLabel = document.createElement("span");
  sortLabel.className = "admin-form__label";
  sortLabel.textContent = "表示順";

  const sortInput = document.createElement("input");
  sortInput.type = "number";
  sortInput.className = "edit-sort-order";
  sortInput.inputMode = "numeric";
  sortInput.step = "1";
  if (item.sort_order != null && Number.isFinite(item.sort_order)) {
    sortInput.value = String(item.sort_order);
  }

  sortField.append(sortLabel, sortInput);
  form.append(sortField);

  const label = document.createElement("label");
  label.className = "admin-form__field";

  const labelSpan = document.createElement("span");
  labelSpan.className = "admin-form__label";
  labelSpan.textContent = "埋め込みコード";

  const textarea = document.createElement("textarea");
  textarea.className = "edit-embed-code";
  textarea.rows = 6;
  textarea.textContent = embedCode;

  label.append(labelSpan, textarea);
  form.append(label);

  const actions = document.createElement("div");
  actions.className = "admin-actions";

  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.className = "admin-button update";
  updateButton.textContent = "更新";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "admin-button admin-button-danger delete";
  deleteButton.textContent = "削除";

  actions.append(updateButton, deleteButton);
  editor.append(form, actions);
  li.append(previewWrap, editor);

  return li;
}

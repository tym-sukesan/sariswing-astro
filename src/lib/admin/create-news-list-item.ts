import { appendImageUrlField } from "./mount-image-upload-field";
import { formatAdminDeletedAt } from "./format-deleted-at";
import { stripHtml } from "./strip-html";
import { formatNewsDate, type NewsRecord } from "../news";

function getLinkTypeLabel(item: NewsRecord) {
  const url = item.url?.trim() || "";
  const content = item.content?.trim() || "";
  if (url) {
    return /^https?:\/\//i.test(url) ? "外部リンク" : "内部リンク";
  }
  if (content) return "詳細ページ";
  return "一覧のみ";
}

function buildSearchText(item: NewsRecord, displayDate: string) {
  return [
    item.date,
    displayDate,
    item.title,
    item.category,
    stripHtml(item.excerpt),
    stripHtml(item.content),
    item.url,
    item.slug,
    item.image_url,
  ]
    .filter(Boolean)
    .join(" ");
}

function appendField(
  parent: HTMLElement,
  label: string,
  control: HTMLElement,
  className = "admin-form__field"
) {
  const labelEl = document.createElement("label");
  labelEl.className = className;

  const labelSpan = document.createElement("span");
  labelSpan.className = "admin-form__label";
  labelSpan.textContent = label;

  labelEl.append(labelSpan, control);
  parent.append(labelEl);
}

export function createNewsAdminListItem(item: NewsRecord, listIndex: number) {
  const url = item.url?.trim() || "";
  const displayDate = formatNewsDate(item.date);
  const linkTypeLabel = getLinkTypeLabel(item);

  const li = document.createElement("li");
  li.className = "news-admin-item admin-list__item";
  if (listIndex >= 10) li.classList.add("is-list-hidden");
  li.dataset.id = String(item.id);
  li.dataset.listIndex = String(listIndex);

  const searchSource = document.createElement("span");
  searchSource.className = "news-admin-item__search-source";
  searchSource.hidden = true;
  searchSource.textContent = buildSearchText(item, displayDate);
  li.append(searchSource);

  const header = document.createElement("div");
  header.className = "news-admin-item__header";

  const summary = document.createElement("p");
  summary.className = "news-admin-item__summary";

  const dateSpan = document.createElement("span");
  dateSpan.className = "news-admin-item__date";
  dateSpan.textContent = displayDate;
  summary.append(dateSpan);

  if (item.category) {
    const categorySpan = document.createElement("span");
    categorySpan.className = "news-admin-item__category";
    categorySpan.textContent = item.category;
    summary.append(categorySpan);
  }

  const titleStrong = document.createElement("strong");
  titleStrong.className = "news-admin-item__title";
  titleStrong.textContent = item.title;
  summary.append(titleStrong);

  const status = document.createElement("p");
  status.className = "news-admin-item__status";
  status.textContent = `${item.is_published ? "公開" : "非公開"} / ${linkTypeLabel}`;

  const actions = document.createElement("div");
  actions.className = "news-admin-item__actions admin-actions";

  for (const [text, className] of [
    ["編集", "admin-button admin-button--small toggle-edit"],
    ["複製", "admin-button admin-button--small admin-button-secondary duplicate"],
    ["削除", "admin-button admin-button--small admin-button-danger delete"],
  ] as const) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    actions.append(button);
  }

  header.append(summary, status, actions);

  const form = document.createElement("form");
  form.className = "admin-form admin-form--grid news-edit-form is-hidden";

  const row1 = document.createElement("div");
  row1.className = "admin-form__row";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.name = "date";
  dateInput.dataset.field = "date";
  dateInput.required = true;
  dateInput.value = item.date;
  appendField(row1, "日付", dateInput);

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.name = "category";
  categoryInput.dataset.field = "category";
  categoryInput.value = item.category || "";
  appendField(row1, "カテゴリ", categoryInput);
  form.append(row1);

  const row2 = document.createElement("div");
  row2.className = "admin-form__row";

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.name = "title";
  titleInput.dataset.field = "title";
  titleInput.required = true;
  titleInput.value = item.title;
  appendField(row2, "タイトル", titleInput);

  const slugInput = document.createElement("input");
  slugInput.type = "text";
  slugInput.name = "slug";
  slugInput.dataset.field = "slug";
  slugInput.value = item.slug || "";
  appendField(row2, "slug（詳細ページ用）", slugInput);
  form.append(row2);

  const row3 = document.createElement("div");
  row3.className = "admin-form__row";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.name = "url";
  urlInput.dataset.field = "url";
  urlInput.placeholder = "/discography/... または https://...";
  urlInput.value = item.url || "";
  appendField(row3, "リンクURL（任意）", urlInput);

  appendImageUrlField(row3, "アイキャッチ画像", item.image_url || "", "news");
  form.append(row3);

  const excerptArea = document.createElement("textarea");
  excerptArea.name = "excerpt";
  excerptArea.dataset.field = "excerpt";
  excerptArea.rows = 2;
  excerptArea.textContent = item.excerpt || "";
  appendField(form, "抜粋", excerptArea);

  const contentArea = document.createElement("textarea");
  contentArea.name = "content";
  contentArea.dataset.field = "content";
  contentArea.rows = 12;
  contentArea.textContent = item.content || "";
  appendField(form, "本文（HTML可）", contentArea, "admin-form__field admin-form__field--content");

  const publishedLabel = document.createElement("label");
  publishedLabel.className = "admin-form__checkbox";
  const publishedInput = document.createElement("input");
  publishedInput.type = "checkbox";
  publishedInput.name = "is_published";
  publishedInput.dataset.field = "is_published";
  publishedInput.value = "true";
  publishedInput.checked = item.is_published;
  const publishedText = document.createElement("span");
  publishedText.textContent = "公開する（is_published）";
  publishedLabel.append(publishedInput, publishedText);
  form.append(publishedLabel);

  if (!url && item.slug) {
    const hint = document.createElement("p");
    hint.className = "admin-form__hint";
    hint.append("詳細ページ: ");
    const link = document.createElement("a");
    link.href = `/news/${item.slug}/`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `/news/${item.slug}/`;
    hint.append(link);
    form.append(hint);
  }

  if (url) {
    const hint = document.createElement("p");
    hint.className = "admin-form__hint";
    hint.append("リンク先: ");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    hint.append(link);
    form.append(hint);
  }

  const formActions = document.createElement("div");
  formActions.className = "admin-actions";
  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.className = "admin-button update";
  updateButton.textContent = "更新";
  formActions.append(updateButton);
  form.append(formActions);

  li.append(header, form);
  return li;
}

export function createNewsAdminDeletedListItem(item: NewsRecord, listIndex: number) {
  const displayDate = formatNewsDate(item.date);

  const li = document.createElement("li");
  li.className = "news-admin-item admin-list__item admin-list__item--deleted";
  if (listIndex >= 10) li.classList.add("is-list-hidden");
  li.dataset.id = String(item.id);
  li.dataset.listIndex = String(listIndex);

  const header = document.createElement("div");
  header.className = "news-admin-item__header";

  const summary = document.createElement("p");
  summary.className = "news-admin-item__summary";

  const dateSpan = document.createElement("span");
  dateSpan.className = "news-admin-item__date";
  dateSpan.textContent = displayDate;
  summary.append(dateSpan);

  const titleStrong = document.createElement("strong");
  titleStrong.className = "news-admin-item__title";
  titleStrong.textContent = item.title;
  summary.append(titleStrong);

  const status = document.createElement("p");
  status.className = "news-admin-item__status";
  status.textContent = `削除済み（${formatAdminDeletedAt(item.deleted_at)}）`;

  const actions = document.createElement("div");
  actions.className = "news-admin-item__actions admin-actions";

  const restoreButton = document.createElement("button");
  restoreButton.type = "button";
  restoreButton.className = "admin-button admin-button--small restore";
  restoreButton.textContent = "復元";
  actions.append(restoreButton);

  header.append(summary, status, actions);
  li.append(header);
  return li;
}

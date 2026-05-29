import { getTimeTypeSymbol } from "../schedule";
import { SCHEDULE_TIME_TYPE_OPTIONS, type ScheduleAdminRecord, type VenueOption } from "./schedule-constants";

function buildSearchText(item: ScheduleAdminRecord) {
  return [item.date, item.title, item.venue_name, item.genre, item.members, item.price, item.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function createVenueSelect(venues: VenueOption[], selectedVenueName?: string | null) {
  const select = document.createElement("select");
  select.dataset.field = "venue_id";
  select.name = "venue_id";

  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "未選択";
  if (!selectedVenueName) empty.selected = true;
  select.append(empty);

  for (const venue of venues) {
    const option = document.createElement("option");
    option.value = "";
    option.dataset.venueName = venue.name;
    option.textContent = venue.name;
    if (selectedVenueName === venue.name) option.selected = true;
    select.append(option);
  }

  return select;
}

function createTimeTypeSelect(selected?: string | null) {
  const select = document.createElement("select");
  select.dataset.field = "time_type";
  select.name = "time_type";

  for (const optionValue of SCHEDULE_TIME_TYPE_OPTIONS) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    if (itemMatchesTimeType(selected, optionValue)) option.selected = true;
    select.append(option);
  }

  return select;
}

function itemMatchesTimeType(selected: string | null | undefined, optionValue: string) {
  return (selected ?? SCHEDULE_TIME_TYPE_OPTIONS[0]) === optionValue;
}

function appendField(parent: HTMLElement, label: string, control: HTMLElement, className = "admin-form__field") {
  const labelEl = document.createElement("label");
  labelEl.className = className;

  const labelSpan = document.createElement("span");
  labelSpan.className = "admin-form__label";
  labelSpan.textContent = label;

  labelEl.append(labelSpan, control);
  parent.append(labelEl);
}

export function populateVenueSelect(
  select: HTMLSelectElement,
  venues: VenueOption[],
  selectedVenueName?: string | null
) {
  select.replaceChildren();
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "未選択";
  if (!selectedVenueName) empty.selected = true;
  select.append(empty);

  for (const venue of venues) {
    const option = document.createElement("option");
    option.value = "";
    option.dataset.venueName = venue.name;
    option.textContent = venue.name;
    if (selectedVenueName === venue.name) option.selected = true;
    select.append(option);
  }
}

export function createScheduleAdminListItem(
  item: ScheduleAdminRecord,
  venues: VenueOption[],
  listIndex: number
) {
  const symbol = getTimeTypeSymbol(item.time_type);

  const li = document.createElement("li");
  li.className = "schedule-admin-item admin-list__item";
  if (listIndex >= 10) li.classList.add("is-list-hidden");
  li.dataset.id = String(item.id ?? "");
  li.dataset.listIndex = String(listIndex);
  li.dataset.searchText = buildSearchText(item);

  const header = document.createElement("div");
  header.className = "schedule-admin-item__header";

  const summary = document.createElement("p");
  summary.className = "schedule-admin-item__summary";

  if (symbol) {
    const icon = document.createElement("span");
    icon.className = "schedule-admin-item__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = symbol;
    summary.append(icon);
  }

  const dateSpan = document.createElement("span");
  dateSpan.className = "schedule-admin-item__date";
  dateSpan.textContent = item.date;
  summary.append(dateSpan);

  const titleStrong = document.createElement("strong");
  titleStrong.className = "schedule-admin-item__title";
  titleStrong.textContent = item.title || "（タイトル未設定）";
  summary.append(titleStrong);

  if (item.venue_name) {
    const venueSpan = document.createElement("span");
    venueSpan.className = "schedule-admin-item__venue";
    venueSpan.textContent = item.venue_name;
    summary.append(venueSpan);
  }

  const status = document.createElement("p");
  status.className = "schedule-admin-item__status";
  status.textContent = `${item.is_published ? "公開" : "非公開"}${item.is_special ? " / TOUR" : " / 通常"}`;

  const actions = document.createElement("div");
  actions.className = "schedule-admin-item__actions admin-actions";

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
  form.className = "admin-form admin-form--grid schedule-edit-form is-hidden";

  const row1 = document.createElement("div");
  row1.className = "admin-form__row";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.name = "date";
  dateInput.dataset.field = "date";
  dateInput.value = item.date;
  appendField(row1, "日付", dateInput);
  appendField(row1, "時間帯", createTimeTypeSelect(item.time_type));
  form.append(row1);

  const row2 = document.createElement("div");
  row2.className = "admin-form__row";
  appendField(row2, "会場（venues から選択）", createVenueSelect(venues, item.venue_name));

  const venueNameInput = document.createElement("input");
  venueNameInput.type = "text";
  venueNameInput.name = "venue_name";
  venueNameInput.dataset.field = "venue_name";
  venueNameInput.value = item.venue_name || "";
  appendField(row2, "会場名（自由入力）", venueNameInput);
  form.append(row2);

  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.name = "title";
  titleInput.dataset.field = "title";
  titleInput.value = item.title || "";
  appendField(form, "タイトル", titleInput);

  const row3 = document.createElement("div");
  row3.className = "admin-form__row";

  const openTimeInput = document.createElement("input");
  openTimeInput.type = "text";
  openTimeInput.name = "open_time";
  openTimeInput.dataset.field = "open_time";
  openTimeInput.value = item.open_time || "";
  appendField(row3, "開場時間", openTimeInput);

  const startTimeInput = document.createElement("input");
  startTimeInput.type = "text";
  startTimeInput.name = "start_time";
  startTimeInput.dataset.field = "start_time";
  startTimeInput.value = item.start_time || "";
  appendField(row3, "開演時間", startTimeInput);
  form.append(row3);

  const row4 = document.createElement("div");
  row4.className = "admin-form__row";

  const priceInput = document.createElement("input");
  priceInput.type = "text";
  priceInput.name = "price";
  priceInput.dataset.field = "price";
  priceInput.value = item.price || "";
  appendField(row4, "料金", priceInput);

  const genreInput = document.createElement("input");
  genreInput.type = "text";
  genreInput.name = "genre";
  genreInput.dataset.field = "genre";
  genreInput.value = item.genre || "";
  appendField(row4, "ジャンル", genreInput);
  form.append(row4);

  const membersInput = document.createElement("input");
  membersInput.type = "text";
  membersInput.name = "members";
  membersInput.dataset.field = "members";
  membersInput.value = item.members || "";
  appendField(form, "メンバー", membersInput);

  const reservationInput = document.createElement("input");
  reservationInput.type = "url";
  reservationInput.name = "reservation_url";
  reservationInput.dataset.field = "reservation_url";
  reservationInput.value = item.reservation_url || "";
  appendField(form, "予約URL", reservationInput);

  const imageInput = document.createElement("input");
  imageInput.type = "url";
  imageInput.name = "image_url";
  imageInput.dataset.field = "image_url";
  imageInput.value = item.image_url || "";
  appendField(form, "画像URL", imageInput);

  const noteArea = document.createElement("textarea");
  noteArea.name = "note";
  noteArea.dataset.field = "note";
  noteArea.rows = 3;
  noteArea.textContent = item.note || "";
  appendField(form, "備考", noteArea);

  const checkboxRow = document.createElement("div");
  checkboxRow.className = "admin-form__row";

  for (const [name, label] of [
    ["is_published", "公開する（is_published）"],
    ["is_special", "TOUR・特集掲載（is_special）"],
  ] as const) {
    const checkboxLabel = document.createElement("label");
    checkboxLabel.className = "admin-form__checkbox";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = name;
    checkbox.dataset.field = name;
    checkbox.value = "true";
    checkbox.checked = Boolean(item[name]);
    const text = document.createElement("span");
    text.textContent = label;
    checkboxLabel.append(checkbox, text);
    checkboxRow.append(checkboxLabel);
  }
  form.append(checkboxRow);

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

import { initPaginatedList } from "../../lib/admin/paginated-list";
import { supabase } from "../../lib/supabase";

function getField(form: ParentNode, name: string) {
  const el = form.querySelector(`[data-field="${name}"], [name="${name}"]`);
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
    ? el
    : el instanceof HTMLSelectElement
      ? el
      : null;
}

function getCheckbox(form: ParentNode, name: string) {
  const el = form.querySelector(`[data-field="${name}"], [name="${name}"]`);
  return el instanceof HTMLInputElement ? el : null;
}

function getTextValue(form: ParentNode, name: string) {
  return getField(form, name)?.value?.trim() ?? "";
}

function parseVenueId(value: string) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function nullableText(value: string) {
  return value === "" ? null : value;
}

function buildScheduleRecord(form: ParentNode) {
  const venueIdRaw = getTextValue(form, "venue_id");
  const openTimeRaw = getTextValue(form, "open_time");
  const startTimeRaw = getTextValue(form, "start_time");

  return {
    date: getTextValue(form, "date"),
    time_type: nullableText(getTextValue(form, "time_type")),
    venue_id: parseVenueId(venueIdRaw),
    venue_name: nullableText(getTextValue(form, "venue_name")),
    title: nullableText(getTextValue(form, "title")),
    genre: nullableText(getTextValue(form, "genre")),
    open_time: openTimeRaw === "" ? null : openTimeRaw,
    start_time: startTimeRaw === "" ? null : startTimeRaw,
    price: nullableText(getTextValue(form, "price")),
    members: nullableText(getTextValue(form, "members")),
    reservation_url: nullableText(getTextValue(form, "reservation_url")),
    note: nullableText(getTextValue(form, "note")),
    image_url: nullableText(getTextValue(form, "image_url")),
    is_published: Boolean(getCheckbox(form, "is_published")?.checked),
    is_special: Boolean(getCheckbox(form, "is_special")?.checked),
  };
}

function bindVenueSelect(form: ParentNode) {
  const venueSelect = getField(form, "venue_id");
  const venueNameInput = getField(form, "venue_name");
  if (!venueSelect || !venueNameInput || !(venueSelect instanceof HTMLSelectElement)) return;

  venueSelect.addEventListener("change", () => {
    const selectedOption = venueSelect.options[venueSelect.selectedIndex];
    const venueName = selectedOption?.dataset.venueName;
    if (venueName) {
      venueNameInput.value = venueName;
    }
  });
}

function getScheduleItemSearchText(item: Element) {
  const el = item as HTMLElement;
  return el.dataset.searchText?.toLowerCase() ?? "";
}

function getScheduleLists() {
  return [
    document.getElementById("upcomingScheduleList"),
    document.getElementById("pastScheduleList"),
  ].filter((el): el is HTMLElement => el instanceof HTMLElement);
}

export function initScheduleAdmin() {
  const message = document.getElementById("message");
  const addForm = document.getElementById("addScheduleForm");

  const upcomingController = initPaginatedList({
    listEl: document.getElementById("upcomingScheduleList"),
    loadMoreBtn: document.getElementById("loadMoreUpcoming"),
    emptyMessageEl: document.getElementById("upcomingSearchEmpty"),
    itemSelector: ".schedule-admin-item",
    getSearchText: getScheduleItemSearchText,
  });

  const pastController = initPaginatedList({
    listEl: document.getElementById("pastScheduleList"),
    loadMoreBtn: document.getElementById("loadMorePast"),
    emptyMessageEl: document.getElementById("pastSearchEmpty"),
    itemSelector: ".schedule-admin-item",
    getSearchText: getScheduleItemSearchText,
  });

  const scheduleSearchInput = document.getElementById("scheduleSearch");
  const scheduleSearchStatus = document.getElementById("scheduleSearchStatus");
  const pastDetails = document.querySelector(".schedule-admin-past");

  scheduleSearchInput?.addEventListener("input", () => {
    const query = scheduleSearchInput instanceof HTMLInputElement ? scheduleSearchInput.value : "";
    const upcomingMatches = upcomingController?.applySearch(query) ?? 0;
    const pastMatches = pastController?.applySearch(query) ?? 0;
    const totalMatches = upcomingMatches + pastMatches;
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      if (pastDetails instanceof HTMLDetailsElement && pastMatches > 0) {
        pastDetails.open = true;
      }

      if (scheduleSearchStatus) {
        scheduleSearchStatus.textContent = `${totalMatches}件見つかりました`;
        scheduleSearchStatus.classList.remove("is-hidden");
      }
      return;
    }

    upcomingController?.clearSearchFilter();
    pastController?.clearSearchFilter();
    if (scheduleSearchStatus) {
      scheduleSearchStatus.textContent = "";
      scheduleSearchStatus.classList.add("is-hidden");
    }
  });

  if (addForm) bindVenueSelect(addForm);
  document.querySelectorAll(".schedule-edit-form").forEach((form) => bindVenueSelect(form));

  document.getElementById("add")?.addEventListener("click", async () => {
    if (!addForm || !message) return;

    const record = buildScheduleRecord(addForm);

    if (!record.date) {
      message.textContent = "日付を入力してください。";
      return;
    }

    const { error } = await supabase.from("schedules").insert([record]);

    if (error) {
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    message.textContent = "保存しました。";
    location.reload();
  });

  for (const list of getScheduleLists()) {
    list.addEventListener("click", (event) => {
      const button = (event.target as Element | null)?.closest("button");
      if (!button || !list.contains(button)) return;

      const item = button.closest(".schedule-admin-item");
      if (!item) return;

      if (button.classList.contains("toggle-edit")) {
        const form = item.querySelector(".schedule-edit-form");
        if (!form) return;
        const isHidden = form.classList.toggle("is-hidden");
        button.textContent = isHidden ? "編集" : "閉じる";
        return;
      }

      if (button.classList.contains("update")) {
        void (async () => {
          if (!message) return;

          const id = item.getAttribute("data-id");
          if (!id) {
            message.textContent = "IDが取得できないため更新できません。ページを再読み込みしてください。";
            return;
          }

          const form = item.querySelector(".schedule-edit-form");
          if (!form) return;

          const record = buildScheduleRecord(form);

          if (!record.date) {
            message.textContent = "日付を入力してください。";
            return;
          }

          const { error } = await supabase.from("schedules").update(record).eq("id", id);

          if (error) {
            message.textContent = "更新に失敗しました：" + error.message;
            return;
          }

          message.textContent = "更新しました。";
          location.reload();
        })();
        return;
      }

      if (button.classList.contains("duplicate")) {
        void (async () => {
          if (!message) return;

          if (!confirm("このスケジュールを複製しますか？")) return;

          const id = item.getAttribute("data-id");
          if (!id) {
            message.textContent = "IDが取得できないため複製できません。ページを再読み込みしてください。";
            return;
          }

          const form = item.querySelector(".schedule-edit-form");
          if (!form) return;

          const record = buildScheduleRecord(form);

          if (!record.date) {
            message.textContent = "日付を入力してください。";
            return;
          }

          const duplicateTitle = record.title ? `${record.title} のコピー` : "無題のコピー";
          const payload = { ...record, title: duplicateTitle };

          const { error } = await supabase.from("schedules").insert([payload]);

          if (error) {
            message.textContent = "複製に失敗しました：" + error.message;
            return;
          }

          message.textContent = "複製しました。";
          location.reload();
        })();
        return;
      }

      if (button.classList.contains("delete")) {
        void (async () => {
          if (!message) return;

          if (!confirm("このスケジュールを削除します。元に戻せません。よろしいですか？")) return;

          const id = item.getAttribute("data-id");
          if (!id) {
            message.textContent = "IDが取得できないため削除できません。ページを再読み込みしてください。";
            return;
          }

          const { error } = await supabase.from("schedules").delete().eq("id", id);

          if (error) {
            message.textContent = "削除に失敗しました：" + error.message;
            return;
          }

          message.textContent = "削除しました。";
          location.reload();
        })();
      }
    });
  }
}

initScheduleAdmin();

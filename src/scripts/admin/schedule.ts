import {
  createScheduleAdminListItem,
  populateVenueSelect,
} from "../../lib/admin/create-schedule-list-item";
import { initPaginatedList, type PaginatedListController } from "../../lib/admin/paginated-list";
import {
  SCHEDULE_TIME_TYPE_OPTIONS,
  type ScheduleAdminRecord,
  type VenueOption,
} from "../../lib/admin/schedule-constants";
import { supabase } from "../../lib/supabase";

const PUBLIC_SITE_REBUILD_MESSAGE =
  "公開サイト（/live-schedule/ ・トップページなど）へ反映するには、GitHub Actions で再ビルド・再デプロイしてください。";

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

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function splitSchedules(schedules: ScheduleAdminRecord[]) {
  const today = getTodayIsoDate();
  const upcoming = schedules
    .filter((item) => item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = schedules
    .filter((item) => item.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}

function setScheduleLoading(isLoading: boolean) {
  document.getElementById("scheduleListLoading")?.classList.toggle("is-hidden", !isLoading);
}

function updateScheduleEmptyStates(upcomingCount: number, pastCount: number) {
  document.getElementById("upcomingListEmpty")?.classList.toggle("is-hidden", upcomingCount > 0);
  document.getElementById("loadMoreUpcoming")?.classList.toggle("is-hidden", upcomingCount <= 10);

  const pastSection = document.getElementById("pastScheduleSection");
  pastSection?.classList.toggle("is-hidden", pastCount === 0);
  document.getElementById("pastListEmpty")?.classList.toggle("is-hidden", pastCount > 0);
  document.getElementById("loadMorePast")?.classList.toggle("is-hidden", pastCount <= 10);
}

function bindEditFormVenueSelects() {
  document.querySelectorAll(".schedule-edit-form").forEach((form) => bindVenueSelect(form));
}

async function fetchScheduleAdminData() {
  console.log("[schedule-admin] fetching latest schedule from Supabase");
  const [schedulesResult, venuesResult] = await Promise.all([
    supabase.from("schedules").select("*").order("date", { ascending: true }),
    supabase.from("venues").select("*").order("name", { ascending: true }),
  ]);

  console.log("[schedule-admin] supabase fetch result", {
    scheduleError: schedulesResult.error,
    scheduleCount: schedulesResult.data?.length ?? 0,
    venueError: venuesResult.error,
    venueCount: venuesResult.data?.length ?? 0,
  });

  return { schedulesResult, venuesResult };
}

export function initScheduleAdmin() {
  const message = document.getElementById("message");
  const addForm = document.getElementById("addScheduleForm");
  const upcomingList = document.getElementById("upcomingScheduleList");
  const pastList = document.getElementById("pastScheduleList");
  const addVenueSelect = document.getElementById("addVenueSelect");

  let venuesCache: VenueOption[] = [];
  let upcomingController: PaginatedListController | null = null;
  let pastController: PaginatedListController | null = null;

  if (upcomingList) {
    upcomingController = initPaginatedList({
      listEl: upcomingList,
      loadMoreBtn: document.getElementById("loadMoreUpcoming"),
      emptyMessageEl: document.getElementById("upcomingSearchEmpty"),
      itemSelector: ".schedule-admin-item",
      getSearchText: getScheduleItemSearchText,
    });
  }

  if (pastList) {
    pastController = initPaginatedList({
      listEl: pastList,
      loadMoreBtn: document.getElementById("loadMorePast"),
      emptyMessageEl: document.getElementById("pastSearchEmpty"),
      itemSelector: ".schedule-admin-item",
      getSearchText: getScheduleItemSearchText,
    });
  }

  function renderScheduleLists(schedules: ScheduleAdminRecord[], venues: VenueOption[]) {
    const { upcoming, past } = splitSchedules(schedules);

    upcomingList?.replaceChildren();
    pastList?.replaceChildren();

    upcoming.forEach((item, index) => {
      upcomingList?.append(createScheduleAdminListItem(item, venues, index));
    });

    past.forEach((item, index) => {
      pastList?.append(createScheduleAdminListItem(item, venues, index));
    });

    updateScheduleEmptyStates(upcoming.length, past.length);
    upcomingController?.refreshItems();
    pastController?.refreshItems();
    bindEditFormVenueSelects();

    console.log("[schedule-admin] list rendered", {
      upcoming: upcoming.length,
      past: past.length,
    });
  }

  async function reloadScheduleList() {
    setScheduleLoading(true);

    const { schedulesResult, venuesResult } = await fetchScheduleAdminData();

    setScheduleLoading(false);

    if (schedulesResult.error) {
      alert(`スケジュール一覧の取得に失敗しました: ${schedulesResult.error.message}`);
      if (message) message.textContent = `スケジュール一覧の取得に失敗しました: ${schedulesResult.error.message}`;
      return;
    }

    if (venuesResult.error) {
      alert(`会場一覧の取得に失敗しました: ${venuesResult.error.message}`);
      if (message) message.textContent = `会場一覧の取得に失敗しました: ${venuesResult.error.message}`;
      return;
    }

    venuesCache = (venuesResult.data ?? []) as VenueOption[];

    if (addVenueSelect instanceof HTMLSelectElement) {
      populateVenueSelect(addVenueSelect, venuesCache);
    }

    renderScheduleLists((schedulesResult.data ?? []) as ScheduleAdminRecord[], venuesCache);
  }

  void reloadScheduleList();

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

  document.getElementById("add")?.addEventListener("click", async () => {
    if (!addForm || !message) return;

    const record = buildScheduleRecord(addForm);

    if (!record.date) {
      message.textContent = "日付を入力してください。";
      return;
    }

    const { error } = await supabase.from("schedules").insert([record]);

    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    message.textContent = `保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
    await reloadScheduleList();
  });

  const attachListHandlers = (list: HTMLElement) => {
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
            alert("IDが取得できないため更新できません。ページを再読み込みしてください。");
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
            alert(`更新に失敗しました: ${error.message}`);
            message.textContent = "更新に失敗しました：" + error.message;
            return;
          }

          message.textContent = `更新しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
          await reloadScheduleList();
        })();
        return;
      }

      if (button.classList.contains("duplicate")) {
        void (async () => {
          if (!message) return;

          if (!confirm("このスケジュールを複製しますか？")) return;

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
            alert(`複製に失敗しました: ${error.message}`);
            message.textContent = "複製に失敗しました：" + error.message;
            return;
          }

          message.textContent = "複製しました。";
          await reloadScheduleList();
        })();
        return;
      }

      if (button.classList.contains("delete")) {
        void (async () => {
          console.log("[schedule-admin] delete button clicked");

          if (!message) return;

          if (!confirm("このスケジュールを削除します。元に戻せません。よろしいですか？")) return;

          const id = item.getAttribute("data-id");
          if (!id) {
            alert("IDが取得できないため削除できません。ページを再読み込みしてください。");
            return;
          }

          console.log("[schedule-admin] deleting id:", id);

          const { data, error, count } = await supabase
            .from("schedules")
            .delete({ count: "exact" })
            .eq("id", id)
            .select();

          console.log("[schedule-admin] supabase delete result", { data, error, count });

          if (error) {
            alert(`削除に失敗しました: ${error.message}`);
            message.textContent = "削除に失敗しました：" + error.message;
            return;
          }

          if (count === 0) {
            alert("削除対象が見つかりませんでした。一覧を再読み込みします。");
            await reloadScheduleList();
            return;
          }

          console.log("[schedule-admin] delete success, removing item from DOM");
          item.remove();

          const isPastItem = list.id === "pastScheduleList";
          if (isPastItem) {
            pastController?.refreshItems();
          } else {
            upcomingController?.refreshItems();
          }

          const upcomingCount = upcomingList?.querySelectorAll(".schedule-admin-item").length ?? 0;
          const pastCount = pastList?.querySelectorAll(".schedule-admin-item").length ?? 0;
          updateScheduleEmptyStates(upcomingCount, pastCount);

          message.textContent = `削除しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
          console.log("[schedule-admin] remove item complete");
        })();
      }
    });
  };

  if (upcomingList) attachListHandlers(upcomingList);
  if (pastList) attachListHandlers(pastList);
}

initScheduleAdmin();

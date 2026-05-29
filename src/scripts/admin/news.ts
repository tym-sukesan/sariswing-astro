import { createNewsAdminListItem } from "../../lib/admin/create-news-list-item";
import { initImageUploadFields } from "../../lib/admin/mount-image-upload-field";
import { initPaginatedList, type PaginatedListController } from "../../lib/admin/paginated-list";
import { NEWS_SELECT, type NewsRecord } from "../../lib/news";
import { supabase } from "../../lib/supabase";

const PUBLIC_SITE_REBUILD_MESSAGE =
  "公開サイト（/news/ ・トップページなど）へ反映するには、GitHub Actions で再ビルド・再デプロイしてください。";

function slugifyTitle(title: string) {
  const ascii = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return ascii || null;
}

function generateSlug(title: string, date: string, explicitSlug: string | null) {
  if (explicitSlug) return explicitSlug;
  const fromTitle = slugifyTitle(title);
  if (fromTitle) return fromTitle;
  const normalized = (date || "").replace(/\./g, "-");
  const datePart = normalized.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return `news-${datePart || Date.now()}`;
}

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

function buildNewsRecord(form: ParentNode) {
  const date = getField(form, "date")?.value?.trim() ?? "";
  const title = getField(form, "title")?.value?.trim() ?? "";
  const url = getField(form, "url")?.value?.trim() || null;
  const slugInput = getField(form, "slug")?.value?.trim() ?? "";
  const slug = url ? slugInput || null : generateSlug(title, date, slugInput);
  const excerpt = getField(form, "excerpt")?.value?.trim() || null;
  const content = getField(form, "content")?.value?.trim() || null;
  const image_url = getField(form, "image_url")?.value?.trim() || null;
  const category = getField(form, "category")?.value?.trim() || null;
  const is_published = Boolean(getCheckbox(form, "is_published")?.checked);

  return { date, title, url, slug, excerpt, content, image_url, category, is_published };
}

function getNewsItemSearchText(item: Element) {
  return item.querySelector(".news-admin-item__search-source")?.textContent?.toLowerCase() ?? "";
}

function getNewsItem(button: Element) {
  return button.closest(".news-admin-item");
}

function setListLoading(isLoading: boolean) {
  const loading = document.getElementById("newsListLoading");
  loading?.classList.toggle("is-hidden", !isLoading);
}

function updateListEmptyState(newsList: HTMLElement | null) {
  const emptyEl = document.getElementById("newsListEmpty");
  const loadMoreBtn = document.getElementById("loadMoreNews");
  const itemCount = newsList?.querySelectorAll(".news-admin-item").length ?? 0;

  emptyEl?.classList.toggle("is-hidden", itemCount > 0);
  loadMoreBtn?.classList.toggle("is-hidden", itemCount <= 10);
}

async function fetchNewsFromSupabase() {
  console.log("[news-admin] fetching latest news from Supabase");
  const result = await supabase.from("news").select(NEWS_SELECT).order("date", { ascending: false });
  console.log("[news-admin] supabase fetch result", {
    error: result.error,
    count: result.data?.length ?? 0,
  });
  return result;
}

function renderNewsList(items: NewsRecord[], newsList: HTMLElement) {
  newsList.replaceChildren();
  items.forEach((item, index) => {
    newsList.append(createNewsAdminListItem(item, index));
  });
  initImageUploadFields(newsList);
  updateListEmptyState(newsList);
}

export function initNewsAdmin() {
  const message = document.getElementById("message");
  const addForm = document.getElementById("addNewsForm");
  const newsList = document.getElementById("newsList");
  const loadMoreBtn = document.getElementById("loadMoreNews");

  initImageUploadFields(document);

  let newsController: PaginatedListController | null = null;

  async function reloadNewsList() {
    if (!newsList) return;

    setListLoading(true);

    const { data, error } = await fetchNewsFromSupabase();

    setListLoading(false);

    if (error) {
      console.error("[news-admin] failed to load list", error);
      alert(`NEWS一覧の取得に失敗しました: ${error.message}`);
      if (message) message.textContent = `NEWS一覧の取得に失敗しました: ${error.message}`;
      return;
    }

    renderNewsList((data ?? []) as NewsRecord[], newsList);
    newsController?.refreshItems();
    console.log("[news-admin] list rendered", { count: data?.length ?? 0 });
  }

  if (newsList) {
    newsController = initPaginatedList({
      listEl: newsList,
      loadMoreBtn,
      emptyMessageEl: document.getElementById("newsSearchEmpty"),
      itemSelector: ".news-admin-item",
      getSearchText: getNewsItemSearchText,
    });
  }

  void reloadNewsList();

  const newsSearchInput = document.getElementById("newsSearch");
  const newsSearchStatus = document.getElementById("newsSearchStatus");

  newsSearchInput?.addEventListener("input", () => {
    const query = newsSearchInput instanceof HTMLInputElement ? newsSearchInput.value : "";
    const matchCount = newsController?.applySearch(query) ?? 0;
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      if (newsSearchStatus) {
        newsSearchStatus.textContent = `${matchCount}件見つかりました`;
        newsSearchStatus.classList.remove("is-hidden");
      }
      return;
    }

    newsController?.clearSearchFilter();
    if (newsSearchStatus) {
      newsSearchStatus.textContent = "";
      newsSearchStatus.classList.add("is-hidden");
    }
  });

  document.getElementById("add")?.addEventListener("click", async () => {
    if (!addForm || !message) return;

    const payload = buildNewsRecord(addForm);

    if (!payload.date || !payload.title) {
      message.textContent = "日付とタイトルを入力してください。";
      return;
    }

    const { error } = await supabase.from("news").insert([payload]);

    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    message.textContent = `保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
    await reloadNewsList();
  });

  newsList?.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button");
    if (!button || !newsList.contains(button)) return;

    const item = getNewsItem(button);
    if (!item) return;

    if (button.classList.contains("toggle-edit")) {
      const form = item.querySelector(".news-edit-form");
      if (!form) return;
      const isHidden = form.classList.toggle("is-hidden");
      button.textContent = isHidden ? "編集" : "閉じる";
      return;
    }

    if (button.classList.contains("update")) {
      void (async () => {
        if (!message) return;
        const form = item.querySelector(".news-edit-form");
        if (!form) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため更新できません。ページを再読み込みしてください。");
          return;
        }

        const payload = buildNewsRecord(form);

        if (!payload.date || !payload.title) {
          message.textContent = "日付とタイトルを入力してください。";
          return;
        }

        const { error } = await supabase.from("news").update(payload).eq("id", id);

        if (error) {
          alert(`更新に失敗しました: ${error.message}`);
          message.textContent = "更新に失敗しました：" + error.message;
          return;
        }

        message.textContent = `更新しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
        await reloadNewsList();
      })();
      return;
    }

    if (button.classList.contains("duplicate")) {
      void (async () => {
        if (!message) return;
        const form = item.querySelector(".news-edit-form");
        if (!form) return;

        const payload = buildNewsRecord(form);

        if (!payload.date || !payload.title) {
          message.textContent = "日付とタイトルを入力してください。";
          return;
        }

        const duplicatePayload = {
          ...payload,
          title: `${payload.title}（複製）`,
          slug: payload.slug
            ? `${payload.slug}-copy-${Date.now()}`
            : generateSlug(payload.title, payload.date, null),
          is_published: false,
        };

        const { error } = await supabase.from("news").insert([duplicatePayload]);

        if (error) {
          alert(`複製に失敗しました: ${error.message}`);
          message.textContent = "複製に失敗しました：" + error.message;
          return;
        }

        message.textContent = "複製しました（非公開で追加）。必要に応じて編集してください。";
        await reloadNewsList();
      })();
      return;
    }

    if (button.classList.contains("delete")) {
      void (async () => {
        console.log("[news-admin] delete button clicked");

        if (!message) return;

        if (!confirm("このNEWSを削除しますか？")) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため削除できません。ページを再読み込みしてください。");
          return;
        }

        console.log("[news-admin] deleting id:", id);

        const { data, error, count } = await supabase
          .from("news")
          .delete({ count: "exact" })
          .eq("id", id)
          .select();

        console.log("[news-admin] supabase delete result", { data, error, count });

        if (error) {
          alert(`削除に失敗しました: ${error.message}`);
          message.textContent = "削除に失敗しました：" + error.message;
          return;
        }

        if (count === 0) {
          console.warn("[news-admin] delete returned count 0 for id:", id);
          alert("削除対象が見つかりませんでした。一覧を再読み込みします。");
          await reloadNewsList();
          return;
        }

        console.log("[news-admin] delete success, removing item from DOM");
        item.remove();
        newsController?.refreshItems();
        updateListEmptyState(newsList);

        message.textContent = `削除しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
        console.log("[news-admin] remove item complete");
      })();
    }
  });
}

initNewsAdmin();

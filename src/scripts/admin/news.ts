import {
  createNewsAdminDeletedListItem,
  createNewsAdminListItem,
} from "../../lib/admin/create-news-list-item";
import { initImageUploadFields } from "../../lib/admin/mount-image-upload-field";
import {
  createNews,
  deleteNews,
  duplicateNews,
  listDeletedNews,
  listNews,
  restoreNews,
  updateNews,
  type NewsWritePayload,
} from "../../lib/admin/news-api";
import { initPaginatedList, type PaginatedListController } from "../../lib/admin/paginated-list";
import { requireAdminSession, signOutAdmin } from "../../lib/admin/require-admin-session";
import type { NewsRecord } from "../../lib/news";

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

function buildNewsRecord(form: ParentNode): NewsWritePayload {
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

function renderNewsList(items: NewsRecord[], newsList: HTMLElement) {
  newsList.replaceChildren();
  items.forEach((item, index) => {
    newsList.append(createNewsAdminListItem(item, index));
  });
  initImageUploadFields(newsList);
  updateListEmptyState(newsList);
}

function updateDeletedListEmptyState(deletedList: HTMLElement | null) {
  const emptyEl = document.getElementById("deletedNewsListEmpty");
  const section = document.getElementById("deletedNewsSection");
  const itemCount = deletedList?.querySelectorAll(".news-admin-item").length ?? 0;

  emptyEl?.classList.toggle("is-hidden", itemCount > 0);
  section?.classList.toggle("is-hidden", itemCount === 0);
}

function renderDeletedNewsList(items: NewsRecord[], deletedList: HTMLElement) {
  deletedList.replaceChildren();
  items.forEach((item, index) => {
    deletedList.append(createNewsAdminDeletedListItem(item, index));
  });
  updateDeletedListEmptyState(deletedList);
}

export function initNewsAdmin() {
  const message = document.getElementById("message");
  const addForm = document.getElementById("addNewsForm");
  const newsList = document.getElementById("newsList");
  const deletedNewsList = document.getElementById("deletedNewsList");
  const loadMoreBtn = document.getElementById("loadMoreNews");

  initImageUploadFields(document);

  let newsController: PaginatedListController | null = null;

  async function reloadNewsList() {
    if (!newsList) return;

    setListLoading(true);

    try {
      const [data, deleted] = await Promise.all([listNews(), listDeletedNews()]);
      renderNewsList(data, newsList);
      newsController?.refreshItems();
      if (deletedNewsList) {
        renderDeletedNewsList(deleted, deletedNewsList);
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "NEWS一覧の取得に失敗しました。";
      alert(`NEWS一覧の取得に失敗しました: ${text}`);
      if (message) message.textContent = `NEWS一覧の取得に失敗しました: ${text}`;
    } finally {
      setListLoading(false);
    }
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

    try {
      await createNews(payload);
      message.textContent = `保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
      await reloadNewsList();
    } catch (err) {
      const text = err instanceof Error ? err.message : "保存に失敗しました。";
      alert(`保存に失敗しました: ${text}`);
      message.textContent = `保存に失敗しました：${text}`;
    }
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

        try {
          await updateNews(id, payload);
          message.textContent = `更新しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
          await reloadNewsList();
        } catch (err) {
          const text = err instanceof Error ? err.message : "更新に失敗しました。";
          alert(`更新に失敗しました: ${text}`);
          message.textContent = `更新に失敗しました：${text}`;
        }
      })();
      return;
    }

    if (button.classList.contains("duplicate")) {
      void (async () => {
        if (!message) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため複製できません。ページを再読み込みしてください。");
          return;
        }

        try {
          await duplicateNews(id);
          message.textContent = "複製しました（非公開で追加）。必要に応じて編集してください。";
          await reloadNewsList();
        } catch (err) {
          const text = err instanceof Error ? err.message : "複製に失敗しました。";
          alert(`複製に失敗しました: ${text}`);
          message.textContent = `複製に失敗しました：${text}`;
        }
      })();
      return;
    }

    if (button.classList.contains("delete")) {
      void (async () => {
        if (!message) return;

        if (!confirm("このNEWSを削除しますか？削除済み一覧に移動し、公開サイトからは非表示になります。")) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため削除できません。ページを再読み込みしてください。");
          return;
        }

        try {
          const result = await deleteNews(id);

          if (result.count === 0) {
            alert("削除対象が見つかりませんでした。一覧を再読み込みします。");
            await reloadNewsList();
            return;
          }

          await reloadNewsList();

          message.textContent = `削除しました（削除済み一覧に移動）。${PUBLIC_SITE_REBUILD_MESSAGE}`;
        } catch (err) {
          const text = err instanceof Error ? err.message : "削除に失敗しました。";
          alert(`削除に失敗しました: ${text}`);
          message.textContent = `削除に失敗しました：${text}`;
        }
      })();
    }
  });

  deletedNewsList?.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button.restore");
    if (!button || !deletedNewsList.contains(button)) return;

    void (async () => {
      if (!message) return;

      const item = button.closest(".news-admin-item");
      const id = item?.getAttribute("data-id");
      if (!id) {
        alert("IDが取得できないため復元できません。ページを再読み込みしてください。");
        return;
      }

      if (!confirm("このNEWSを復元しますか？")) return;

      try {
        const result = await restoreNews(id);

        if (result.count === 0) {
          alert("復元対象が見つかりませんでした。一覧を再読み込みします。");
          await reloadNewsList();
          return;
        }

        await reloadNewsList();
        message.textContent = `復元しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
      } catch (err) {
        const text = err instanceof Error ? err.message : "復元に失敗しました。";
        alert(`復元に失敗しました: ${text}`);
        message.textContent = `復元に失敗しました：${text}`;
      }
    })();
  });

  void (async () => {
    const ok = await requireAdminSession();
    if (!ok) return;

    document.getElementById("adminLogout")?.addEventListener("click", () => {
      void signOutAdmin();
    });

    await reloadNewsList();
  })();
}

initNewsAdmin();

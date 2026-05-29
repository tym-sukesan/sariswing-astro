import { initPaginatedList } from "../../lib/admin/paginated-list";
import { supabase } from "../../lib/supabase";

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

export function initNewsAdmin() {
  const message = document.getElementById("message");
  const addForm = document.getElementById("addNewsForm");
  const newsList = document.getElementById("newsList");

  const newsController = initPaginatedList({
    listEl: newsList,
    loadMoreBtn: document.getElementById("loadMoreNews"),
    emptyMessageEl: document.getElementById("newsSearchEmpty"),
    itemSelector: ".news-admin-item",
    getSearchText: getNewsItemSearchText,
  });

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
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    message.textContent = "保存しました。サイトを再ビルドすると /news/ に反映されます。";
    location.reload();
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
          message.textContent = "IDが取得できないため更新できません。ページを再読み込みしてください。";
          return;
        }

        const payload = buildNewsRecord(form);

        if (!payload.date || !payload.title) {
          message.textContent = "日付とタイトルを入力してください。";
          return;
        }

        const { error } = await supabase.from("news").update(payload).eq("id", id);

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
          message.textContent = "複製に失敗しました：" + error.message;
          return;
        }

        message.textContent = "複製しました（非公開で追加）。必要に応じて編集してください。";
        location.reload();
      })();
      return;
    }

    if (button.classList.contains("delete")) {
      void (async () => {
        if (!message) return;

        if (!confirm("このNEWSを削除しますか？")) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          message.textContent = "IDが取得できないため削除できません。ページを再読み込みしてください。";
          return;
        }

        const { error } = await supabase.from("news").delete().eq("id", id);

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

initNewsAdmin();

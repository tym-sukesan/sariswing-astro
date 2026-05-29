import {
  createInstagramAdminListItem,
  type InstagramAdminRecord,
} from "../../lib/admin/create-instagram-list-item";
import {
  nextSortOrderForNewPost,
  sortInstagramPosts,
} from "../../lib/instagram-posts";
import { supabase } from "../../lib/supabase";

declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } };
    processInstagramEmbeds?: () => void;
  }
}

const PUBLIC_SITE_REBUILD_MESSAGE =
  "公開サイト（トップページなど）へ反映するには、GitHub Actions で再ビルド・再デプロイしてください。";

function processInstagramEmbeds() {
  window.instgrm?.Embeds?.process?.();
}

function waitForInstagramEmbeds() {
  if (window.instgrm?.Embeds?.process) {
    processInstagramEmbeds();
    return;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (window.instgrm?.Embeds?.process) {
      processInstagramEmbeds();
      clearInterval(timer);
    } else if (attempts >= 25) {
      clearInterval(timer);
    }
  }, 200);
}

function setInstagramLoading(isLoading: boolean) {
  document.getElementById("postListLoading")?.classList.toggle("is-hidden", !isLoading);
}

function updateInstagramEmptyState(postList: HTMLElement | null) {
  const count = postList?.querySelectorAll(".instagram-admin-item").length ?? 0;
  document.getElementById("postListEmpty")?.classList.toggle("is-hidden", count > 0);
}

async function fetchInstagramFromSupabase() {
  const result = await supabase.from("instagram_posts").select("*");

  if (result.error) return result;

  return {
    ...result,
    data: sortInstagramPosts((result.data ?? []) as InstagramAdminRecord[]),
  };
}

function renderInstagramList(items: InstagramAdminRecord[], postList: HTMLElement) {
  postList.replaceChildren();
  items.forEach((item) => {
    postList.append(createInstagramAdminListItem(item));
  });
  updateInstagramEmptyState(postList);
  processInstagramEmbeds();
  setTimeout(processInstagramEmbeds, 300);
  setTimeout(processInstagramEmbeds, 1000);
}

function collectSortOrderUpdates(postList: HTMLElement) {
  const updates: { id: string; sort_order: number }[] = [];

  for (const item of postList.querySelectorAll(".instagram-admin-item")) {
    const id = item.getAttribute("data-id");
    const input = item.querySelector(".edit-sort-order");

    if (!id || !(input instanceof HTMLInputElement)) continue;

    const raw = input.value.trim();
    if (raw === "") {
      throw new Error("表示順をすべて入力してください。");
    }

    const sort_order = Number.parseInt(raw, 10);
    if (!Number.isFinite(sort_order)) {
      throw new Error("表示順は整数で入力してください。");
    }

    updates.push({ id, sort_order });
  }

  return updates;
}

export function initInstagramAdmin() {
  const message = document.getElementById("message");
  const sortOrderMessage = document.getElementById("sortOrderMessage");
  const postList = document.getElementById("postList");

  window.processInstagramEmbeds = processInstagramEmbeds;
  waitForInstagramEmbeds();

  async function reloadInstagramList() {
    if (!postList) return;

    setInstagramLoading(true);

    const { data, error } = await fetchInstagramFromSupabase();

    setInstagramLoading(false);

    if (error) {
      alert(`Instagram一覧の取得に失敗しました: ${error.message}`);
      if (message) message.textContent = `Instagram一覧の取得に失敗しました: ${error.message}`;
      return;
    }

    renderInstagramList((data ?? []) as InstagramAdminRecord[], postList);
  }

  void reloadInstagramList();

  document.getElementById("saveSortOrder")?.addEventListener("click", async () => {
    if (!postList || !sortOrderMessage) return;

    let updates: { id: string; sort_order: number }[];
    try {
      updates = collectSortOrderUpdates(postList);
    } catch (err) {
      const text = err instanceof Error ? err.message : "表示順の入力内容を確認してください。";
      sortOrderMessage.textContent = text;
      return;
    }

    if (updates.length === 0) {
      sortOrderMessage.textContent = "保存する投稿がありません。";
      return;
    }

    const results = await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabase.from("instagram_posts").update({ sort_order }).eq("id", id)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      alert(`表示順の保存に失敗しました: ${failed.error.message}`);
      sortOrderMessage.textContent = `表示順の保存に失敗しました：${failed.error.message}`;
      return;
    }

    sortOrderMessage.textContent = `表示順を保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
    await reloadInstagramList();
  });

  document.getElementById("add")?.addEventListener("click", async () => {
    if (!message) return;

    const embedInput = document.getElementById("embed_code");
    const embed_code =
      embedInput instanceof HTMLTextAreaElement ? embedInput.value.trim() : "";

    if (!embed_code) {
      message.textContent = "埋め込みコードを入力してください。";
      return;
    }

    const { data: existing, error: fetchError } = await supabase
      .from("instagram_posts")
      .select("sort_order");

    if (fetchError) {
      alert(`保存に失敗しました: ${fetchError.message}`);
      message.textContent = "保存に失敗しました：" + fetchError.message;
      return;
    }

    const sort_order = nextSortOrderForNewPost(existing ?? []);

    const { error } = await supabase
      .from("instagram_posts")
      .insert([{ embed_code, sort_order }]);

    if (error) {
      alert(`保存に失敗しました: ${error.message}`);
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    if (embedInput instanceof HTMLTextAreaElement) {
      embedInput.value = "";
    }

    message.textContent = `保存しました（表示順: ${sort_order}）。${PUBLIC_SITE_REBUILD_MESSAGE}`;
    await reloadInstagramList();
  });

  postList?.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button");
    if (!button || !postList.contains(button)) return;

    const item = button.closest(".instagram-admin-item");
    if (!item) return;

    if (button.classList.contains("update")) {
      void (async () => {
        if (!message) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため更新できません。ページを再読み込みしてください。");
          return;
        }

        const embedField = item.querySelector(".edit-embed-code");
        const embed_code =
          embedField instanceof HTMLTextAreaElement ? embedField.value.trim() : "";

        if (!embed_code) {
          message.textContent = "埋め込みコードを入力してください。";
          return;
        }

        const { error } = await supabase.from("instagram_posts").update({ embed_code }).eq("id", id);

        if (error) {
          alert(`更新に失敗しました: ${error.message}`);
          message.textContent = "更新に失敗しました：" + error.message;
          return;
        }

        message.textContent = `更新しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
        await reloadInstagramList();
      })();
      return;
    }

    if (button.classList.contains("delete")) {
      void (async () => {
        if (!message) return;

        if (!confirm("このInstagram埋め込みを削除しますか？")) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          alert("IDが取得できないため削除できません。ページを再読み込みしてください。");
          return;
        }

        const { data, error, count } = await supabase
          .from("instagram_posts")
          .delete({ count: "exact" })
          .eq("id", id)
          .select();

        if (error) {
          alert(`削除に失敗しました: ${error.message}`);
          message.textContent = "削除に失敗しました：" + error.message;
          return;
        }

        if (count === 0) {
          alert("削除対象が見つかりませんでした。一覧を再読み込みします。");
          await reloadInstagramList();
          return;
        }

        item.remove();
        updateInstagramEmptyState(postList);

        message.textContent = `削除しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
      })();
    }
  });
}

initInstagramAdmin();

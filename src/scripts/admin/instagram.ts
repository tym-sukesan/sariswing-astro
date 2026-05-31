import {
  createInstagramAdminListItem,
  type InstagramAdminRecord,
} from "../../lib/admin/create-instagram-list-item";
import {
  collectSortOrderUpdates,
  initInstagramSortReorder,
  type InstagramSortReorderController,
} from "../../lib/admin/instagram-sort-reorder";
import {
  createInstagramPost,
  deleteInstagramPost,
  listInstagramPosts,
  updateInstagramEmbed,
  updateInstagramSortOrders,
} from "../../lib/admin/instagram-api";
import { requireAdminSession, signOutAdmin } from "../../lib/admin/require-admin-session";
import { sortInstagramPosts } from "../../lib/instagram-posts";

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

export function initInstagramAdmin() {
  const message = document.getElementById("message");
  const sortOrderMessage = document.getElementById("sortOrderMessage");
  const sortOrderUnsaved = document.getElementById("sortOrderUnsaved");
  const postList = document.getElementById("postList");

  window.processInstagramEmbeds = processInstagramEmbeds;
  waitForInstagramEmbeds();

  let sortReorderController: InstagramSortReorderController | null = null;

  function bindSortReorder() {
    if (!postList) return;
    sortReorderController = initInstagramSortReorder(postList, sortOrderUnsaved);
  }

  async function reloadInstagramList() {
    if (!postList) return;

    setInstagramLoading(true);

    try {
      const data = await listInstagramPosts();
      setInstagramLoading(false);
      renderInstagramList(sortInstagramPosts(data) as InstagramAdminRecord[], postList);
      bindSortReorder();
    } catch (err) {
      setInstagramLoading(false);
      const text = err instanceof Error ? err.message : "Instagram一覧の取得に失敗しました。";
      alert(`Instagram一覧の取得に失敗しました: ${text}`);
      if (message) message.textContent = `Instagram一覧の取得に失敗しました: ${text}`;
    }
  }

  void (async () => {
    const ok = await requireAdminSession();
    if (!ok) return;

    document.getElementById("adminLogout")?.addEventListener("click", () => {
      void signOutAdmin();
    });

    await reloadInstagramList();
  })();

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

    const saveButton = document.getElementById("saveSortOrder");
    if (saveButton instanceof HTMLButtonElement) {
      saveButton.disabled = true;
      saveButton.textContent = "保存中...";
    }

    try {
      await updateInstagramSortOrders(updates);

      if (saveButton instanceof HTMLButtonElement) {
        saveButton.disabled = false;
        saveButton.textContent = "表示順を保存";
      }

      sortOrderMessage.textContent = `表示順を保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
      sortReorderController?.clearUnsavedNotice();
      await reloadInstagramList();
    } catch (err) {
      if (saveButton instanceof HTMLButtonElement) {
        saveButton.disabled = false;
        saveButton.textContent = "表示順を保存";
      }
      const text = err instanceof Error ? err.message : "表示順の保存に失敗しました。";
      alert(`表示順の保存に失敗しました: ${text}`);
      sortOrderMessage.textContent = `表示順の保存に失敗しました：${text}`;
    }
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

    try {
      const result = await createInstagramPost(embed_code);

      if (embedInput instanceof HTMLTextAreaElement) {
        embedInput.value = "";
      }

      message.textContent = `保存しました（表示順: ${result.sort_order ?? "—"}）。${PUBLIC_SITE_REBUILD_MESSAGE}`;
      await reloadInstagramList();
    } catch (err) {
      const text = err instanceof Error ? err.message : "保存に失敗しました。";
      alert(`保存に失敗しました: ${text}`);
      message.textContent = `保存に失敗しました：${text}`;
    }
  });

  postList?.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest("button");
    if (!button || !postList.contains(button)) return;

    if (
      button.classList.contains("instagram-sort-handle") ||
      button.classList.contains("instagram-sort-move-up") ||
      button.classList.contains("instagram-sort-move-down")
    ) {
      return;
    }

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

        try {
          await updateInstagramEmbed(id, embed_code);
          message.textContent = `更新しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
          await reloadInstagramList();
        } catch (err) {
          const text = err instanceof Error ? err.message : "更新に失敗しました。";
          alert(`更新に失敗しました: ${text}`);
          message.textContent = `更新に失敗しました：${text}`;
        }
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

        try {
          const result = await deleteInstagramPost(id);

          if (result.count === 0) {
            alert("削除対象が見つかりませんでした。一覧を再読み込みします。");
            await reloadInstagramList();
            return;
          }

          item.remove();
          updateInstagramEmptyState(postList);

          message.textContent = `削除しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
        } catch (err) {
          const text = err instanceof Error ? err.message : "削除に失敗しました。";
          alert(`削除に失敗しました: ${text}`);
          message.textContent = `削除に失敗しました：${text}`;
        }
      })();
    }
  });
}

initInstagramAdmin();

import { supabase } from "../../lib/supabase";

declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } };
    processInstagramEmbeds?: () => void;
  }
}

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

function refreshItemPreview(li: Element) {
  const embedField = li.querySelector(".edit-embed-code");
  const embedCode =
    embedField instanceof HTMLTextAreaElement ? embedField.value.trim() : "";
  const previewWrap = li.querySelector(".instagram-admin-item__preview");
  if (!previewWrap) return;

  let preview = previewWrap.querySelector(".instagram-admin-preview");

  if (!embedCode) {
    preview?.remove();
    return;
  }

  if (!preview) {
    preview = document.createElement("div");
    preview.className = "instagram-admin-preview";
    previewWrap.appendChild(preview);
  }

  preview.innerHTML = embedCode;
  processInstagramEmbeds();
  setTimeout(processInstagramEmbeds, 300);
  setTimeout(processInstagramEmbeds, 1000);
}

export function initInstagramAdmin() {
  const message = document.getElementById("message");
  const postList = document.getElementById("postList");

  window.processInstagramEmbeds = processInstagramEmbeds;
  waitForInstagramEmbeds();

  document.getElementById("add")?.addEventListener("click", async () => {
    if (!message) return;

    const embedInput = document.getElementById("embed_code");
    const embed_code =
      embedInput instanceof HTMLTextAreaElement ? embedInput.value.trim() : "";

    if (!embed_code) {
      message.textContent = "埋め込みコードを入力してください。";
      return;
    }

    const { error } = await supabase.from("instagram_posts").insert([{ embed_code }]);

    if (error) {
      message.textContent = "保存に失敗しました：" + error.message;
      return;
    }

    message.textContent = "保存しました。";
    location.reload();
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
          message.textContent = "IDが取得できないため更新できません。ページを再読み込みしてください。";
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
          message.textContent = "更新に失敗しました：" + error.message;
          return;
        }

        refreshItemPreview(item);
        message.textContent = "更新しました。";
        location.reload();
      })();
      return;
    }

    if (button.classList.contains("delete")) {
      void (async () => {
        if (!message) return;

        if (!confirm("このInstagram埋め込みを削除しますか？")) return;

        const id = item.getAttribute("data-id");
        if (!id) {
          message.textContent = "IDが取得できないため削除できません。ページを再読み込みしてください。";
          return;
        }

        const { error } = await supabase.from("instagram_posts").delete().eq("id", id);

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

initInstagramAdmin();

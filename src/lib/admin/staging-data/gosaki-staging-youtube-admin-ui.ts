/**
 * Gosaki staging shell — YouTube admin UI (embed-code only; no save).
 */

import {
  buildYoutubeNocookieEmbedUrl,
  GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE,
  parseYoutubeVideoId,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";

function readEmbedCode(): string {
  const el = document.getElementById(
    "gosaki-yt-add-embed-code",
  ) as HTMLTextAreaElement | null;
  return (el?.value ?? "").trim();
}

function renderAddPreview(): void {
  const preview = document.getElementById("gosaki-yt-add-preview");
  if (!preview) return;

  const embedCode = readEmbedCode();
  const videoId = parseYoutubeVideoId(embedCode);
  if (!videoId) {
    preview.innerHTML =
      '<p class="admin-gosaki-operator-empty">埋め込みコードを入力するとプレビューが表示されます。</p>';
    return;
  }

  const embedUrl = buildYoutubeNocookieEmbedUrl(videoId);
  const title = GOSAKI_YOUTUBE_DEFAULT_IFRAME_TITLE;
  preview.innerHTML = `<div class="gosaki-youtube-admin-preview__media">
    <iframe src="${embedUrl}" title="${title}" loading="lazy" allowfullscreen></iframe>
  </div>`;
}

function wireDisabledActions(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-gosaki-yt-action-disabled]").forEach((button) => {
    button.disabled = true;
    button.title = "保存は次フェーズで開放予定です";
  });
}

function wireLocalReorder(): void {
  const list = document.getElementById("gosaki-yt-item-list");
  list?.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      "[data-gosaki-yt-move]",
    );
    if (!button) return;

    const item = button.closest<HTMLElement>(".gosaki-youtube-admin-item");
    if (!item) return;

    const direction = button.dataset.gosakiYtMove;
    if (direction === "up" && item.previousElementSibling) {
      list.insertBefore(item, item.previousElementSibling);
    } else if (direction === "down" && item.nextElementSibling) {
      list.insertBefore(item.nextElementSibling, item);
    }
  });
}

export function initGosakiStagingYoutubeAdminUi(): void {
  if (!document.getElementById("gosaki-youtube-operator")) return;

  wireDisabledActions();
  wireLocalReorder();
  document.getElementById("gosaki-yt-add-embed-code")?.addEventListener("input", renderAddPreview);
  renderAddPreview();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingYoutubeAdminUi();
  });
}

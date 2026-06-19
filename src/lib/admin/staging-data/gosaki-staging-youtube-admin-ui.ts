/**
 * Gosaki staging shell — YouTube admin UI (Instagram-inspired; static JSON; no save).
 */

import {
  buildYoutubeNocookieEmbedUrl,
  buildYoutubeWatchUrl,
  parseYoutubeVideoId,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";

function readField(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
  return (el?.value ?? "").trim();
}

function readCheckbox(id: string): boolean {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el?.checked === true;
}

function resolvePreviewFromForm(): { embedUrl: string; watchUrl: string; title: string } | null {
  const embedCode = readField("gosaki-yt-add-embed-code");
  const sourceUrl = readField("gosaki-yt-add-source-url");
  const videoId =
    parseYoutubeVideoId(readField("gosaki-yt-add-video-id")) ??
    parseYoutubeVideoId(sourceUrl) ??
    parseYoutubeVideoId(embedCode);
  if (!videoId) return null;

  const title = readField("gosaki-yt-add-title") || "YouTube video";
  return {
    embedUrl: buildYoutubeNocookieEmbedUrl(videoId),
    watchUrl: buildYoutubeWatchUrl(videoId),
    title,
  };
}

function renderAddPreview(): void {
  const preview = document.getElementById("gosaki-yt-add-preview");
  if (!preview) return;

  const resolved = resolvePreviewFromForm();
  if (!resolved) {
    preview.innerHTML =
      '<p class="admin-gosaki-operator-empty">埋め込みコードまたは YouTube URL を入力するとプレビューが表示されます。</p>';
    return;
  }

  preview.innerHTML = `<div class="gosaki-youtube-admin-preview__media">
    <iframe src="${resolved.embedUrl}" title="${resolved.title}" loading="lazy" allowfullscreen></iframe>
  </div>
  <p class="gosaki-youtube-admin-preview__watch"><a href="${resolved.watchUrl}" target="_blank" rel="noopener noreferrer">YouTubeで見る</a></p>`;
}

function wireDisabledActions(): void {
  const disabledButtons = document.querySelectorAll<HTMLButtonElement>(
    "[data-gosaki-yt-action-disabled]",
  );
  disabledButtons.forEach((button) => {
    button.disabled = true;
    button.title = "保存は次フェーズで開放予定です";
  });
}

function wireLocalReorder(): void {
  const list = document.getElementById("gosaki-yt-item-list");
  if (!list) return;

  list.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-gosaki-yt-move]");
    if (!button || button.disabled) return;

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
  const root = document.getElementById("gosaki-youtube-operator");
  if (!root) return;

  wireDisabledActions();
  wireLocalReorder();

  const fields = [
    "gosaki-yt-add-embed-code",
    "gosaki-yt-add-source-url",
    "gosaki-yt-add-video-id",
    "gosaki-yt-add-title",
  ];
  fields.forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderAddPreview);
  });

  renderAddPreview();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGosakiStagingYoutubeAdminUi();
  });
}

import aboutMainFallback from "../../data/about-main.html?raw";
import {
  getSitePageBySlug,
  getSitePageRevisionById,
  listSitePageRevisions,
  restoreSitePageRevision,
  saveSitePage,
} from "../../lib/admin/site-page-api";
import { requireAdminSession, signOutAdmin } from "../../lib/admin/require-admin-session";
import type { SitePageRevisionRecord } from "../../lib/site-page-revisions";

const ABOUT_SLUG = "about";
const ABOUT_TITLE = "ABOUT SARI";
const FALLBACK_HTML = aboutMainFallback;

const PUBLIC_SITE_REBUILD_MESSAGE =
  "公開サイト（/about/）へ反映するには、管理画面トップの「公開サイトを更新」から再ビルド・再デプロイしてください。";

function getTextarea() {
  const el = document.getElementById("aboutHtmlContent");
  return el instanceof HTMLTextAreaElement ? el : null;
}

function getPreviewEl() {
  return document.getElementById("aboutPreview");
}

function getMessageEl() {
  return document.getElementById("message");
}

function getUpdatedAtEl() {
  return document.getElementById("updatedAt");
}

function getStatsEl() {
  return document.getElementById("aboutHtmlStats");
}

function getRevisionListEl() {
  return document.getElementById("aboutRevisionList");
}

function getRevisionMessageEl() {
  return document.getElementById("aboutRevisionMessage");
}

function getRevisionDialog() {
  const el = document.getElementById("aboutRevisionDialog");
  return el instanceof HTMLDialogElement ? el : null;
}

function getRevisionDialogTitle() {
  return document.getElementById("aboutRevisionDialogTitle");
}

function getRevisionDialogMeta() {
  return document.getElementById("aboutRevisionDialogMeta");
}

function getRevisionDialogContent() {
  const el = document.getElementById("aboutRevisionDialogContent");
  return el instanceof HTMLTextAreaElement ? el : null;
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `最終更新: ${date.toLocaleString("ja-JP")}`;
}

function formatRevisionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countLines(value: string) {
  if (!value) return 0;
  return value.split("\n").length;
}

function updateHtmlStats(value: string) {
  const stats = getStatsEl();
  if (!stats) return;

  const charCount = value.length;
  const lineCount = countLines(value);

  stats.textContent = `HTML文字数: ${charCount.toLocaleString("ja-JP")}\n行数: ${lineCount.toLocaleString("ja-JP")}`;
}

function setEditorContent(html: string) {
  const textarea = getTextarea();
  if (!textarea) return;

  textarea.value = html;
  updateHtmlStats(html);
  updatePreview(html);
}

function updatePreview(html: string) {
  const preview = getPreviewEl();
  if (!preview) return;
  preview.innerHTML = html;
}

function setLoading(isLoading: boolean) {
  const saveBtn = document.getElementById("saveAbout");
  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.disabled = isLoading;
    saveBtn.textContent = isLoading ? "保存中…" : "保存";
  }
}

function setRevisionActionsDisabled(disabled: boolean) {
  const list = getRevisionListEl();
  if (!list) return;

  list.querySelectorAll("button").forEach((button) => {
    if (button instanceof HTMLButtonElement) {
      button.disabled = disabled;
    }
  });
}

function renderRevisionList(revisions: SitePageRevisionRecord[]) {
  const list = getRevisionListEl();
  const message = getRevisionMessageEl();
  if (!list) return;

  list.replaceChildren();

  if (revisions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "about-revision-empty";
    empty.textContent = "バックアップはまだありません。保存すると履歴が作成されます。";
    list.append(empty);
    if (message) message.textContent = "";
    return;
  }

  revisions.forEach((revision, index) => {
    const versionNumber = revisions.length - index;
    const item = document.createElement("article");
    item.className = "about-revision-item";
    item.dataset.revisionId = String(revision.id);

    const heading = document.createElement("h3");
    heading.className = "about-revision-item__title";
    heading.textContent = `Version ${versionNumber}`;

    const date = document.createElement("p");
    date.className = "about-revision-item__date";
    date.textContent = formatRevisionDate(revision.created_at);

    const actions = document.createElement("div");
    actions.className = "about-revision-item__actions";

    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "admin-button admin-button-secondary admin-button--small";
    viewBtn.textContent = "内容を見る";
    viewBtn.addEventListener("click", () => {
      openRevisionDialog(revision, versionNumber);
    });

    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "admin-button admin-button--small";
    restoreBtn.textContent = "この版を復元";
    restoreBtn.addEventListener("click", () => {
      void restoreRevision(revision.id, versionNumber);
    });

    actions.append(viewBtn, restoreBtn);
    item.append(heading, date, actions);
    list.append(item);
  });

  if (message) {
    message.textContent = `最新 ${revisions.length} 件（DBは最大50世代まで保持・一覧はスクロールで参照）`;
  }
}

async function loadRevisionHistory() {
  const list = getRevisionListEl();
  const message = getRevisionMessageEl();
  if (!list) return;

  list.replaceChildren();
  const loading = document.createElement("p");
  loading.className = "about-revision-empty";
  loading.textContent = "バックアップ履歴を読み込み中…";
  list.append(loading);

  try {
    const data = await listSitePageRevisions(ABOUT_SLUG);
    renderRevisionList(data);
  } catch (err) {
    list.replaceChildren();
    const errEl = document.createElement("p");
    errEl.className = "about-revision-empty about-revision-empty--error";
    const text = err instanceof Error ? err.message : "履歴の読み込みに失敗しました。";
    errEl.textContent = `履歴の読み込みに失敗しました: ${text}`;
    list.append(errEl);
    if (message) message.textContent = "";
  }
}

function openRevisionDialog(revision: SitePageRevisionRecord, versionNumber: number) {
  const dialog = getRevisionDialog();
  const title = getRevisionDialogTitle();
  const meta = getRevisionDialogMeta();
  const content = getRevisionDialogContent();

  if (!dialog || !content) return;

  if (title) title.textContent = `Version ${versionNumber}`;
  if (meta) meta.textContent = formatRevisionDate(revision.created_at);
  content.value = revision.html_content;
  dialog.showModal();
}

async function restoreRevision(revisionId: number, versionNumber: number) {
  const message = getMessageEl();
  const updatedAt = getUpdatedAtEl();

  const confirmed = window.confirm(
    `Version ${versionNumber} の内容で About ページを復元します。\n復元前の内容はバックアップに保存されます。よろしいですか？`
  );
  if (!confirmed) return;

  setLoading(true);
  setRevisionActionsDisabled(true);
  if (message) message.textContent = "復元中…";

  try {
    const revision = await getSitePageRevisionById(revisionId);

    if (!revision) {
      throw new Error("バックアップが見つかりません。");
    }

    if (revision.page_slug !== ABOUT_SLUG) {
      throw new Error("対象のバックアップが About 用ではありません。");
    }

    const record = await restoreSitePageRevision(revisionId, ABOUT_TITLE);

    setEditorContent(revision.html_content);
    if (updatedAt) updatedAt.textContent = formatUpdatedAt(record.updated_at);
    if (message) {
      message.textContent = `Version ${versionNumber} を復元しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
    }

    await loadRevisionHistory();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "不明なエラー";
    alert(`復元に失敗しました: ${errMsg}`);
    if (message) message.textContent = `復元に失敗しました: ${errMsg}`;
  } finally {
    setLoading(false);
    setRevisionActionsDisabled(false);
  }
}

async function loadAboutPage() {
  const textarea = getTextarea();
  const message = getMessageEl();
  const updatedAt = getUpdatedAtEl();

  if (!textarea) return;

  if (message) message.textContent = "読み込み中…";

  try {
    const record = await getSitePageBySlug(ABOUT_SLUG);

    if (!record?.html_content?.trim()) {
      setEditorContent(FALLBACK_HTML);
      if (updatedAt) updatedAt.textContent = "";
      if (message) {
        message.textContent =
          "Supabase に About データがありません。初期 HTML を表示しています。保存すると登録されます。";
      }
      return;
    }

    setEditorContent(record.html_content);
    if (updatedAt) updatedAt.textContent = formatUpdatedAt(record.updated_at);
    if (message) message.textContent = "";
  } catch (err) {
    setEditorContent(textarea.value || FALLBACK_HTML);
    const text = err instanceof Error ? err.message : "読み込みに失敗しました。";
    if (message) {
      message.textContent = `読み込みに失敗しました（ローカル初期HTMLを表示中）: ${text}`;
    }
  }
}

async function saveAboutPage() {
  const textarea = getTextarea();
  const message = getMessageEl();
  const updatedAt = getUpdatedAtEl();

  if (!textarea || !message) return;

  const html_content = textarea.value;

  if (!html_content.trim()) {
    message.textContent = "HTML が空です。保存できません。";
    return;
  }

  setLoading(true);
  setRevisionActionsDisabled(true);
  message.textContent = "保存中…";

  try {
    const record = await saveSitePage(ABOUT_SLUG, ABOUT_TITLE, html_content);

    if (updatedAt) updatedAt.textContent = formatUpdatedAt(record.updated_at);
    updatePreview(html_content);
    updateHtmlStats(html_content);
    message.textContent = `保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;

    await loadRevisionHistory();
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "不明なエラー";
    alert(`保存に失敗しました: ${errMsg}`);
    message.textContent = `保存に失敗しました: ${errMsg}`;
  } finally {
    setLoading(false);
    setRevisionActionsDisabled(false);
  }
}

function closeRevisionDialog() {
  const dialog = getRevisionDialog();
  if (dialog?.open) {
    dialog.close();
  }
}

function initRevisionDialog() {
  const dialog = getRevisionDialog();
  if (!dialog) return;

  const inner = dialog.querySelector(".about-revision-dialog__inner");

  dialog.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-close-revision-dialog]")) {
      event.preventDefault();
      closeRevisionDialog();
      return;
    }

    if (!inner) return;

    const { clientX, clientY } = event;
    const rect = inner.getBoundingClientRect();
    const clickedOutside =
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom;

    if (clickedOutside) {
      closeRevisionDialog();
    }
  });

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeRevisionDialog();
  });
}

export function initAboutAdmin() {
  const textarea = getTextarea();

  if (textarea) {
    if (!textarea.value.trim()) {
      setEditorContent(FALLBACK_HTML);
    } else {
      updateHtmlStats(textarea.value);
      updatePreview(textarea.value);
    }
  }

  initRevisionDialog();

  void (async () => {
    const ok = await requireAdminSession();
    if (!ok) return;

    document.getElementById("adminLogout")?.addEventListener("click", () => {
      void signOutAdmin();
    });

    await loadAboutPage();
    await loadRevisionHistory();
  })();

  textarea?.addEventListener("input", () => {
    updateHtmlStats(textarea.value);
    updatePreview(textarea.value);
  });

  document.getElementById("refreshPreview")?.addEventListener("click", () => {
    if (textarea) updatePreview(textarea.value);
  });

  document.getElementById("saveAbout")?.addEventListener("click", () => {
    void saveAboutPage();
  });
}

initAboutAdmin();

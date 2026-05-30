import aboutMainFallback from "../../data/about-main.html?raw";
import { SITE_PAGE_SELECT, type SitePageRecord } from "../../lib/site-pages";
import { supabase } from "../../lib/supabase";

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

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `最終更新: ${date.toLocaleString("ja-JP")}`;
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

async function loadAboutPage() {
  const textarea = getTextarea();
  const message = getMessageEl();
  const updatedAt = getUpdatedAtEl();

  if (!textarea) return;

  if (message) message.textContent = "Supabase から読み込み中…";

  const { data, error } = await supabase
    .from("site_pages")
    .select(SITE_PAGE_SELECT)
    .eq("slug", ABOUT_SLUG)
    .maybeSingle();

  if (error) {
    setEditorContent(textarea.value || FALLBACK_HTML);
    if (message) {
      message.textContent = `Supabase の読み込みに失敗しました（ローカル初期HTMLを表示中）: ${error.message}`;
    }
    return;
  }

  const record = data as SitePageRecord | null;

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
  message.textContent = "";

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("site_pages")
    .upsert(
      {
        slug: ABOUT_SLUG,
        title: ABOUT_TITLE,
        html_content,
        updated_at: now,
      },
      { onConflict: "slug" }
    )
    .select(SITE_PAGE_SELECT)
    .single();

  setLoading(false);

  if (error) {
    alert(`保存に失敗しました: ${error.message}`);
    message.textContent = `保存に失敗しました: ${error.message}`;
    return;
  }

  const record = data as SitePageRecord;
  if (updatedAt) updatedAt.textContent = formatUpdatedAt(record.updated_at);
  updatePreview(html_content);
  updateHtmlStats(html_content);
  message.textContent = `保存しました。${PUBLIC_SITE_REBUILD_MESSAGE}`;
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

  void loadAboutPage();

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

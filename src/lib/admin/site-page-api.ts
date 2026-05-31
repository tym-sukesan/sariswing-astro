import { invokeAdminEdgeFunction } from "./invoke-admin-edge";
import type { SitePageRecord } from "../site-pages";
import type { SitePageRevisionRecord } from "../site-page-revisions";

type DataResponse<T> = {
  ok?: boolean;
  data?: T;
  error?: string;
};

export async function getSitePageBySlug(slug: string): Promise<SitePageRecord | null> {
  const result = await invokeAdminEdgeFunction<DataResponse<SitePageRecord | null>>({
    action: "get_page",
    slug,
  });
  return result.data ?? null;
}

export async function saveSitePage(slug: string, title: string, html_content: string) {
  const result = await invokeAdminEdgeFunction<DataResponse<SitePageRecord>>({
    action: "save_page",
    slug,
    title,
    html_content,
  });
  if (!result.data) {
    throw new Error("保存結果が取得できませんでした。");
  }
  return result.data;
}

export async function listSitePageRevisions(pageSlug: string) {
  const result = await invokeAdminEdgeFunction<DataResponse<SitePageRevisionRecord[]>>({
    action: "list_revisions",
    page_slug: pageSlug,
  });
  return result.data ?? [];
}

export async function getSitePageRevisionById(id: number) {
  const result = await invokeAdminEdgeFunction<DataResponse<SitePageRevisionRecord>>({
    action: "get_revision",
    id,
  });
  return result.data ?? null;
}

export async function restoreSitePageRevision(id: number, title: string) {
  const result = await invokeAdminEdgeFunction<DataResponse<SitePageRecord>>({
    action: "restore_revision",
    id,
    title,
  });
  if (!result.data) {
    throw new Error("復元結果が取得できませんでした。");
  }
  return result.data;
}

/**
 * Gosaki staging admin — YouTube embed config (static JSON; no DB).
 */

import fs from "node:fs";
import path from "node:path";
import {
  normalizeGosakiYoutubeConfig,
  parseYoutubeVideoId,
  resolveGosakiYoutubeItem,
  type GosakiYoutubeEmbedConfig,
  type GosakiYoutubeEmbedItem,
  type ResolvedGosakiYoutubeEmbed,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";

export type { GosakiYoutubeEmbedConfig, GosakiYoutubeEmbedItem, ResolvedGosakiYoutubeEmbed };

export interface GosakiYoutubeEmbedAdminItemView {
  item: GosakiYoutubeEmbedItem;
  resolved: ResolvedGosakiYoutubeEmbed | null;
  videoId: string | null;
}

export interface GosakiYoutubeEmbedAdminBinding {
  configPath: string;
  config: GosakiYoutubeEmbedConfig;
  sectionTitle: string;
  items: GosakiYoutubeEmbedAdminItemView[];
  publishedCount: number;
  configFound: boolean;
  message: string | null;
}

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";

function sortItems(items: GosakiYoutubeEmbedItem[]): GosakiYoutubeEmbedItem[] {
  return [...items].sort(
    (a, b) =>
      (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) ||
      String(a.id ?? "").localeCompare(String(b.id ?? ""), "ja"),
  );
}

export function loadGosakiYoutubeEmbedAdminBinding(): GosakiYoutubeEmbedAdminBinding {
  const configPath = path.join(process.cwd(), CONFIG_REL);

  if (!fs.existsSync(configPath)) {
    return {
      configPath: CONFIG_REL,
      config: { siteSlug: "gosaki-piano", items: [] },
      sectionTitle: "YouTube",
      items: [],
      publishedCount: 0,
      configFound: false,
      message: "設定ファイルが見つかりません。",
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as GosakiYoutubeEmbedConfig;
    const { sectionTitle, items } = normalizeGosakiYoutubeConfig(config);
    const views = sortItems(items).map((item) => {
      const videoId =
        parseYoutubeVideoId(item.videoId) ??
        parseYoutubeVideoId(item.sourceUrl) ??
        parseYoutubeVideoId(item.embedCode);
      return {
        item,
        resolved: resolveGosakiYoutubeItem(item),
        videoId,
      };
    });

    return {
      configPath: CONFIG_REL,
      config,
      sectionTitle,
      items: views,
      publishedCount: views.filter((view) => view.item.published === true).length,
      configFound: true,
      message: null,
    };
  } catch {
    return {
      configPath: CONFIG_REL,
      config: { siteSlug: "gosaki-piano", items: [] },
      sectionTitle: "YouTube",
      items: [],
      publishedCount: 0,
      configFound: true,
      message: "設定ファイルの読み込みに失敗しました。",
    };
  }
}

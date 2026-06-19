/**
 * Gosaki staging admin — read-only YouTube embed config (static JSON; no DB).
 */

import fs from "node:fs";
import path from "node:path";
import {
  parseYoutubeVideoId,
  resolveGosakiYoutubeEmbedFromConfig,
  type GosakiYoutubeEmbedConfig,
  type ResolvedGosakiYoutubeEmbed,
} from "../../../../tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed";

export type { GosakiYoutubeEmbedConfig, ResolvedGosakiYoutubeEmbed };

export interface GosakiYoutubeEmbedAdminBinding {
  configPath: string;
  config: GosakiYoutubeEmbedConfig;
  resolved: ResolvedGosakiYoutubeEmbed | null;
  configFound: boolean;
  published: boolean;
  videoId: string | null;
  message: string | null;
}

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";

export function loadGosakiYoutubeEmbedAdminBinding(): GosakiYoutubeEmbedAdminBinding {
  const configPath = path.join(process.cwd(), CONFIG_REL);

  if (!fs.existsSync(configPath)) {
    return {
      configPath: CONFIG_REL,
      config: { siteSlug: "gosaki-piano" },
      resolved: null,
      configFound: false,
      published: false,
      videoId: null,
      message: "設定ファイルが見つかりません。",
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as GosakiYoutubeEmbedConfig;
    const videoId =
      parseYoutubeVideoId(config.videoId) ?? parseYoutubeVideoId(config.sourceUrl);
    const resolved = resolveGosakiYoutubeEmbedFromConfig(config);

    return {
      configPath: CONFIG_REL,
      config,
      resolved,
      configFound: true,
      published: config.published === true,
      videoId,
      message: null,
    };
  } catch {
    return {
      configPath: CONFIG_REL,
      config: { siteSlug: "gosaki-piano" },
      resolved: null,
      configFound: true,
      published: false,
      videoId: null,
      message: "設定ファイルの読み込みに失敗しました。",
    };
  }
}

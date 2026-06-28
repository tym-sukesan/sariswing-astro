/**
 * Gosaki staging admin — discography static JSON loader (legacy G-9j).
 * @deprecated G-15a — use resolveGosakiDiscographySupabaseReadBinding() instead.
 */

import fs from "node:fs";
import path from "node:path";

export interface GosakiDiscographyRelease {
  id: string;
  published?: boolean;
  order?: number;
  title: string;
  artist: string;
  coverImage?: string;
  trackList?: string[];
  personnel?: string[];
  releaseText?: string;
  catalogNumber?: string;
  price?: string;
  purchaseText?: string;
  purchaseUrl?: string;
  label?: string;
  notes?: string;
  missingFields?: string[];
}

export interface GosakiDiscographyConfig {
  siteSlug?: string;
  pageTitle?: string;
  previewPath?: string;
  releases: GosakiDiscographyRelease[];
}

export interface GosakiDiscographyAdminBinding {
  configPath: string;
  config: GosakiDiscographyConfig;
  configFound: boolean;
  releaseCount: number;
  publishedCount: number;
  message: string | null;
}

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography.json";

function sortReleases(releases: GosakiDiscographyRelease[]): GosakiDiscographyRelease[] {
  return [...releases].sort(
    (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || a.title.localeCompare(b.title, "ja"),
  );
}

export function loadGosakiDiscographyAdminBinding(): GosakiDiscographyAdminBinding {
  const configPath = path.join(process.cwd(), CONFIG_REL);

  if (!fs.existsSync(configPath)) {
    return {
      configPath: CONFIG_REL,
      config: { releases: [] },
      configFound: false,
      releaseCount: 0,
      publishedCount: 0,
      message: "作品情報の設定ファイルが見つかりません。",
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as GosakiDiscographyConfig;
    const releases = sortReleases(Array.isArray(config.releases) ? config.releases : []);

    return {
      configPath: CONFIG_REL,
      config: { ...config, releases },
      configFound: true,
      releaseCount: releases.length,
      publishedCount: releases.filter((r) => r.published !== false).length,
      message: null,
    };
  } catch {
    return {
      configPath: CONFIG_REL,
      config: { releases: [] },
      configFound: true,
      releaseCount: 0,
      publishedCount: 0,
      message: "作品情報の読み込みに失敗しました。",
    };
  }
}

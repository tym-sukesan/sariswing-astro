/**
 * Gosaki staging admin — read-only discography summary (static JSON; no DB).
 */

import fs from "node:fs";
import path from "node:path";

export interface GosakiDiscographyReleaseSummary {
  id: string;
  title: string;
  artist: string;
  releaseDate?: string;
  catalogNumber?: string;
  price?: string;
  label?: string;
  note?: string;
}

export interface GosakiDiscographySummaryConfig {
  siteSlug?: string;
  pageTitle?: string;
  previewPath?: string;
  releases: GosakiDiscographyReleaseSummary[];
}

export interface GosakiDiscographyAdminBinding {
  configPath: string;
  config: GosakiDiscographySummaryConfig;
  configFound: boolean;
  releaseCount: number;
  message: string | null;
}

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography-summary.json";

export function loadGosakiDiscographyAdminBinding(): GosakiDiscographyAdminBinding {
  const configPath = path.join(process.cwd(), CONFIG_REL);

  if (!fs.existsSync(configPath)) {
    return {
      configPath: CONFIG_REL,
      config: { releases: [] },
      configFound: false,
      releaseCount: 0,
      message: "作品情報の設定ファイルが見つかりません。",
    };
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as GosakiDiscographySummaryConfig;
    const releases = Array.isArray(config.releases) ? config.releases : [];

    return {
      configPath: CONFIG_REL,
      config: { ...config, releases },
      configFound: true,
      releaseCount: releases.length,
      message: null,
    };
  } catch {
    return {
      configPath: CONFIG_REL,
      config: { releases: [] },
      configFound: true,
      releaseCount: 0,
      message: "作品情報の読み込みに失敗しました。",
    };
  }
}

/**
 * Gosaki staging admin — About HTML content static JSON (read-only; G-10h3).
 */

import fs from "node:fs";
import path from "node:path";

export const GOSAKI_ABOUT_CONTENT_BLOCK_PROFILE_ID = "about-profile-html";
export const GOSAKI_ABOUT_CONTENT_BLOCK_BANDS_ID = "about-bands-html";

export interface GosakiAboutContentBlock {
  id: string;
  label: string;
  enabled: boolean;
  html: string;
}

export interface GosakiAboutContentConfig {
  siteSlug?: string;
  page?: string;
  version?: number;
  previewPath?: string;
  blocks: GosakiAboutContentBlock[];
}

export interface GosakiAboutContentBlockView {
  block: GosakiAboutContentBlock;
  htmlLength: number;
  lineCount: number;
}

export interface GosakiAboutContentAdminBinding {
  configPath: string;
  config: GosakiAboutContentConfig;
  configFound: boolean;
  blockCount: number;
  enabledBlockCount: number;
  blocks: GosakiAboutContentBlockView[];
  message: string | null;
}

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";

const BLOCK_ORDER = [GOSAKI_ABOUT_CONTENT_BLOCK_PROFILE_ID, GOSAKI_ABOUT_CONTENT_BLOCK_BANDS_ID];

function sortBlocks(blocks: GosakiAboutContentBlock[]): GosakiAboutContentBlock[] {
  return [...blocks].sort((a, b) => {
    const ai = BLOCK_ORDER.indexOf(a.id);
    const bi = BLOCK_ORDER.indexOf(b.id);
    if (ai === -1 && bi === -1) return a.id.localeCompare(b.id);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function toBlockView(block: GosakiAboutContentBlock): GosakiAboutContentBlockView {
  const html = String(block.html ?? "");
  return {
    block,
    htmlLength: html.length,
    lineCount: html.length === 0 ? 0 : html.split(/\r?\n/).length,
  };
}

export function loadGosakiAboutContentAdminBinding(): GosakiAboutContentAdminBinding {
  const configPath = path.join(process.cwd(), CONFIG_REL);

  if (!fs.existsSync(configPath)) {
    return {
      configPath: CONFIG_REL,
      config: { blocks: [] },
      configFound: false,
      blockCount: 0,
      enabledBlockCount: 0,
      blocks: [],
      message: "About HTML の設定ファイルが見つかりません。",
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as GosakiAboutContentConfig;
    const rawBlocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
    const blocks = sortBlocks(
      rawBlocks.map((block) => ({
        id: String(block.id ?? ""),
        label: String(block.label ?? block.id ?? ""),
        enabled: block.enabled !== false,
        html: String(block.html ?? ""),
      })),
    );

    return {
      configPath: CONFIG_REL,
      config: { ...parsed, blocks: blocks.map((view) => view) },
      configFound: true,
      blockCount: blocks.length,
      enabledBlockCount: blocks.filter((block) => block.enabled).length,
      blocks: blocks.map(toBlockView),
      message: null,
    };
  } catch {
    return {
      configPath: CONFIG_REL,
      config: { blocks: [] },
      configFound: true,
      blockCount: 0,
      enabledBlockCount: 0,
      blocks: [],
      message: "About HTML の読み込みに失敗しました。",
    };
  }
}

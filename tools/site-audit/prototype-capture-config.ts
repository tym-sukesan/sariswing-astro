import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOSAKI_V4_PROTOTYPE_PAGES, type PrototypePageEntry } from "./prototype-page-map.ts";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_DIR, "../..");

export const DEFAULT_PROTOTYPE_NAME = "gosaki-v4";
export const DEFAULT_PROTOTYPE_DIR = path.join(
  TOOL_DIR,
  "prototype-static-gosaki-v4",
);

export const PROTOTYPE_SERVER_HOST = "127.0.0.1";
export const PROTOTYPE_SERVER_PORT = 8090;

export const OUTPUT_DIR = path.join(TOOL_DIR, "output");
export const PROTOTYPE_SCREENSHOTS_DIR = path.join(
  OUTPUT_DIR,
  "prototype-screenshots",
);
export const PROTOTYPE_CAPTURE_REPORT_PATH = path.join(
  OUTPUT_DIR,
  "prototype-capture-report.md",
);

export type PrototypeCaptureConfig = {
  prototypeName: string;
  prototypeDir: string;
  pages: PrototypePageEntry[];
  host: string;
  port: number;
  outputDir: string;
  screenshotsDir: string;
  reportPath: string;
  desktopDir: string;
  mobileDir: string;
};

function resolvePrototypeDir(input: string): string {
  if (path.isAbsolute(input)) {
    return input;
  }
  return path.resolve(REPO_ROOT, input);
}

export function loadPrototypeCaptureConfig(): PrototypeCaptureConfig {
  const prototypeName =
    process.env.PROTOTYPE_NAME?.trim() || DEFAULT_PROTOTYPE_NAME;
  const prototypeDir = resolvePrototypeDir(
    process.env.PROTOTYPE_DIR?.trim() || DEFAULT_PROTOTYPE_DIR,
  );

  const screenshotsDir = PROTOTYPE_SCREENSHOTS_DIR;
  const desktopDir = path.join(screenshotsDir, "desktop");
  const mobileDir = path.join(screenshotsDir, "mobile");

  return {
    prototypeName,
    prototypeDir,
    pages: GOSAKI_V4_PROTOTYPE_PAGES,
    host: PROTOTYPE_SERVER_HOST,
    port: Number.parseInt(process.env.PROTOTYPE_PORT ?? "", 10) || PROTOTYPE_SERVER_PORT,
    outputDir: OUTPUT_DIR,
    screenshotsDir,
    reportPath: PROTOTYPE_CAPTURE_REPORT_PATH,
    desktopDir,
    mobileDir,
  };
}

export function screenshotFileName(
  prototypeName: string,
  slug: string,
): string {
  return `${prototypeName}-${slug}.png`;
}

export function screenshotRelativePath(
  viewport: "desktop" | "mobile",
  prototypeName: string,
  slug: string,
): string {
  return path.posix.join(
    "prototype-screenshots",
    viewport,
    screenshotFileName(prototypeName, slug),
  );
}

export function pageUrl(host: string, port: number, fileName: string): string {
  return `http://${host}:${port}/${fileName}`;
}

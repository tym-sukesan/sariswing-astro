import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BROWSER_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "browser");

/**
 * Read a browser-side script from disk. Always reads fresh (no cache) so dev edits apply immediately.
 */
export async function readBrowserScript(
  fileName: string,
  _options?: { fresh?: boolean },
): Promise<string> {
  return fs.readFile(path.join(BROWSER_DIR, fileName), "utf8");
}

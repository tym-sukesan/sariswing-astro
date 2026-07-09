/**
 * G-20u12 — Safe cleanup for generated artifacts under tools/static-to-astro/output/.
 * Path-guarded only — never removes outside output/.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");
export const GENERATED_OUTPUT_REL = "output";

/**
 * @param {string} targetPath
 * @param {string} [toolRoot]
 */
export function assertUnderGeneratedOutput(targetPath, toolRoot = TOOL_ROOT) {
  const resolved = path.resolve(targetPath);
  const outputRoot = path.resolve(toolRoot, GENERATED_OUTPUT_REL);
  if (resolved === outputRoot) {
    throw new Error("Refusing to remove generated output root itself");
  }
  if (!resolved.startsWith(`${outputRoot}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside generated output: ${resolved}`);
  }
  return resolved;
}

/**
 * @param {string} dir
 */
function removeDirContentsBottomUp(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeDirContentsBottomUp(full);
      fs.rmdirSync(full);
      continue;
    }
    try {
      if (entry.isSymbolicLink()) fs.unlinkSync(full);
      else fs.unlinkSync(full);
    } catch (err) {
      const chmodErr = /** @type {NodeJS.ErrnoException} */ (err);
      if (chmodErr.code === "EACCES" || chmodErr.code === "EPERM") {
        fs.chmodSync(full, 0o666);
        fs.unlinkSync(full);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Remove a generated output directory (e.g. output/*-astro) safely.
 * Handles partial node_modules leftovers that can cause fs.rmSync ENOTEMPTY.
 *
 * @param {string} targetPath absolute or relative under toolRoot/output/
 * @param {{ toolRoot?: string }} [options]
 */
export function removeGeneratedOutputDir(targetPath, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  const resolved = assertUnderGeneratedOutput(
    path.isAbsolute(targetPath) ? targetPath : path.join(toolRoot, targetPath),
    toolRoot,
  );

  if (!fs.existsSync(resolved)) {
    return { removed: false, method: "none" };
  }

  try {
    fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    if (!fs.existsSync(resolved)) {
      return { removed: true, method: "rmSync" };
    }
  } catch {
    // fall through to bottom-up cleanup
  }

  removeDirContentsBottomUp(resolved);
  fs.rmdirSync(resolved);
  return { removed: true, method: "walk" };
}

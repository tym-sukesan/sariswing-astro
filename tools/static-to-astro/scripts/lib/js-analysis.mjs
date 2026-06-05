/**
 * JavaScript usage analysis for static → Astro conversion.
 */

export function analyzeJavaScript(rawPages) {
  const pathToPages = new Map();
  const externalScripts = [];
  const inlineScripts = [];
  const pageCount = rawPages.length;

  for (const page of rawPages) {
    for (const ref of page.jsRefs) {
      if (ref.kind === "external") {
        externalScripts.push({
          file: page.relPath,
          src: ref.raw,
          resolved: ref.resolved,
        });
        continue;
      }
      if (ref.kind !== "internal" || !ref.resolved) continue;
      const list = pathToPages.get(ref.resolved) ?? [];
      if (!list.includes(page.relPath)) list.push(page.relPath);
      pathToPages.set(ref.resolved, list);
    }

    page.$("script:not([src])").each((_, el) => {
      const content = page.$(el).html()?.trim() ?? "";
      if (!content) return;
      inlineScripts.push({
        file: page.relPath,
        length: content.length,
        preview: content.replace(/\s+/g, " ").slice(0, 100),
      });
    });
  }

  const layoutScripts = [];
  const pageSpecificScripts = [];
  const sharedPartialScripts = [];

  for (const [resolved, pages] of pathToPages) {
    const entry = { resolved, pages, from: resolved.replace(/^\//, "") };
    if (pages.length === pageCount) layoutScripts.push(entry);
    else if (pages.length === 1) pageSpecificScripts.push({ ...entry, file: pages[0] });
    else sharedPartialScripts.push(entry);
  }

  return {
    layoutScripts,
    pageSpecificScripts,
    sharedPartialScripts,
    externalScripts,
    inlineScripts,
  };
}

export function jsPublicPath(resolvedPath) {
  const rel = resolvedPath.replace(/^\//, "");
  return `/assets/js/${rel.replace(/^js\//, "")}`;
}

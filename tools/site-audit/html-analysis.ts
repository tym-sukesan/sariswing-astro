import * as cheerio from "cheerio";
import type { AnyNode, Element } from "domhandler";

const IMPORTANT_TAGS = new Set([
  "header",
  "nav",
  "main",
  "section",
  "article",
  "footer",
  "form",
  "iframe",
  "img",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
]);

const MAX_OUTLINE_DEPTH = 4;
const MAX_OUTLINE_CHILDREN = 12;

export const MAX_BACKGROUND_CANDIDATES_PER_PAGE = 20;
export const MAX_BACKGROUND_CANDIDATES_TOTAL = 100;

export type BackgroundImageSource = "inline-style" | "style-block" | "stylesheet-href";

export type BackgroundImageCandidate = {
  pagePath: string;
  pageUrl: string;
  source: BackgroundImageSource;
  selectorOrElement: string;
  imageUrl: string;
  cssProperty: "background" | "background-image" | "url";
  rawSnippet?: string;
  note?: string;
};

export type BackgroundImageExtractionStats = {
  inlineStyle: number;
  styleBlock: number;
  total: number;
};

export type PageHtmlAnalysis = {
  slug: string;
  pageUrl: string;
  pagePath: string;
  stylesheetHrefs: string[];
  inlineStyleCount: number;
  styleTagCount: number;
  styleTextLength: number;
  domOutline: string[];
  headings: string[];
  sectionCandidates: string[];
  classes: Array<{ name: string; count: number }>;
  imageCount: number;
  iframeCount: number;
  backgroundImages: BackgroundImageCandidate[];
  objectFitValues: string[];
  styleText: string;
};

const CSS_URL_PATTERN = /url\s*\(\s*(?:'([^']*)'|"([^"]*)"|([^'")]+?))\s*\)/gi;
const BACKGROUND_DECL_PATTERN = /(background(?:-image)?)\s*:\s*([^;}{]+)/gi;

export function isExcludedBackgroundUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || /^(none|inherit|initial|unset|auto)$/i.test(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("data:")) return true;
  if (lower.startsWith("blob:")) return true;
  if (lower.startsWith("about:")) return true;
  if (lower.startsWith("javascript:")) return true;
  if (lower.startsWith("#")) return true;
  if (/\.(woff2?|ttf|eot|otf)(\?|#|$)/i.test(lower)) return true;

  return false;
}

export function isLikelyBackgroundImageUrl(resolvedUrl: string): boolean {
  if (isExcludedBackgroundUrl(resolvedUrl)) return false;

  const lower = resolvedUrl.toLowerCase();
  if (/\.(jpe?g|png|webp|gif|svg|avif)(\?|#|$)/i.test(lower)) return true;
  if (/static\.wixstatic\.com|static\.parastorage\.com/i.test(lower)) return true;
  if (/\/(images?|media|photo)/i.test(lower)) return true;
  if (/wixstatic|parastorage|\/image|\/media|\/photo|thumb|banner|hero|background|bg[-_/]/i.test(lower)) {
    return true;
  }

  if (/^https?:\/\//i.test(resolvedUrl) && !/\.css(\?|#|$)/i.test(lower)) {
    return true;
  }

  if (resolvedUrl.startsWith("/") && !/\.css(\?|#|$)/i.test(lower)) {
    return true;
  }

  return false;
}

export function resolveCssUrl(rawUrl: string, pageUrl: string): string | null {
  const trimmed = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed || isExcludedBackgroundUrl(trimmed)) return null;

  try {
    return new URL(trimmed, pageUrl).href;
  } catch {
    return null;
  }
}

function extractUrlsFromCssValue(value: string): string[] {
  const urls: string[] = [];
  const pattern = new RegExp(CSS_URL_PATTERN.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    const raw = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (raw) urls.push(raw);
  }

  return urls;
}

function inferBackgroundNote(selectorOrElement: string, imageUrl: string): string {
  const blob = `${selectorOrElement} ${imageUrl}`.toLowerCase();
  if (/hero|mainvisual|mv|top-image|topimage|banner|masthead/.test(blob)) {
    return "likely hero / key visual background";
  }
  if (/header|nav|menu/.test(blob)) return "likely header / navigation background";
  if (/footer/.test(blob)) return "likely footer background";
  if (/section|content|main|page/.test(blob)) return "likely section / page background";
  if (/cover|fill|parallax/.test(blob)) return "likely full-bleed section background";
  return "CSS background image candidate";
}

function shortenSelector(selector: string): string {
  const compact = selector.replace(/\s+/g, " ").trim();
  if (compact.length <= 120) return compact;
  return `${compact.slice(0, 117)}...`;
}

function formatElementSelector(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.attribs.id ? `#${element.attribs.id}` : "";
  const classes = (element.attribs.class ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((name) => !isLikelyGeneratedClass(name) || isWixStructuralClueClass(name))
    .slice(0, 2)
    .map(shortenClassName);

  const classPart = classes.length > 0 ? `.${classes.join(".")}` : "";
  let label = `${tag}${id}${classPart}`;
  if (label.length > 80) label = `${label.slice(0, 77)}...`;
  return label;
}

function candidateKey(candidate: BackgroundImageCandidate): string {
  return `${candidate.pagePath}|${candidate.imageUrl}|${candidate.source}|${candidate.selectorOrElement}`;
}

function pushCandidate(
  candidates: BackgroundImageCandidate[],
  seen: Set<string>,
  candidate: BackgroundImageCandidate,
  limit: number,
): void {
  if (candidates.length >= limit) return;
  const key = candidateKey(candidate);
  if (seen.has(key)) return;
  seen.add(key);
  candidates.push(candidate);
}

const BACKGROUND_SELECTOR_HINT =
  /background|bgmedia|bglayer|pagebackground|hero|mainvisual|top-?image|fill-layer|headercontainer|classicsection|section|bg_|_bg|webp|wphoto/i;

const CSS_CUSTOM_PROP_WITH_URL =
  /--[\w-]*(?:bg|background|image|media|fill)[\w-]*\s*:\s*([^;}{]+)/gi;

const BARE_IMAGE_URL_IN_STYLE =
  /https?:\/\/[^\s"'\\);]+?(?:\.(?:jpe?g|png|webp|gif|svg|avif)|(?:wixstatic\.com|parastorage\.com)\/media\/[^\s"'\\);]+)/gi;

function isBackgroundRelatedSelector(selector: string): boolean {
  return BACKGROUND_SELECTOR_HINT.test(selector);
}

function extractFromInlineStyles(
  $: cheerio.CheerioAPI,
  pageUrl: string,
  pagePath: string,
  limit: number,
): BackgroundImageCandidate[] {
  const candidates: BackgroundImageCandidate[] = [];
  const seen = new Set<string>();

  $("[style]").each((_, node) => {
    if (candidates.length >= limit) return;

    const element = node as Element;
    const style = element.attribs.style ?? "";
    if (!/url\s*\(/i.test(style)) return;

    const selectorOrElement = formatElementSelector(element);
    const declPattern = new RegExp(BACKGROUND_DECL_PATTERN.source, "gi");
    let declMatch: RegExpExecArray | null;

    while ((declMatch = declPattern.exec(style)) !== null && candidates.length < limit) {
      const propertyRaw = declMatch[1].toLowerCase();
      const cssProperty: BackgroundImageCandidate["cssProperty"] =
        propertyRaw === "background-image" ? "background-image" : "background";
      const value = declMatch[2];
      addUrlsFromDeclaration(
        candidates,
        seen,
        { pagePath, pageUrl, source: "inline-style", selectorOrElement, cssProperty, value },
        limit,
      );
    }

    const customPattern = new RegExp(CSS_CUSTOM_PROP_WITH_URL.source, "gi");
    let customMatch: RegExpExecArray | null;
    while ((customMatch = customPattern.exec(style)) !== null && candidates.length < limit) {
      const value = customMatch[1];
      if (!/url\s*\(/i.test(value)) continue;
      addUrlsFromDeclaration(
        candidates,
        seen,
        {
          pagePath,
          pageUrl,
          source: "inline-style",
          selectorOrElement,
          cssProperty: "url",
          value,
          note: "CSS custom property with url() on inline style",
        },
        limit,
      );
    }

    if (
      /url\s*\(/i.test(style) &&
      (isBackgroundRelatedSelector(selectorOrElement) ||
        /background|bgmedia|pagebackground/i.test(style))
    ) {
      for (const rawUrl of extractUrlsFromCssValue(style)) {
        const imageUrl = resolveCssUrl(rawUrl, pageUrl);
        if (!imageUrl || !isLikelyBackgroundImageUrl(imageUrl)) continue;
        pushCandidate(
          candidates,
          seen,
          {
            pagePath,
            pageUrl,
            source: "inline-style",
            selectorOrElement,
            imageUrl,
            cssProperty: "url",
            rawSnippet: style.trim().slice(0, 72),
            note: inferBackgroundNote(selectorOrElement, imageUrl),
          },
          limit,
        );
      }
    }
  });

  return candidates;
}

function addUrlsFromDeclaration(
  candidates: BackgroundImageCandidate[],
  seen: Set<string>,
  ctx: {
    pagePath: string;
    pageUrl: string;
    source: BackgroundImageCandidate["source"];
    selectorOrElement: string;
    cssProperty: BackgroundImageCandidate["cssProperty"];
    value: string;
    note?: string;
  },
  limit: number,
): void {
  for (const rawUrl of extractUrlsFromCssValue(ctx.value)) {
    const imageUrl = resolveCssUrl(rawUrl, ctx.pageUrl);
    if (!imageUrl || !isLikelyBackgroundImageUrl(imageUrl)) continue;

    pushCandidate(
      candidates,
      seen,
      {
        pagePath: ctx.pagePath,
        pageUrl: ctx.pageUrl,
        source: ctx.source,
        selectorOrElement: ctx.selectorOrElement,
        imageUrl,
        cssProperty: ctx.cssProperty,
        rawSnippet: `${ctx.cssProperty}: ${ctx.value.trim().slice(0, 72)}`,
        note: ctx.note ?? inferBackgroundNote(ctx.selectorOrElement, imageUrl),
      },
      limit,
    );
  }
}

function extractFromStyleBlocks(
  styleText: string,
  pageUrl: string,
  pagePath: string,
  limit: number,
): BackgroundImageCandidate[] {
  const candidates: BackgroundImageCandidate[] = [];
  const seen = new Set<string>();

  if (!styleText) return candidates;

  const blocks = styleText.split("}");
  for (const block of blocks) {
    if (candidates.length >= limit) break;
    if (!/url\s*\(/i.test(block)) continue;

    const openBrace = block.lastIndexOf("{");
    let selector = "(style block rule)";
    let declarations = block;

    if (openBrace >= 0) {
      const selectorPart = block.slice(0, openBrace).trim();
      declarations = block.slice(openBrace + 1);
      const selectorLines = selectorPart
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      selector = shortenSelector(selectorLines[selectorLines.length - 1] ?? selectorPart);
    }

    const hasBackgroundDecl = /background(?:-image)?\s*:/i.test(declarations);
    const contextual = isBackgroundRelatedSelector(selector);

    if (!hasBackgroundDecl && !contextual) continue;

    const declPattern = new RegExp(BACKGROUND_DECL_PATTERN.source, "gi");
    let declMatch: RegExpExecArray | null;

    while ((declMatch = declPattern.exec(declarations)) !== null && candidates.length < limit) {
      const propertyRaw = declMatch[1].toLowerCase();
      const cssProperty: BackgroundImageCandidate["cssProperty"] =
        propertyRaw === "background-image" ? "background-image" : "background";
      addUrlsFromDeclaration(
        candidates,
        seen,
        {
          pagePath,
          pageUrl,
          source: "style-block",
          selectorOrElement: selector,
          cssProperty,
          value: declMatch[2],
        },
        limit,
      );
    }

    const customPattern = new RegExp(CSS_CUSTOM_PROP_WITH_URL.source, "gi");
    let customMatch: RegExpExecArray | null;
    while ((customMatch = customPattern.exec(declarations)) !== null && candidates.length < limit) {
      const value = customMatch[1];
      if (!/url\s*\(/i.test(value)) continue;
      addUrlsFromDeclaration(
        candidates,
        seen,
        {
          pagePath,
          pageUrl,
          source: "style-block",
          selectorOrElement: selector,
          cssProperty: "url",
          value,
          note: "CSS custom property with url() in <style>",
        },
        limit,
      );
    }

    if (contextual && candidates.length < limit) {
      for (const rawUrl of extractUrlsFromCssValue(declarations)) {
        const imageUrl = resolveCssUrl(rawUrl, pageUrl);
        if (!imageUrl || !isLikelyBackgroundImageUrl(imageUrl)) continue;
        pushCandidate(
          candidates,
          seen,
          {
            pagePath,
            pageUrl,
            source: "style-block",
            selectorOrElement: selector,
            imageUrl,
            cssProperty: "url",
            note: inferBackgroundNote(selector, imageUrl),
          },
          limit,
        );
      }
    }
  }

  return candidates;
}

function extractBareImageUrlsFromStyleText(
  styleText: string,
  pageUrl: string,
  pagePath: string,
  limit: number,
): BackgroundImageCandidate[] {
  const candidates: BackgroundImageCandidate[] = [];
  const seen = new Set<string>();

  if (!styleText) return candidates;

  const pattern = new RegExp(BARE_IMAGE_URL_IN_STYLE.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(styleText)) !== null && candidates.length < limit) {
    const raw = match[0];
    const imageUrl = resolveCssUrl(raw, pageUrl);
    if (!imageUrl || !isLikelyBackgroundImageUrl(imageUrl)) continue;

    pushCandidate(
      candidates,
      seen,
      {
        pagePath,
        pageUrl,
        source: "style-block",
        selectorOrElement: "(embedded in <style> text)",
        imageUrl,
        cssProperty: "url",
        note: "Image URL literal found in <style> (may be used as background via JS or CSS variables)",
      },
      limit,
    );
  }

  return candidates;
}

export function collectStylesheetHrefs($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const hrefs = new Set<string>();

  $('link[rel="stylesheet"]').each((_, element) => {
    const href = (element as Element).attribs.href ?? "";
    if (!href) return;
    try {
      hrefs.add(new URL(href, pageUrl).href);
    } catch {
      hrefs.add(href);
    }
  });

  $("style[data-href], style[data-url]").each((_, element) => {
    const href = (element as Element).attribs["data-href"] ?? (element as Element).attribs["data-url"] ?? "";
    if (!href) return;
    try {
      hrefs.add(new URL(href, pageUrl).href);
    } catch {
      hrefs.add(href);
    }
  });

  return [...hrefs];
}

export function extractBackgroundImagesFromHtml(
  html: string,
  pageUrl: string,
  pagePath: string,
): BackgroundImageCandidate[] {
  const $ = cheerio.load(html);
  const styleText = $("style")
    .map((_, element) => $(element).html() ?? "")
    .get()
    .join("\n");

  const candidates: BackgroundImageCandidate[] = [];
  const seen = new Set<string>();

  const addBatch = (batch: BackgroundImageCandidate[]) => {
    for (const item of batch) {
      pushCandidate(candidates, seen, item, MAX_BACKGROUND_CANDIDATES_PER_PAGE);
    }
  };

  addBatch(extractFromInlineStyles($, pageUrl, pagePath, MAX_BACKGROUND_CANDIDATES_PER_PAGE));
  addBatch(extractFromStyleBlocks(styleText, pageUrl, pagePath, MAX_BACKGROUND_CANDIDATES_PER_PAGE));
  addBatch(extractBareImageUrlsFromStyleText(styleText, pageUrl, pagePath, MAX_BACKGROUND_CANDIDATES_PER_PAGE));

  return candidates.slice(0, MAX_BACKGROUND_CANDIDATES_PER_PAGE);
}

export function capBackgroundImageCandidates(
  candidates: BackgroundImageCandidate[],
  maxTotal = MAX_BACKGROUND_CANDIDATES_TOTAL,
): BackgroundImageCandidate[] {
  const seen = new Set<string>();
  const capped: BackgroundImageCandidate[] = [];

  for (const candidate of candidates) {
    const key = `${candidate.pagePath}|${candidate.imageUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    capped.push(candidate);
    if (capped.length >= maxTotal) break;
  }

  return capped;
}

export function summarizeBackgroundExtraction(
  candidates: BackgroundImageCandidate[],
): BackgroundImageExtractionStats {
  return {
    inlineStyle: candidates.filter((item) => item.source === "inline-style").length,
    styleBlock: candidates.filter((item) => item.source === "style-block").length,
    total: candidates.length,
  };
}

export function isWixStructuralClueClass(className: string): boolean {
  if (!/^wixui-/i.test(className)) return false;
  if (/^wixui-(?!.*[a-z]{3,})[a-z0-9_-]{0,8}$/i.test(className)) return false;
  return /^wixui-[a-z][a-z0-9_-]*(__[a-z0-9_-]+)?$/i.test(className);
}

function looksLikeRandomTokenClass(className: string): boolean {
  if (className.length < 4 || className.length > 12) return false;
  if (className.includes("-")) return false;
  if (/^[a-f0-9]{8,}$/i.test(className)) return true;
  if (/^_[A-Za-z0-9]{3,11}$/.test(className)) return true;
  if (!/^[A-Za-z0-9_]+$/.test(className)) return false;
  const hasUpper = /[A-Z]/.test(className);
  const hasLower = /[a-z]/.test(className);
  const hasDigit = /\d/.test(className);
  if ((hasUpper && hasLower) || (hasUpper && hasDigit) || (hasLower && hasDigit)) {
    return true;
  }
  return false;
}

export function isLikelyGeneratedClass(className: string): boolean {
  if (!className) return true;
  if (isWixStructuralClueClass(className)) return false;
  if (className.length > 48) return true;
  if (/^data-astro-cid-/i.test(className)) return true;
  if (/^css-editing-scope$/i.test(className)) return true;
  if (/^comp-/i.test(className)) return true;
  if (/^itemdepth/i.test(className)) return true;
  if (/^itemshared/i.test(className)) return true;
  if (/^stylablehorizontalmenu/i.test(className)) return true;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(className)) {
    return true;
  }
  if (/\d{6,}/.test(className)) return true;
  if (/^[a-z]{1,3}\d{5,}$/i.test(className)) return true;
  if (/^[a-f0-9]{8,}$/i.test(className)) return true;
  if (/^(css-|elementor-|wp-block-|Mui)/i.test(className)) return true;
  if (/^wix-/.test(className) && !/^wixui-/.test(className)) return true;
  if ((className.match(/__/g) ?? []).length >= 2) return true;
  if ((className.match(/_/g) ?? []).length >= 4) return true;
  if (looksLikeRandomTokenClass(className)) return true;
  return false;
}

export function isUsefulStructuralClass(className: string): boolean {
  if (isWixStructuralClueClass(className)) return true;
  if (isLikelyGeneratedClass(className)) return false;
  if (/^(site-|global-|page-|main|hero|nav|menu|footer|header|content|wrap|logo|schedule|news|contact|discography|link)/i.test(className)) {
    return true;
  }
  if (/^[a-z][a-z0-9]*(-[a-z][a-z0-9]*){1,}$/i.test(className) && className.length >= 6) {
    return true;
  }
  return false;
}

function shortenClassName(className: string): string {
  if (className.length <= 40) return className;
  return `${className.slice(0, 37)}...`;
}

function formatNodeLabel(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.attribs.id ? `#${element.attribs.id}` : "";
  const classes = (element.attribs.class ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .filter((name) => !isLikelyGeneratedClass(name))
    .slice(0, 2)
    .map(shortenClassName);

  const classPart = classes.length > 0 ? `.${classes.join(".")}` : "";
  return `${tag}${id}${classPart}`;
}

function buildDomOutline($: cheerio.CheerioAPI, root: AnyNode, depth: number): string[] {
  if (depth > MAX_OUTLINE_DEPTH) return [];

  const lines: string[] = [];
  const children = $(root).children().toArray().slice(0, MAX_OUTLINE_CHILDREN);

  for (const child of children) {
    if (child.type !== "tag") continue;
    const element = child as Element;
    const tag = element.tagName.toLowerCase();

    const isImportant =
      IMPORTANT_TAGS.has(tag) ||
      Boolean(element.attribs.id) ||
      Boolean(element.attribs.class) ||
      tag === "div";

    if (!isImportant && depth > 1) continue;

    const indent = "  ".repeat(depth);
    lines.push(`${indent}- ${formatNodeLabel(element)}`);

    if (depth < MAX_OUTLINE_DEPTH) {
      lines.push(...buildDomOutline($, element, depth + 1));
    }
  }

  return lines;
}

function inferSectionCandidates($: cheerio.CheerioAPI): string[] {
  const candidates = new Set<string>();
  const pushMatch = (pattern: RegExp, label: string, haystack: string) => {
    if (pattern.test(haystack)) candidates.add(label);
  };

  $("[id],[class]").each((_, element) => {
    const el = element as Element;
    const blob = `${el.attribs.id ?? ""} ${el.attribs.class ?? ""}`.toLowerCase();

    pushMatch(/hero|top-images|topimage|mv|mainvisual/, "Hero", blob);
    pushMatch(/news/, "News", blob);
    pushMatch(/instagram|insta/, "Instagram / Embed", blob);
    pushMatch(/schedule|live/, "Schedule", blob);
    pushMatch(/about|profile|biograph/, "Profile / About", blob);
    pushMatch(/contact|hubspot|form/, "Contact / Form", blob);
    pushMatch(/footer|copyright|pagetop/, "Footer", blob);
    pushMatch(/nav|gnav|menu/, "Navigation", blob);
    pushMatch(/jazz|otona|feature|banner|shop|webshop/, "Feature / CTA", blob);
  });

  $("h2").each((_, element) => {
    const text = $(element).text().trim();
    if (/news/i.test(text)) candidates.add("News");
    if (/instagram/i.test(text)) candidates.add("Instagram / Embed");
    if (/schedule|live/i.test(text)) candidates.add("Schedule");
    if (/contact/i.test(text)) candidates.add("Contact / Form");
    if (/about|profile/i.test(text)) candidates.add("Profile / About");
  });

  if ($("header").length > 0) candidates.add("Navigation");
  if ($("footer").length > 0) candidates.add("Footer");
  if ($("main").length > 0 && candidates.size === 0) candidates.add("Main content");

  return [...candidates];
}

export function analyzeHtml(
  slug: string,
  html: string,
  pageUrl: string,
  pagePath: string,
): PageHtmlAnalysis {
  const $ = cheerio.load(html);

  const stylesheetHrefs = collectStylesheetHrefs($, pageUrl);

  const styleTags = $("style");
  const styleText = styleTags
    .map((_, element) => $(element).html() ?? "")
    .get()
    .join("\n");

  const inlineStyleCount = $("[style]").length;

  const classCounts = new Map<string, number>();
  $("[class]").each((_, element) => {
    const classAttr = (element as Element).attribs.class ?? "";
    for (const name of classAttr.split(/\s+/).filter(Boolean)) {
      classCounts.set(name, (classCounts.get(name) ?? 0) + 1);
    }
  });

  const classes = [...classCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const body = $("body").get(0);
  const domOutline = body ? ["- body", ...buildDomOutline($, body, 1)] : ["- body (not found)"];

  const headings = ["h1", "h2", "h3"]
    .flatMap((tag) =>
      $(tag)
        .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
        .get(),
    )
    .filter(Boolean)
    .slice(0, 12);

  const objectFitValues = new Set<string>();

  $("[style]").each((_, element) => {
    const style = (element as Element).attribs.style ?? "";
    const fitMatch = /object-fit\s*:\s*([^;]+)/i.exec(style);
    if (fitMatch) objectFitValues.add(fitMatch[1].trim());
  });

  $("img[style]").each((_, element) => {
    const style = (element as Element).attribs.style ?? "";
    const fitMatch = /object-fit\s*:\s*([^;]+)/i.exec(style);
    if (fitMatch) objectFitValues.add(fitMatch[1].trim());
  });

  const backgroundImages = extractBackgroundImagesFromHtml(html, pageUrl, pagePath);

  return {
    slug,
    pageUrl,
    pagePath,
    stylesheetHrefs,
    inlineStyleCount,
    styleTagCount: styleTags.length,
    styleTextLength: styleText.length,
    domOutline,
    headings,
    sectionCandidates: inferSectionCandidates($),
    classes,
    imageCount: $("img").length,
    iframeCount: $("iframe").length,
    backgroundImages,
    objectFitValues: [...objectFitValues],
    styleText,
  };
}

type ValueCount = { value: string; count: number };

function tallyMatches(text: string, pattern: RegExp): ValueCount[] {
  const counts = new Map<string, number>();
  for (const match of text.matchAll(pattern)) {
    const value = (match[1] ?? match[0]).trim().replace(/\s+/g, " ");
    if (!value || value.length > 120) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export type AggregatedCssClues = {
  colors: ValueCount[];
  backgroundColors: ValueCount[];
  fontFamilies: ValueCount[];
  fontSizes: ValueCount[];
  maxWidths: ValueCount[];
  spacing: ValueCount[];
  borders: ValueCount[];
  borderRadii: ValueCount[];
  boxShadows: ValueCount[];
  displays: ValueCount[];
  positions: ValueCount[];
  gridColumns: ValueCount[];
  gaps: ValueCount[];
  alignments: ValueCount[];
  objectFits: ValueCount[];
  widths: ValueCount[];
  heights: ValueCount[];
  mediaQueries: ValueCount[];
};

export function aggregateCssClues(styleText: string, htmlBodies: string[]): AggregatedCssClues {
  const combined = `${styleText}\n${htmlBodies.join("\n")}`;

  return {
    colors: tallyMatches(combined, /\bcolor\s*:\s*([^;}{]+)/gi).slice(0, 15),
    backgroundColors: tallyMatches(
      combined,
      /\bbackground-color\s*:\s*([^;}{]+)/gi,
    ).slice(0, 15),
    fontFamilies: tallyMatches(combined, /\bfont-family\s*:\s*([^;}{]+)/gi).slice(0, 10),
    fontSizes: tallyMatches(combined, /\bfont-size\s*:\s*([^;}{]+)/gi).slice(0, 15),
    maxWidths: tallyMatches(combined, /\bmax-width\s*:\s*([^;}{]+)/gi).slice(0, 12),
    spacing: [
      ...tallyMatches(combined, /\bpadding(?:-[a-z]+)?\s*:\s*([^;}{]+)/gi),
      ...tallyMatches(combined, /\bmargin(?:-[a-z]+)?\s*:\s*([^;}{]+)/gi),
    ]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    borders: tallyMatches(combined, /\bborder(?:-[a-z]+)?\s*:\s*([^;}{]+)/gi).slice(0, 12),
    borderRadii: tallyMatches(combined, /\bborder-radius\s*:\s*([^;}{]+)/gi).slice(0, 10),
    boxShadows: tallyMatches(combined, /\bbox-shadow\s*:\s*([^;}{]+)/gi).slice(0, 8),
    displays: tallyMatches(combined, /\bdisplay\s*:\s*([^;}{]+)/gi).slice(0, 10),
    positions: tallyMatches(combined, /\bposition\s*:\s*([^;}{]+)/gi).slice(0, 8),
    gridColumns: tallyMatches(
      combined,
      /\bgrid-template-columns\s*:\s*([^;}{]+)/gi,
    ).slice(0, 8),
    gaps: tallyMatches(combined, /\bgap\s*:\s*([^;}{]+)/gi).slice(0, 8),
    alignments: [
      ...tallyMatches(combined, /\balign-items\s*:\s*([^;}{]+)/gi),
      ...tallyMatches(combined, /\bjustify-content\s*:\s*([^;}{]+)/gi),
    ]
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    objectFits: tallyMatches(combined, /\bobject-fit\s*:\s*([^;}{]+)/gi).slice(0, 6),
    widths: tallyMatches(combined, /\bwidth\s*:\s*([^;}{]+)/gi).slice(0, 12),
    heights: tallyMatches(combined, /\b(?:min-)?height\s*:\s*([^;}{]+)/gi).slice(0, 12),
    mediaQueries: tallyMatches(combined, /@media\s*([^{]+)/gi).slice(0, 12),
  };
}

export type ClassAggregate = {
  name: string;
  totalCount: number;
  pages: string[];
  kind: "structural" | "generated";
};

export function aggregateClasses(
  pageAnalyses: PageHtmlAnalysis[],
): { structuralClues: ClassAggregate[]; generated: ClassAggregate[] } {
  const map = new Map<string, { totalCount: number; pages: Set<string> }>();

  for (const page of pageAnalyses) {
    for (const { name, count } of page.classes) {
      const entry = map.get(name) ?? { totalCount: 0, pages: new Set<string>() };
      entry.totalCount += count;
      entry.pages.add(page.slug);
      map.set(name, entry);
    }
  }

  const all: ClassAggregate[] = [...map.entries()]
    .map(([name, data]) => ({
      name,
      totalCount: data.totalCount,
      pages: [...data.pages].sort(),
      kind: isUsefulStructuralClass(name) ? ("structural" as const) : ("generated" as const),
    }))
    .sort((a, b) => b.totalCount - a.totalCount);

  return {
    structuralClues: all.filter((item) => item.kind === "structural").slice(0, 35),
    generated: all.filter((item) => item.kind === "generated").slice(0, 20),
  };
}

export function isFrameworkTokenValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (normalized.startsWith("var(--")) return true;
  if (normalized === "#0000" || normalized === "rgba(0,0,0,0)" || normalized === "rgba(0, 0, 0, 0)") {
    return true;
  }
  return false;
}

function isUsefulColorValue(value: string): boolean {
  const v = value.trim();
  if (isFrameworkTokenValue(v)) return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
  if (/^rgba?\(/i.test(v)) return true;
  if (/^(white|black|ivory|beige|snow|gray|grey|transparent)$/i.test(v)) return true;
  return false;
}

function isUsefulSizeValue(value: string): boolean {
  const v = value.trim();
  if (isFrameworkTokenValue(v)) return false;
  return /^\d+(\.\d+)?(px|rem|em|%|vw|vh)\b/i.test(v) || /^calc\(/i.test(v);
}

function isUsefulFontValue(value: string): boolean {
  const v = value.trim();
  if (isFrameworkTokenValue(v)) return false;
  if (v.length > 120) return false;
  if (/^var\(--/.test(v)) return false;
  return v.length > 0;
}

export function partitionValueCounts(
  rows: ValueCount[],
  kind: "color" | "size" | "font" | "generic",
): { useful: ValueCount[]; raw: ValueCount[] } {
  const useful: ValueCount[] = [];
  const raw: ValueCount[] = [];

  for (const row of rows) {
    const isUseful =
      kind === "color"
        ? isUsefulColorValue(row.value)
        : kind === "size"
          ? isUsefulSizeValue(row.value)
          : kind === "font"
            ? isUsefulFontValue(row.value)
            : !isFrameworkTokenValue(row.value) && row.value.length <= 80;

    if (isUseful) useful.push(row);
    else raw.push(row);
  }

  return { useful, raw };
}

export type PartitionedCssClues = {
  useful: AggregatedCssClues;
  raw: AggregatedCssClues;
};

export function partitionCssClues(clues: AggregatedCssClues): PartitionedCssClues {
  const split = (rows: ValueCount[], kind: "color" | "size" | "font" | "generic") =>
    partitionValueCounts(rows, kind);

  const colors = split(clues.colors, "color");
  const backgroundColors = split(clues.backgroundColors, "color");
  const fontFamilies = split(clues.fontFamilies, "font");
  const fontSizes = split(clues.fontSizes, "size");
  const maxWidths = split(clues.maxWidths, "size");
  const spacing = split(clues.spacing, "size");
  const borders = split(clues.borders, "generic");
  const borderRadii = split(clues.borderRadii, "size");
  const boxShadows = split(clues.boxShadows, "generic");
  const displays = split(clues.displays, "generic");
  const positions = split(clues.positions, "generic");
  const gridColumns = split(clues.gridColumns, "generic");
  const gaps = split(clues.gaps, "size");
  const alignments = split(clues.alignments, "generic");
  const objectFits = split(clues.objectFits, "generic");
  const widths = split(clues.widths, "size");
  const heights = split(clues.heights, "size");
  const mediaQueries = split(clues.mediaQueries, "generic");

  const mergeUseful = (...groups: ValueCount[][]) => groups.flat();
  const mergeRaw = (...groups: ValueCount[][]) => groups.flat();

  return {
    useful: {
      colors: colors.useful,
      backgroundColors: backgroundColors.useful,
      fontFamilies: fontFamilies.useful,
      fontSizes: fontSizes.useful,
      maxWidths: maxWidths.useful,
      spacing: spacing.useful,
      borders: borders.useful,
      borderRadii: borderRadii.useful,
      boxShadows: boxShadows.useful,
      displays: displays.useful,
      positions: positions.useful,
      gridColumns: gridColumns.useful,
      gaps: gaps.useful,
      alignments: alignments.useful,
      objectFits: objectFits.useful,
      widths: widths.useful,
      heights: heights.useful,
      mediaQueries: mediaQueries.useful,
    },
    raw: {
      colors: colors.raw,
      backgroundColors: backgroundColors.raw,
      fontFamilies: fontFamilies.raw,
      fontSizes: fontSizes.raw,
      maxWidths: maxWidths.raw,
      spacing: spacing.raw,
      borders: borders.raw,
      borderRadii: borderRadii.raw,
      boxShadows: boxShadows.raw,
      displays: displays.raw,
      positions: positions.raw,
      gridColumns: gridColumns.raw,
      gaps: gaps.raw,
      alignments: alignments.raw,
      objectFits: objectFits.raw,
      widths: widths.raw,
      heights: heights.raw,
      mediaQueries: mediaQueries.raw,
    },
  };
}

import {
  dateHintFromAltOrUrl,
  extractImageContextsFromHtml,
  parseAlbumTitlesFromText,
  parseScheduleEventsFromText,
  type ScheduleEventCandidate,
} from "./asset-context.ts";
import { isPlaceholderAsset } from "./event-image-matching.ts";
import type {
  AssetCandidate,
  AssetRenderedInfo,
  AssetSourceTag,
  Confidence,
  ImageHtmlContext,
  InferredRole,
} from "./asset-map-types.ts";
import type { PageType } from "./page-analysis.ts";
import type { AuditMetadata } from "./audit-site-types.ts";
import type { RenderedAssetCapture } from "./rendered-assets.ts";

const SNS_HOST_PATTERNS = [
  /facebook\.com/i,
  /instagram\.com/i,
  /twitter\.com/i,
  /x\.com/i,
  /youtube\.com/i,
  /tiktok\.com/i,
];

const SNS_ALT_PATTERNS = /facebook|instagram|twitter|\bx\b|sns|social/i;
const SCHEDULE_TEXT_PATTERNS =
  /live|open|start|charge|会場|出演|料金|住所|電話|☎|website|予約|sold out/i;
const DISCO_TEXT_PATTERNS = /track list|personnel|release|album|discography|作品|tax in/i;

function imageArea(width: number | null, height: number | null): number {
  if (!width || !height) return 0;
  return width * height;
}

function maxDimension(width: number | null, height: number | null): number {
  return Math.max(width ?? 0, height ?? 0);
}

function isSmallIcon(width: number | null, height: number | null): boolean {
  const max = maxDimension(width, height);
  const area = imageArea(width, height);
  return (max > 0 && max <= 80) || (area > 0 && area <= 6400);
}

function isSquareish(width: number | null, height: number | null): boolean {
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio >= 0.75 && ratio <= 1.35;
}

function isLargeVisual(width: number | null, height: number | null): boolean {
  const area = imageArea(width, height);
  const max = maxDimension(width, height);
  return area >= 120_000 || max >= 500;
}

function isPortrait(width: number | null, height: number | null): boolean {
  if (!width || !height) return false;
  return height > width * 1.1 && height >= 200;
}

function blobIncludes(value: string, patterns: RegExp | RegExp[]): boolean {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return list.some((pattern) => pattern.test(value));
}

function isSnsHref(href: string | null | undefined): boolean {
  if (!href) return false;
  return SNS_HOST_PATTERNS.some((pattern) => pattern.test(href));
}


function mergeTextLists(primary: string[], secondary: string[], max: number): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= max) break;
  }
  return merged;
}

function pickDimensions(context: ImageHtmlContext): {
  width: number | null;
  height: number | null;
} {
  const rendered = context.rendered;
  return {
    width:
      rendered?.renderedWidth ??
      rendered?.naturalWidth ??
      context.width,
    height:
      rendered?.renderedHeight ??
      rendered?.naturalHeight ??
      context.height,
  };
}

function renderedFromCapture(
  capture: RenderedAssetCapture,
): AssetRenderedInfo {
  return {
    viewportType: "desktop",
    renderedWidth: capture.renderedWidth ?? null,
    renderedHeight: capture.renderedHeight ?? null,
    naturalWidth: capture.naturalWidth ?? null,
    naturalHeight: capture.naturalHeight ?? null,
    x: capture.x ?? null,
    y: capture.y ?? null,
    isVisible: capture.isVisible,
    isAboveFold: capture.isAboveFold,
    selectorHint: capture.selectorHint,
    currentSrc: capture.currentSrc ?? null,
  };
}

function sourceTagFromRendered(source: RenderedAssetCapture["source"]): AssetSourceTag {
  if (source === "computed-background") return "computed-background";
  if (source === "rendered-picture") return "rendered-picture";
  return "rendered-img";
}

function matchScheduleEvent(
  events: ScheduleEventCandidate[],
  alt: string,
  url: string,
  nearbyBlob: string,
): { label: string; confidence: Confidence } | null {
  const dateHint = dateHintFromAltOrUrl(alt, url);
  if (dateHint) {
    const iso = dateHint.replace(/\./g, "-");
    const event =
      events.find((item) => item.eventDate === iso) ??
      events.find((item) => item.eventDateLabel.includes(dateHint));
    if (event) {
      const title = event.eventTitle ? ` / ${event.eventTitle}` : "";
      return {
        label: `${event.eventDateLabel}${title}`,
        confidence: "high",
      };
    }
    return { label: dateHint, confidence: "medium" };
  }

  for (const event of events) {
    if (event.eventTitle && nearbyBlob.includes(event.eventTitle.toLowerCase())) {
      return {
        label: `${event.eventDateLabel} / ${event.eventTitle}`,
        confidence: "medium",
      };
    }
    if (nearbyBlob.includes(event.eventDateLabel.toLowerCase())) {
      return {
        label: event.eventTitle
          ? `${event.eventDateLabel} / ${event.eventTitle}`
          : event.eventDateLabel,
        confidence: "medium",
      };
    }
    if (event.venue && nearbyBlob.includes(event.venue.toLowerCase())) {
      return {
        label: event.eventTitle
          ? `${event.eventDateLabel} / ${event.eventTitle}`
          : event.eventDateLabel,
        confidence: "medium",
      };
    }
  }

  return null;
}

type InferenceInput = {
  context: ImageHtmlContext;
  pageType: PageType;
  pageUrl: string;
  pageRoute: string;
  metadata: AuditMetadata;
  textSample: string;
  domIndex: number;
  totalImages: number;
  contentImageIndex: number;
  scheduleEvents: ScheduleEventCandidate[];
  albumTitles: string[];
};

type InferenceResult = {
  role: InferredRole;
  confidence: Confidence;
  relatedContentLabel?: string;
  notes: string[];
};

function inferAssetRole(input: InferenceInput): InferenceResult {
  const { context, pageType, textSample, metadata } = input;
  const notes: string[] = [];
  const alt = context.alt ?? "";
  const url = context.imageUrl;
  const hasRendered = context.sources.some((tag) =>
    ["rendered-img", "rendered-picture", "computed-background"].includes(tag),
  );
  const nearbyBlob = [
    alt,
    url,
    context.classNames,
    ...context.nearbyHeadings,
    ...context.nearbyText,
    ...metadata.h1,
    ...metadata.h2,
    ...metadata.h3,
    textSample.slice(0, 1500),
  ]
    .join(" ")
    .toLowerCase();

  const { width, height } = pickDimensions(context);
  const small = isSmallIcon(width, height);
  const large = isLargeVisual(width, height);
  const square = isSquareish(width, height);
  const portrait = isPortrait(width, height);
  const aboveFold = context.rendered?.isAboveFold === true;
  const renderedOnly =
    hasRendered && !context.sources.includes("json-image") && !context.sources.includes("html-img");

  if (hasRendered) {
    notes.push("Rendered DOM capture available (post lazy-load).");
  }
  if (renderedOnly) {
    notes.push("Image found in rendered DOM but not in saved HTML/JSON metadata.");
  }

  if (isPlaceholderAsset(alt, url, nearbyBlob)) {
    return {
      role: "decorative",
      confidence: "high",
      relatedContentLabel: "NO PHOTO placeholder",
      notes: [
        "Site uses explicit NO PHOTO or placeholder asset; prefer text-only card or owner-provided flyer.",
        "Do not treat as schedule-flyer (see eventMatch.warnings: no-photo-placeholder).",
      ],
    };
  }

  if (
    isSnsHref(context.linkedHref) ||
    (small && (SNS_ALT_PATTERNS.test(alt) || isSnsHref(context.linkedHref ?? "")))
  ) {
    return {
      role: "sns-icon",
      confidence: "high",
      relatedContentLabel: alt || "Social link icon",
      notes: ["Link to external SNS profile; use icon or text link in rebuild."],
    };
  }

  if (small && SNS_ALT_PATTERNS.test(alt)) {
    return {
      role: "sns-icon",
      confidence: "high",
      relatedContentLabel: alt,
      notes: ["Small icon with SNS alt text."],
    };
  }

  if (
    blobIncludes(nearbyBlob, [/logo/, /site title/, /brand/]) ||
    (small && blobIncludes(nearbyBlob, [/saki goto website/]) && input.domIndex === 0)
  ) {
    return {
      role: "logo",
      confidence: "medium",
      notes: ["Possible header/site branding image."],
    };
  }

  if (
    pageType === "Home" &&
    large &&
    (input.domIndex === 0 || (hasRendered && aboveFold && (context.rendered?.y ?? 999) < 400))
  ) {
    return {
      role: "hero",
      confidence: hasRendered && aboveFold ? "high" : "high",
      relatedContentLabel: "Home main visual",
      notes: [
        "First large image on Home; use as hero / main visual.",
        ...(hasRendered ? ["Rendered size/position supports hero placement."] : []),
      ],
    };
  }

  if (
    pageType === "Home" &&
    large &&
    blobIncludes(nearbyBlob, [/main/, /hero/, /top/, /visual/])
  ) {
    return {
      role: "hero",
      confidence: hasRendered && aboveFold ? "high" : "medium",
      relatedContentLabel: "Home main visual",
      notes: ["Large Home image with hero-like nearby text."],
    };
  }

  if (pageType === "Profile/About" && (portrait || (large && !small))) {
    const conf: Confidence =
      portrait && hasRendered ? "high" : portrait ? "high" : hasRendered ? "medium" : "medium";
    return {
      role: "profile-photo",
      confidence: conf,
      relatedContentLabel: metadata.title || "Profile photo",
      notes: [
        "About page portrait-style image.",
        ...(hasRendered ? ["Rendered DOM confirms visible profile image."] : []),
      ],
    };
  }

  const scheduleLikePage =
    pageType === "Schedule Month" ||
    pageType === "Schedule" ||
    (pageType === "Home" && blobIncludes(nearbyBlob, SCHEDULE_TEXT_PATTERNS));

  if (scheduleLikePage && !small) {
    const eventMatch = matchScheduleEvent(
      input.scheduleEvents,
      alt,
      url,
      nearbyBlob,
    );
    const scheduleSignals =
      square ||
      blobIncludes(nearbyBlob, [/flyer/, /live/, /event/, /schedule/]) ||
      blobIncludes(nearbyBlob, SCHEDULE_TEXT_PATTERNS) ||
      Boolean(dateHintFromAltOrUrl(alt, url));

    if (scheduleSignals || eventMatch) {
      let confidence: Confidence = eventMatch?.confidence ?? (square ? "medium" : "low");
      if (
        pageType === "Schedule Month" &&
        hasRendered &&
        !small &&
        (eventMatch || blobIncludes(nearbyBlob, SCHEDULE_TEXT_PATTERNS))
      ) {
        confidence = eventMatch ? "high" : "medium";
      }
      if (pageType === "Home" && hasRendered && eventMatch) {
        confidence = "high";
      }
      return {
        role: "schedule-flyer",
        confidence,
        relatedContentLabel: eventMatch?.label,
        notes: [
          pageType === "Home"
            ? "Home weekly schedule flyer candidate."
            : "Schedule page flyer/poster candidate.",
          ...(pageType === "Schedule Month" && hasRendered
            ? ["Rendered DOM image near schedule event text."]
            : pageType === "Schedule Month"
              ? ["Verify against schedule month screenshot; Wix may omit flyers from saved HTML."]
              : []),
        ],
      };
    }
  }

  if (pageType === "Discography/Works" && !small && square) {
    const title =
      input.albumTitles[input.contentImageIndex] ??
      context.nearbyHeadings[0] ??
      alt;
    const cleanTitle = title?.replace(/^​+/, "").trim();
    const renderedWide = (context.rendered?.renderedWidth ?? 0) >= 100;
    return {
      role: "album-jacket",
      confidence: cleanTitle && hasRendered && renderedWide ? "high" : cleanTitle ? "high" : "medium",
      relatedContentLabel: cleanTitle || undefined,
      notes: [
        "Square jacket image on Discography page; map to nearest album heading.",
        ...(hasRendered ? ["Rendered jacket size/position captured from live DOM."] : []),
      ],
    };
  }

  if (pageType === "Discography/Works" && !small) {
    const title = input.albumTitles[input.contentImageIndex] ?? context.nearbyHeadings[0];
    return {
      role: "discography-cover",
      confidence: title ? "medium" : "low",
      relatedContentLabel: title?.replace(/^​+/, "").trim(),
      notes: ["Discography artwork; confirm aspect ratio in screenshot."],
    };
  }

  if (pageType === "Links" && small) {
    return {
      role: "decorative",
      confidence: "medium",
      notes: ["Small image on Links page; often icon or decorative."],
    };
  }

  if (pageType === "Links" && !small) {
    return {
      role: "content-image",
      confidence: "low",
      notes: ["Non-icon image on Links page; review screenshot."],
    };
  }

  if (small && !blobIncludes(nearbyBlob, SCHEDULE_TEXT_PATTERNS)) {
    return {
      role: "decorative",
      confidence: "medium",
      notes: ["Small image without strong content association."],
    };
  }

  if (pageType === "Discography/Works" && blobIncludes(nearbyBlob, DISCO_TEXT_PATTERNS) && square) {
    return {
      role: "album-jacket",
      confidence: "low",
      relatedContentLabel: context.nearbyHeadings[0],
      notes: ["Discography-related text near image."],
    };
  }

  if (pageType === "Contact" && !small) {
    return {
      role: "content-image",
      confidence: "medium",
      relatedContentLabel: alt || "Contact page image",
      notes: ["Non-icon image on Contact page; verify in screenshot (not a discography jacket)."],
    };
  }

  if (large) {
    return {
      role: "content-image",
      confidence: "low",
      notes: ["Large image without stronger role match."],
    };
  }

  return {
    role: "unknown",
    confidence: "low",
    notes: ["Needs human/AI review with screenshot."],
  };
}

export function buildAssetCandidate(
  input: InferenceInput,
): AssetCandidate {
  const inferred = inferAssetRole(input);
  const dims = pickDimensions(input.context);
  return {
    imageUrl: input.context.imageUrl,
    originalSrc: input.context.originalSrc,
    alt: input.context.alt || undefined,
    width: dims.width,
    height: dims.height,
    pageUrl: input.pageUrl,
    pageRoute: input.pageRoute,
    pageType: input.pageType,
    nearbyHeadings: input.context.nearbyHeadings,
    nearbyText: input.context.nearbyText,
    linkedHref: input.context.linkedHref,
    inferredRole: inferred.role,
    relatedContentLabel: inferred.relatedContentLabel,
    confidence: inferred.confidence,
    notes: inferred.notes,
    sources: input.context.sources.length > 0 ? input.context.sources : undefined,
    rendered: input.context.rendered,
  };
}

export function buildPageAssetCandidates(options: {
  pageType: PageType;
  pageUrl: string;
  pageRoute: string;
  metadata: AuditMetadata;
  textSample: string;
  html: string;
  renderedAssets?: RenderedAssetCapture[];
}): AssetCandidate[] {
  const contexts = extractContextsMerged(
    options.html,
    options.pageUrl,
    options.metadata,
    options.renderedAssets ?? options.metadata.renderedAssets ?? [],
  );
  const scheduleEvents = parseScheduleEventsFromText(options.textSample, options.pageRoute);
  const albumTitles = parseAlbumTitlesFromText(
    options.textSample,
    [...options.metadata.h2, ...options.metadata.h3],
  );

  let albumImageIndex = 0;
  const candidates: AssetCandidate[] = [];

  for (let index = 0; index < contexts.length; index++) {
    const context = contexts[index];
    const small = isSmallIcon(context.width, context.height);
    const isDiscographyJacket =
      options.pageType === "Discography/Works" &&
      !small &&
      !SNS_ALT_PATTERNS.test(context.alt);

    const candidate = buildAssetCandidate({
      context,
      pageType: options.pageType,
      pageUrl: options.pageUrl,
      pageRoute: options.pageRoute,
      metadata: options.metadata,
      textSample: options.textSample,
      domIndex: index,
      totalImages: contexts.length,
      contentImageIndex: isDiscographyJacket ? albumImageIndex : 0,
      scheduleEvents,
      albumTitles,
    });

    if (isDiscographyJacket) albumImageIndex += 1;

    candidates.push(candidate);
  }

  return candidates;
}

function addSource(ctx: ImageHtmlContext, tag: AssetSourceTag): void {
  if (!ctx.sources.includes(tag)) ctx.sources.push(tag);
}

function mergeContextEntry(existing: ImageHtmlContext, incoming: ImageHtmlContext): void {
  existing.nearbyHeadings = mergeTextLists(
    incoming.nearbyHeadings,
    existing.nearbyHeadings,
    5,
  );
  existing.nearbyText = mergeTextLists(incoming.nearbyText, existing.nearbyText, 8);

  if (!existing.alt && incoming.alt) existing.alt = incoming.alt;
  if (!existing.width && incoming.width) existing.width = incoming.width;
  if (!existing.height && incoming.height) existing.height = incoming.height;
  if (!existing.linkedHref && incoming.linkedHref) existing.linkedHref = incoming.linkedHref;
  if (!existing.classNames && incoming.classNames) existing.classNames = incoming.classNames;

  if (incoming.rendered) {
    existing.rendered = incoming.rendered;
  }

  for (const tag of incoming.sources) {
    addSource(existing, tag);
  }

  if (incoming.domIndex < existing.domIndex) {
    existing.domIndex = incoming.domIndex;
  }
}

function contextFromRendered(capture: RenderedAssetCapture, domIndex: number): ImageHtmlContext {
  return {
    imageUrl: capture.imageUrl,
    originalSrc: capture.src ?? capture.currentSrc ?? capture.imageUrl,
    alt: capture.alt ?? "",
    width: capture.naturalWidth ?? capture.renderedWidth ?? null,
    height: capture.naturalHeight ?? capture.renderedHeight ?? null,
    nearbyHeadings: capture.nearbyHeadings,
    nearbyText: capture.nearbyText,
    linkedHref: capture.linkedHref ?? null,
    domIndex,
    classNames: "",
    sources: [sourceTagFromRendered(capture.source)],
    rendered: renderedFromCapture(capture),
  };
}

function extractContextsMerged(
  html: string,
  baseUrl: string,
  metadata: AuditMetadata,
  renderedAssets: RenderedAssetCapture[],
): ImageHtmlContext[] {
  const fromHtml = extractImageContextsFromHtml(html, baseUrl);
  const byUrl = new Map<string, ImageHtmlContext>();

  for (const ctx of fromHtml) {
    const entry: ImageHtmlContext = { ...ctx, sources: ["html-img"] };
    byUrl.set(ctx.imageUrl, entry);
  }

  for (const [index, image] of metadata.images.entries()) {
    const existing = byUrl.get(image.src);
    if (existing) {
      if (!existing.width && image.width) existing.width = image.width;
      if (!existing.height && image.height) existing.height = image.height;
      if (!existing.alt && image.alt) existing.alt = image.alt;
      addSource(existing, "json-image");
      continue;
    }

    byUrl.set(image.src, {
      imageUrl: image.src,
      originalSrc: image.src,
      alt: image.alt ?? "",
      width: image.width,
      height: image.height,
      nearbyHeadings: [],
      nearbyText: [],
      linkedHref: null,
      domIndex: fromHtml.length + index,
      classNames: "",
      sources: ["json-image"],
    });
  }

  for (const [index, capture] of renderedAssets.entries()) {
    const incoming = contextFromRendered(capture, 10_000 + index);
    const existing = byUrl.get(capture.imageUrl);
    if (existing) {
      mergeContextEntry(existing, incoming);
    } else {
      byUrl.set(capture.imageUrl, incoming);
    }
  }

  return [...byUrl.values()].sort((a, b) => a.domIndex - b.domIndex);
}

import {
  dateHintFromAltOrUrl,
  parseScheduleEventsFromText,
  type ScheduleEventCandidate,
} from "./asset-context.ts";
import type {
  AssetCandidate,
  AssetMap,
  Confidence,
  CrossPageMatch,
  EventImageMatchingStats,
  EventMatch,
  EventMatchSkipReason,
  RenderedEventBlock,
  ScheduleCrossPageCandidate,
} from "./asset-map-types.ts";
import type { PageType } from "./page-analysis.ts";
import type { EnrichedAuditPage } from "./page-analysis.ts";
import {
  findNearestEventBlock,
  RENDERED_EVENT_BLOCK_MAX_DELTA_Y,
} from "./rendered-event-blocks.ts";

const PLACEHOLDER_PATTERNS = [
  /no\s*photo/i,
  /NO%20PHOTO/i,
  /no-photo/i,
  /nophoto/i,
  /\bplaceholder\b/i,
  /image\s*pending/i,
  /写真なし/,
  /flyer\s*\/\s*image\s*pending/i,
];

const LIVE_SIGNAL_PATTERN =
  /\b(?:live|ライブ)\b|open|start|charge|会場|出演|料金|住所|電話|☎|tel|website|予約|sold\s*out/i;

const DATE_IN_TEXT_PATTERN =
  /(?:20\d{2}[.\-/]\d{2}[.\-/]\d{2})|(?:\d{1,2}月\d{1,2}日)|(?:\d{1,2}\/\d{1,2})/;

const NAV_FOOTER_PATTERN =
  /\b(footer|header|\bnav\b|social|sns|\bicon\b|menu|logo)\b/i;

const SNS_HOST_PATTERN =
  /facebook\.com|instagram\.com|twitter\.com|x\.com|youtube\.com|tiktok\.com|linktr\.ee/i;

const EXCLUDED_EVENT_MATCH_ROLES = new Set([
  "sns-icon",
  "logo",
  "decorative",
  "profile-photo",
  "hero",
  "album-jacket",
  "discography-cover",
]);

const Y_POSITION_MAX_DELTA = 500;
const MIN_RENDERED_WIDTH = 120;
const MIN_RENDERED_HEIGHT = 80;

const eventsTextByRoute = new Map<string, string>();
const renderedBlocksByRoute = new Map<string, RenderedEventBlock[]>();

function blockKey(block: RenderedEventBlock): string {
  return block.eventDate ?? block.eventDateLabel ?? block.text.slice(0, 40);
}

function imageCenterY(candidate: AssetCandidate): number | null {
  const y = candidate.rendered?.y;
  const height =
    candidate.rendered?.renderedHeight ??
    candidate.rendered?.naturalHeight ??
    candidate.height ??
    0;
  if (y == null || !height) return null;
  return y + height / 2;
}

function altDateIso(candidate: AssetCandidate): string | null {
  const hint = dateHintFromAltOrUrl(candidate.alt ?? "", candidate.imageUrl);
  if (!hint) return null;
  return hint.replace(/\./g, "-");
}

function appendAltDateConflictWarnings(
  match: EventMatch,
  candidate: AssetCandidate,
  block: RenderedEventBlock,
): boolean {
  const altIso = altDateIso(candidate);
  if (!altIso || !block.eventDate || altIso === block.eventDate) {
    return false;
  }
  const warnings = new Set(match.warnings ?? []);
  warnings.add("alt-date-conflict");
  warnings.add(`alt-date=${altIso}`);
  warnings.add(`rendered-event-date=${block.eventDate}`);
  match.warnings = [...warnings];
  return true;
}

function buildRenderedEventMatch(
  block: RenderedEventBlock,
  pageRoute: string,
  matchMethod: "rendered-event-block" | "rendered-order",
  deltaY?: number,
): EventMatch {
  const matchedText = [
    block.eventDateLabel,
    block.eventTitle,
    block.venue,
    deltaY != null ? `deltaY=${Math.round(deltaY)}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return {
    eventDate: block.eventDate,
    eventDateLabel: block.eventDateLabel,
    eventTitle: block.eventTitle,
    venue: block.venue,
    sourcePage: pageRoute,
    matchMethod,
    matchConfidence: block.confidence === "low" ? "medium" : block.confidence,
    matchedText,
  };
}

function assignEventMatchToCandidate(
  candidate: AssetCandidate,
  match: EventMatch,
  pageType: PageType,
): boolean {
  if (!shouldAcceptEventMatch(candidate, match, pageType)) return false;
  candidate.eventMatch = match;
  if (!candidate.relatedContentLabel && match.eventDateLabel) {
    candidate.relatedContentLabel = match.eventTitle
      ? `${match.eventDateLabel} / ${match.eventTitle}`
      : match.eventDateLabel;
  }
  return true;
}

function matchImageToRenderedBlock(
  candidate: AssetCandidate,
  blocks: RenderedEventBlock[],
  usedBlockKeys: Set<string>,
  pageRoute: string,
  pageType: PageType,
  stats: EventImageMatchingStats,
): boolean {
  const y = candidate.rendered?.y;
  const height =
    candidate.rendered?.renderedHeight ??
    candidate.rendered?.naturalHeight ??
    candidate.height ??
    0;
  if (y == null || !height) return false;

  const nearest = findNearestEventBlock(y, height, blocks, usedBlockKeys);
  if (!nearest || nearest.deltaY > RENDERED_EVENT_BLOCK_MAX_DELTA_Y) {
    return false;
  }

  const match = buildRenderedEventMatch(
    nearest.block,
    pageRoute,
    "rendered-event-block",
    nearest.deltaY,
  );

  if (appendAltDateConflictWarnings(match, candidate, nearest.block)) {
    stats.altDateConflicts = (stats.altDateConflicts ?? 0) + 1;
    if (match.matchConfidence === "high") {
      match.matchConfidence = "high";
    }
  }

  if (!assignEventMatchToCandidate(candidate, match, pageType)) {
    return false;
  }

  usedBlockKeys.add(blockKey(nearest.block));
  return true;
}

function matchPlaceholderToRenderedBlock(
  candidate: AssetCandidate,
  blocks: RenderedEventBlock[],
  usedBlockKeys: Set<string>,
  pageRoute: string,
): void {
  if (!candidate.warnings?.includes("no-photo-placeholder")) return;

  const y = candidate.rendered?.y;
  const height =
    candidate.rendered?.renderedHeight ??
    candidate.rendered?.naturalHeight ??
    candidate.height ??
    0;
  if (y == null || !height) return;

  const nearest = findNearestEventBlock(y, height, blocks, usedBlockKeys);
  if (!nearest || nearest.deltaY > RENDERED_EVENT_BLOCK_MAX_DELTA_Y) return;

  const match = buildRenderedEventMatch(
    nearest.block,
    pageRoute,
    "rendered-event-block",
    nearest.deltaY,
  );
  match.matchConfidence = "low";
  match.warnings = [...(match.warnings ?? []), "no-photo-placeholder"];

  candidate.eventMatch = match;
  if (!candidate.relatedContentLabel && match.eventDateLabel) {
    candidate.relatedContentLabel = match.eventDateLabel;
  }

  usedBlockKeys.add(blockKey(nearest.block));
}

function applyRenderedOrderMatching(
  candidates: AssetCandidate[],
  blocks: RenderedEventBlock[],
  usedBlockKeys: Set<string>,
  pageRoute: string,
  pageType: PageType,
  stats: EventImageMatchingStats,
): void {
  const flyers = candidates
    .filter(
      (item) =>
        !item.eventMatch &&
        !isPlaceholderAsset(item.alt ?? "", item.imageUrl, joinBlob(item)) &&
        item.rendered?.y != null &&
        (item.inferredRole === "schedule-flyer" || hasDateInAltOrUrl(item)),
    )
    .sort((a, b) => (a.rendered?.y ?? 0) - (b.rendered?.y ?? 0));

  const availableBlocks = blocks
    .filter((block) => !usedBlockKeys.has(blockKey(block)))
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

  const pairCount = Math.min(flyers.length, availableBlocks.length);
  for (let index = 0; index < pairCount; index++) {
    const flyer = flyers[index];
    const block = availableBlocks[index];
    const match = buildRenderedEventMatch(block, pageRoute, "rendered-order");
    if (!assignEventMatchToCandidate(flyer, match, pageType)) continue;
    usedBlockKeys.add(blockKey(block));
    stats.renderedEventMatches = (stats.renderedEventMatches ?? 0) + 1;
  }
}

function applyRenderedEventBlockMatchingForPage(
  candidates: AssetCandidate[],
  blocks: RenderedEventBlock[],
  pageRoute: string,
  pageType: PageType,
  stats: EventImageMatchingStats,
): void {
  if (blocks.length === 0) return;

  const usedBlockKeys = new Set<string>();

  for (const candidate of candidates) {
    demotePlaceholderFlyers(candidate);
    if (candidate.warnings?.includes("no-photo-placeholder")) {
      matchPlaceholderToRenderedBlock(candidate, blocks, usedBlockKeys, pageRoute);
      if (candidate.eventMatch?.matchMethod === "rendered-event-block") {
        stats.noPhotoEventMatches = (stats.noPhotoEventMatches ?? 0) + 1;
      }
      continue;
    }

    const skipCheck = evaluateEventMatchSkip(candidate);
    if (skipCheck.skip) {
      candidate.eventMatch = undefined;
      continue;
    }

    if (!shouldAttemptEventMatch(candidate, pageType)) {
      candidate.eventMatch = undefined;
      continue;
    }

    if (candidate.rendered?.y != null) {
      matchImageToRenderedBlock(
        candidate,
        blocks,
        usedBlockKeys,
        pageRoute,
        pageType,
        stats,
      );
    }
  }
}

export function isPlaceholderAsset(alt: string, url: string, nearbyBlob = ""): boolean {
  const blob = `${alt} ${url} ${nearbyBlob}`;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(blob));
}

export function isReportableEventMatch(candidate: AssetCandidate): boolean {
  if (!candidate.eventMatch) return false;
  if (candidate.warnings?.includes("no-photo-placeholder")) return false;
  if (candidate.inferredRole !== "schedule-flyer") return false;
  if (candidate.eventMatch.matchConfidence === "low") return false;
  if (candidate.eventMatch.matchMethod === "manual-review") return false;
  return true;
}

function normalizeRoute(route: string): string {
  if (route === "/" || route === "") return "/";
  return route.endsWith("/") ? route : `${route}/`;
}

function joinBlob(candidate: AssetCandidate): string {
  return [
    candidate.alt ?? "",
    candidate.imageUrl,
    candidate.rendered?.selectorHint ?? "",
    ...candidate.nearbyHeadings,
    ...candidate.nearbyText,
    ...candidate.notes,
  ]
    .join(" ")
    .toLowerCase();
}

function imageDimensions(candidate: AssetCandidate): { width: number; height: number } {
  const width =
    candidate.rendered?.renderedWidth ??
    candidate.rendered?.naturalWidth ??
    candidate.width ??
    0;
  const height =
    candidate.rendered?.renderedHeight ??
    candidate.rendered?.naturalHeight ??
    candidate.height ??
    0;
  return { width: width ?? 0, height: height ?? 0 };
}

function isTooSmallImage(candidate: AssetCandidate): boolean {
  const { width, height } = imageDimensions(candidate);
  if (width <= 0 && height <= 0) return false;
  return (width > 0 && width < MIN_RENDERED_WIDTH) || (height > 0 && height < MIN_RENDERED_HEIGHT);
}

function isSnsLinkedHref(href: string | null | undefined): boolean {
  if (!href) return false;
  return SNS_HOST_PATTERN.test(href);
}

function hasNavFooterNoise(candidate: AssetCandidate): boolean {
  return NAV_FOOTER_PATTERN.test(joinBlob(candidate));
}

function hasDateInAltOrUrl(candidate: AssetCandidate): boolean {
  return Boolean(dateHintFromAltOrUrl(candidate.alt ?? "", candidate.imageUrl));
}

function hasHomeWeeklyScheduleContext(candidate: AssetCandidate): boolean {
  const blob = joinBlob(candidate);
  return /this week'?s live schedule|週間|weekly schedule/i.test(blob);
}

function hasStrongScheduleContext(
  candidate: AssetCandidate,
  match?: EventMatch,
): boolean {
  if (candidate.inferredRole === "schedule-flyer") return true;
  if (hasDateInAltOrUrl(candidate)) return true;
  if (hasHomeWeeklyScheduleContext(candidate)) return true;
  if (match?.matchMethod === "alt-text-date") return true;
  if (match?.matchConfidence === "high") return true;
  return false;
}

function isMediumOrLargeImage(candidate: AssetCandidate): boolean {
  const { width, height } = imageDimensions(candidate);
  return width >= MIN_RENDERED_WIDTH && height >= MIN_RENDERED_HEIGHT;
}

function hasLiveContextInBlob(blob: string): boolean {
  return LIVE_SIGNAL_PATTERN.test(blob);
}

function evaluateEventMatchSkip(
  candidate: AssetCandidate,
): { skip: boolean; reason?: EventMatchSkipReason } {
  const blob = joinBlob(candidate);

  if (isPlaceholderAsset(candidate.alt ?? "", candidate.imageUrl, blob)) {
    return { skip: false };
  }

  if (candidate.inferredRole === "sns-icon") {
    return { skip: true, reason: "sns-icon" };
  }

  if (EXCLUDED_EVENT_MATCH_ROLES.has(candidate.inferredRole)) {
    return { skip: true, reason: "excluded-role" };
  }

  if (isSnsLinkedHref(candidate.linkedHref)) {
    return { skip: true, reason: "sns-link" };
  }

  if (isTooSmallImage(candidate)) {
    return { skip: true, reason: "small-image" };
  }

  if (hasNavFooterNoise(candidate) && !hasStrongScheduleContext(candidate)) {
    return { skip: true, reason: "nav-footer" };
  }

  return { skip: false };
}

function shouldAttemptEventMatch(
  candidate: AssetCandidate,
  pageType: PageType,
): boolean {
  const allowedRoles = new Set(["schedule-flyer", "content-image", "unknown"]);
  if (!allowedRoles.has(candidate.inferredRole)) return false;
  if (!isScheduleLikePage(pageType)) return false;

  const blob = joinBlob(candidate);
  if (isPlaceholderAsset(candidate.alt ?? "", candidate.imageUrl, blob)) {
    return false;
  }

  if (candidate.inferredRole === "schedule-flyer") return true;
  if (hasDateInAltOrUrl(candidate)) return true;
  if (DATE_IN_TEXT_PATTERN.test(blob) && hasLiveContextInBlob(blob)) return true;

  return false;
}

function shouldAcceptEventMatch(
  candidate: AssetCandidate,
  match: EventMatch,
  pageType: PageType,
): boolean {
  if (match.warnings?.includes("no-photo-placeholder")) return false;

  if (
    match.matchMethod === "rendered-event-block" ||
    match.matchMethod === "rendered-order"
  ) {
    if (match.matchConfidence === "low") return false;
    if (match.eventDate || match.eventDateLabel) return true;
    return false;
  }

  if (candidate.inferredRole === "schedule-flyer") {
    if (match.matchMethod === "alt-text-date") return true;
    if (match.matchConfidence === "high") return true;
    if (match.matchConfidence === "medium" && match.eventDate) return true;
    return false;
  }

  if (hasDateInAltOrUrl(candidate)) return true;

  const blob = joinBlob(candidate);
  const hasDate = Boolean(match.eventDate || DATE_IN_TEXT_PATTERN.test(blob));
  const hasLive = hasLiveContextInBlob(blob);
  const schedulePage = pageType === "Home" || pageType === "Schedule Month";

  if (
    schedulePage &&
    isMediumOrLargeImage(candidate) &&
    hasDate &&
    hasLive &&
    match.matchConfidence !== "low"
  ) {
    return true;
  }

  return false;
}

function findEventByIsoDate(
  events: ScheduleEventCandidate[],
  isoDate: string,
): ScheduleEventCandidate | undefined {
  return events.find((event) => event.eventDate === isoDate);
}

function findEventByDateLabel(
  events: ScheduleEventCandidate[],
  label: string,
): ScheduleEventCandidate | undefined {
  const normalized = label.trim();
  return events.find(
    (event) =>
      event.eventDateLabel === normalized ||
      event.eventDateLabel.startsWith(normalized) ||
      normalized.includes(event.eventDateLabel),
  );
}

function textOverlapsEvent(nearbyBlob: string, event: ScheduleEventCandidate): string[] {
  const matched: string[] = [];
  if (event.eventDateLabel && nearbyBlob.includes(event.eventDateLabel.toLowerCase())) {
    matched.push(event.eventDateLabel);
  }
  if (event.eventTitle) {
    const title = event.eventTitle.toLowerCase();
    if (title.length >= 3 && nearbyBlob.includes(title)) {
      matched.push(event.eventTitle);
    }
  }
  if (event.venue) {
    const venue = event.venue.toLowerCase();
    if (venue.length >= 3 && nearbyBlob.includes(venue)) {
      matched.push(event.venue);
    }
  }
  if (event.eventDate && nearbyBlob.includes(event.eventDate)) {
    matched.push(event.eventDate);
  }
  if (event.eventDate && nearbyBlob.includes(event.eventDate.replace(/-/g, "."))) {
    matched.push(event.eventDate.replace(/-/g, "."));
  }
  return matched;
}

function buildEventMatch(
  candidate: AssetCandidate,
  events: ScheduleEventCandidate[],
  pageRoute: string,
): EventMatch | undefined {
  const nearbyBlob = joinBlob(candidate);

  const altUrlDate = dateHintFromAltOrUrl(candidate.alt ?? "", candidate.imageUrl);
  if (altUrlDate) {
    const iso = altUrlDate.replace(/\./g, "-");
    const event = findEventByIsoDate(events, iso) ?? findEventByDateLabel(events, altUrlDate);
    const matchedText = [altUrlDate];
    if (candidate.alt) matchedText.push(candidate.alt);
    return {
      eventDate: event?.eventDate ?? iso,
      eventDateLabel: event?.eventDateLabel ?? altUrlDate,
      eventTitle: event?.eventTitle,
      venue: event?.venue,
      sourcePage: pageRoute,
      matchMethod: "alt-text-date",
      matchConfidence: event ? "high" : "medium",
      matchedText,
    };
  }

  for (const event of events) {
    const matchedText = textOverlapsEvent(nearbyBlob, event);
    const hasScheduleSignals = hasLiveContextInBlob(nearbyBlob);
    if (matchedText.length >= 2 || (matchedText.length >= 1 && hasScheduleSignals)) {
      return {
        eventDate: event.eventDate,
        eventDateLabel: event.eventDateLabel,
        eventTitle: event.eventTitle,
        venue: event.venue,
        sourcePage: pageRoute,
        matchMethod: "same-card-text",
        matchConfidence: matchedText.length >= 2 ? "high" : "medium",
        matchedText,
      };
    }
  }

  for (const event of events) {
    const matchedText = textOverlapsEvent(nearbyBlob, event);
    if (matchedText.length > 0 && hasLiveContextInBlob(nearbyBlob)) {
      return {
        eventDate: event.eventDate,
        eventDateLabel: event.eventDateLabel,
        eventTitle: event.eventTitle,
        venue: event.venue,
        sourcePage: pageRoute,
        matchMethod: "nearby-date-text",
        matchConfidence: "medium",
        matchedText,
      };
    }
  }

  return undefined;
}

function applyYPositionMatching(
  candidates: AssetCandidate[],
  events: ScheduleEventCandidate[],
  pageRoute: string,
  pageType: PageType,
): void {
  const flyers = candidates.filter(
    (item) =>
      item.inferredRole === "schedule-flyer" &&
      item.rendered?.y != null &&
      !item.eventMatch &&
      !isPlaceholderAsset(item.alt ?? "", item.imageUrl, joinBlob(item)),
  );
  const liveEvents = events.filter((event) => event.hasLiveSignals);
  if (flyers.length === 0 || liveEvents.length === 0) return;

  const sortedFlyers = [...flyers].sort(
    (a, b) => (a.rendered?.y ?? 0) - (b.rendered?.y ?? 0),
  );
  const pairCount = Math.min(sortedFlyers.length, liveEvents.length);

  for (let index = 0; index < pairCount; index++) {
    const flyer = sortedFlyers[index];
    const event = liveEvents[index];
    if (flyer.eventMatch) continue;

    const prevY = index > 0 ? (sortedFlyers[index - 1].rendered?.y ?? 0) : null;
    const eventPrev = index > 0 ? liveEvents[index - 1] : null;
    if (
      prevY != null &&
      eventPrev?.eventDate &&
      event.eventDate &&
      Math.abs((flyer.rendered?.y ?? 0) - prevY) > Y_POSITION_MAX_DELTA
    ) {
      continue;
    }

    const match: EventMatch = {
      eventDate: event.eventDate,
      eventDateLabel: event.eventDateLabel,
      eventTitle: event.eventTitle,
      venue: event.venue,
      sourcePage: pageRoute,
      matchMethod: "nearby-y-position",
      matchConfidence: "medium",
      matchedText: [`rendered.y=${flyer.rendered?.y}`, event.eventDateLabel],
    };

    if (!shouldAcceptEventMatch(flyer, match, pageType)) continue;

    flyer.eventMatch = match;
    if (!flyer.relatedContentLabel && event.eventDateLabel) {
      flyer.relatedContentLabel = event.eventTitle
        ? `${event.eventDateLabel} / ${event.eventTitle}`
        : event.eventDateLabel;
    }
  }
}

function demotePlaceholderFlyers(candidate: AssetCandidate): void {
  const blob = joinBlob(candidate);
  if (!isPlaceholderAsset(candidate.alt ?? "", candidate.imageUrl, blob)) return;

  const warnings = new Set(candidate.warnings ?? []);
  warnings.add("no-photo-placeholder");
  candidate.warnings = [...warnings];

  if (candidate.inferredRole === "schedule-flyer") {
    candidate.inferredRole = "decorative";
    if (candidate.confidence === "high") {
      candidate.confidence = "medium";
    }
    candidate.notes = [
      ...candidate.notes.filter((note) => !/flyer candidate/i.test(note)),
      "Placeholder asset; do not use as schedule flyer.",
      "Site uses explicit NO PHOTO or similar; prefer text-only card or owner-provided flyer.",
    ];
    candidate.relatedContentLabel =
      candidate.relatedContentLabel ?? "NO PHOTO placeholder";
  }

  candidate.eventMatch = {
    sourcePage: candidate.pageRoute,
    matchMethod: "manual-review",
    matchConfidence: "low",
    warnings: ["no-photo-placeholder"],
  };
}

function isScheduleLikePage(pageType: string): boolean {
  return (
    pageType === "Home" ||
    pageType === "Schedule Month" ||
    pageType === "Schedule"
  );
}

function isAcceptedHomeFlyer(img: AssetCandidate): boolean {
  return (
    img.inferredRole === "schedule-flyer" &&
    isReportableEventMatch(img) &&
    !img.warnings?.includes("no-photo-placeholder")
  );
}

function applyCrossPageMatching(assetMap: AssetMap): number {
  const homePage = assetMap.pages.find((page) => normalizeRoute(page.route) === "/");
  if (!homePage) return 0;

  const homeFlyers = homePage.images.filter(isAcceptedHomeFlyer);

  let count = 0;

  for (const monthPage of assetMap.pages) {
    if (!monthPage.pageType.includes("Schedule Month")) continue;

    const monthRoute = normalizeRoute(monthPage.route);
    const monthEvents = parseScheduleEventsFromText(
      eventsTextByRoute.get(monthRoute) ?? "",
      monthRoute,
    );
    const candidatesForMonth: ScheduleCrossPageCandidate[] = [];

    for (const event of monthEvents) {
      if (!event.eventDate) continue;
      const hasLocalFlyer = monthPage.images.some(
        (img) =>
          img.inferredRole === "schedule-flyer" &&
          isReportableEventMatch(img) &&
          img.eventMatch?.eventDate === event.eventDate,
      );
      if (hasLocalFlyer) continue;

      const homeFlyer = homeFlyers.find(
        (img) => img.eventMatch?.eventDate === event.eventDate,
      );
      if (!homeFlyer) continue;

      const targetLabel = event.eventTitle
        ? `${event.eventDateLabel} / ${event.eventTitle}`
        : event.eventDateLabel;

      const hasAltConflict = homeFlyer.eventMatch?.warnings?.includes("alt-date-conflict");
      const crossMatch: CrossPageMatch = {
        targetPageRoute: monthRoute,
        targetEventDate: event.eventDate,
        targetEventLabel: targetLabel,
        confidence: hasAltConflict ? "medium" : "medium",
        note: hasAltConflict
          ? "Home weekly schedule flyer may correspond to this monthly schedule event (alt-date-conflict — review recommended)."
          : "Home weekly schedule flyer may correspond to this monthly schedule event.",
      };

      homeFlyer.crossPageMatches = [...(homeFlyer.crossPageMatches ?? []), crossMatch];

      candidatesForMonth.push({
        eventDate: event.eventDate,
        eventLabel: targetLabel,
        sourcePageRoute: "/",
        sourceImageUrl: homeFlyer.imageUrl,
        matchMethod: "cross-page-date",
        confidence: "medium",
        note: crossMatch.note,
      });

      count += 1;
    }

    if (candidatesForMonth.length > 0) {
      monthPage.scheduleCrossPageCandidates = candidatesForMonth;
    }
  }

  return count;
}

function recordSkip(
  stats: EventImageMatchingStats,
  reason: EventMatchSkipReason,
): void {
  stats.eventMatchSkipped += 1;
  stats.eventMatchSkippedReasons[reason] =
    (stats.eventMatchSkippedReasons[reason] ?? 0) + 1;
}

function createMatchingStats(): EventImageMatchingStats {
  return {
    imagesWithEventMatch: 0,
    crossPageMatchCount: 0,
    noPhotoPlaceholderCount: 0,
    scheduleFlyersWithEventMatch: 0,
    eventMatchCandidates: 0,
    eventMatchAccepted: 0,
    eventMatchSkipped: 0,
    eventMatchSkippedReasons: {},
  };
}

export function applyEventImageMatching(
  assetMap: AssetMap,
  enrichedPages: EnrichedAuditPage[],
): AssetMap {
  eventsTextByRoute.clear();
  renderedBlocksByRoute.clear();

  for (const page of enrichedPages) {
    const route = normalizeRoute(page.route);
    eventsTextByRoute.set(route, page.textSample);
    const blocks = page.metadata.renderedEventBlocks ?? [];
    if (blocks.length > 0) {
      renderedBlocksByRoute.set(route, blocks);
    }
  }

  for (const page of assetMap.pages) {
    if (page.renderedEventBlocks && page.renderedEventBlocks.length > 0) {
      renderedBlocksByRoute.set(normalizeRoute(page.route), page.renderedEventBlocks);
    }
  }

  const stats = createMatchingStats();
  stats.renderedEventBlocks = assetMap.pages
    .filter(
      (page) =>
        page.pageType === "Home" ||
        page.pageType.includes("Schedule Month"),
    )
    .reduce((sum, page) => sum + (page.renderedEventBlocks?.length ?? 0), 0);

  for (const page of assetMap.pages) {
    const pageRoute = normalizeRoute(page.route);
    const pageType = page.pageType as PageType;
    if (!isScheduleLikePage(pageType)) continue;

    const events = parseScheduleEventsFromText(
      eventsTextByRoute.get(pageRoute) ?? "",
      pageRoute,
    );

    const blocks = renderedBlocksByRoute.get(pageRoute) ?? page.renderedEventBlocks ?? [];

    if (blocks.length > 0) {
      applyRenderedEventBlockMatchingForPage(
        page.images,
        blocks,
        pageRoute,
        pageType,
        stats,
      );
    }

    for (const candidate of page.images) {
      if (candidate.eventMatch?.matchMethod === "rendered-event-block") {
        continue;
      }
      if (candidate.eventMatch?.matchMethod === "rendered-order") {
        continue;
      }

      const wasPlaceholder = isPlaceholderAsset(
        candidate.alt ?? "",
        candidate.imageUrl,
        joinBlob(candidate),
      );

      if (!candidate.warnings?.includes("no-photo-placeholder")) {
        demotePlaceholderFlyers(candidate);
      }

      if (wasPlaceholder || candidate.warnings?.includes("no-photo-placeholder")) {
        if (
          !candidate.eventMatch &&
          blocks.length > 0 &&
          candidate.rendered?.y != null
        ) {
          const usedKeys = new Set<string>();
          matchPlaceholderToRenderedBlock(candidate, blocks, usedKeys, pageRoute);
          if (candidate.eventMatch) {
            stats.noPhotoEventMatches = (stats.noPhotoEventMatches ?? 0) + 1;
          }
        }
        continue;
      }

      if (candidate.eventMatch) continue;

      const skipCheck = evaluateEventMatchSkip(candidate);
      if (skipCheck.skip && skipCheck.reason) {
        candidate.eventMatch = undefined;
        recordSkip(stats, skipCheck.reason);
        continue;
      }

      if (!shouldAttemptEventMatch(candidate, pageType)) {
        candidate.eventMatch = undefined;
        recordSkip(stats, "weak-context");
        continue;
      }

      stats.eventMatchCandidates += 1;
      const match = buildEventMatch(candidate, events, pageRoute);

      if (!match) {
        recordSkip(stats, "weak-context");
        continue;
      }

      if (!shouldAcceptEventMatch(candidate, match, pageType)) {
        recordSkip(stats, "weak-context");
        continue;
      }

      candidate.eventMatch = match;
      stats.eventMatchAccepted += 1;

      if (
        candidate.inferredRole === "schedule-flyer" &&
        match.matchConfidence !== "low"
      ) {
        if (!candidate.relatedContentLabel && match.eventDateLabel) {
          candidate.relatedContentLabel = match.eventTitle
            ? `${match.eventDateLabel} / ${match.eventTitle}`
            : match.eventDateLabel;
        }
      }
    }

    if (blocks.length > 0) {
      const usedBlockKeys = new Set(
        page.images
          .filter((img) => img.eventMatch?.matchMethod === "rendered-event-block")
          .map((img) => img.eventMatch?.eventDate ?? img.eventMatch?.eventDateLabel ?? "")
          .filter(Boolean),
      );
      applyRenderedOrderMatching(
        page.images,
        blocks,
        usedBlockKeys,
        pageRoute,
        pageType,
        stats,
      );
    } else {
      applyYPositionMatching(page.images, events, pageRoute, pageType);
    }
  }

  assetMap.renderedEventBlocks = assetMap.pages.flatMap(
    (page) => page.renderedEventBlocks ?? [],
  );

  stats.crossPageMatchCount = applyCrossPageMatching(assetMap);

  stats.eventMatchAccepted = assetMap.pages
    .flatMap((p) => p.images)
    .filter(isReportableEventMatch).length;

  stats.scheduleFlyersWithEventMatch = stats.eventMatchAccepted;

  stats.noPhotoPlaceholderCount = assetMap.pages
    .flatMap((page) => page.images)
    .filter((img) => img.warnings?.includes("no-photo-placeholder")).length;

  stats.imagesWithEventMatch = stats.eventMatchAccepted;

  stats.renderedEventMatches = assetMap.pages
    .flatMap((p) => p.images)
    .filter(
      (img) =>
        img.eventMatch?.matchMethod === "rendered-event-block" ||
        img.eventMatch?.matchMethod === "rendered-order",
    ).length;

  stats.noPhotoEventMatches = assetMap.pages
    .flatMap((p) => p.images)
    .filter(
      (img) =>
        img.warnings?.includes("no-photo-placeholder") &&
        img.eventMatch?.matchMethod === "rendered-event-block",
    ).length;

  stats.altDateConflicts = assetMap.pages
    .flatMap((p) => p.images)
    .filter((img) => img.eventMatch?.warnings?.includes("alt-date-conflict")).length;

  assetMap.eventImageMatching = stats;

  return assetMap;
}

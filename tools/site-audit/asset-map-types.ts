import type { ViewportType } from "./rendered-assets.ts";

export type InferredRole =
  | "hero"
  | "profile-photo"
  | "schedule-flyer"
  | "album-jacket"
  | "discography-cover"
  | "logo"
  | "sns-icon"
  | "decorative"
  | "content-image"
  | "unknown";

export type Confidence = "high" | "medium" | "low";

export type AssetSourceTag =
  | "json-image"
  | "html-img"
  | "rendered-img"
  | "rendered-picture"
  | "computed-background";

export type AssetRenderedInfo = {
  viewportType: ViewportType;
  renderedWidth?: number | null;
  renderedHeight?: number | null;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  x?: number | null;
  y?: number | null;
  isVisible?: boolean;
  isAboveFold?: boolean;
  selectorHint?: string;
  currentSrc?: string | null;
};

export type EventMatchMethod =
  | "same-card-text"
  | "nearby-y-position"
  | "nearby-date-text"
  | "same-section"
  | "cross-page-date"
  | "alt-text-date"
  | "rendered-event-block"
  | "rendered-order"
  | "manual-review";

export type RenderedEventBlock = {
  pageUrl: string;
  pageRoute: string;
  pageType: string;

  eventDate?: string;
  eventDateLabel?: string;
  eventTitle?: string;
  venue?: string;

  text: string;
  headings: string[];

  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;

  sectionHint?: string;
  selectorHint?: string;

  confidence: Confidence;
  signals: string[];
};

export type EventMatch = {
  eventDate?: string;
  eventDateLabel?: string;
  eventTitle?: string;
  venue?: string;
  sourcePage?: string;
  matchMethod: EventMatchMethod;
  matchConfidence: Confidence;
  matchedText?: string[];
  warnings?: string[];
};

export type CrossPageMatch = {
  targetPageRoute: string;
  targetEventDate?: string;
  targetEventLabel?: string;
  confidence: Confidence;
  note: string;
};

export type ScheduleCrossPageCandidate = {
  eventDate?: string;
  eventLabel: string;
  sourcePageRoute: string;
  sourceImageUrl: string;
  matchMethod: "cross-page-date";
  confidence: Confidence;
  note: string;
};

export type AssetCandidate = {
  imageUrl: string;
  originalSrc?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  pageUrl: string;
  pageRoute: string;
  pageType: string;
  nearbyHeadings: string[];
  nearbyText: string[];
  linkedHref?: string | null;
  inferredRole: InferredRole;
  relatedContentLabel?: string;
  confidence: Confidence;
  notes: string[];
  sources?: AssetSourceTag[];
  rendered?: AssetRenderedInfo;
  eventMatch?: EventMatch;
  crossPageMatches?: CrossPageMatch[];
  warnings?: string[];
};

export type AssetMapPage = {
  sourceUrl: string;
  route: string;
  pageType: string;
  images: AssetCandidate[];
  renderedEventBlocks?: RenderedEventBlock[];
  scheduleCrossPageCandidates?: ScheduleCrossPageCandidate[];
};

export type EventMatchSkipReason =
  | "sns-icon"
  | "excluded-role"
  | "sns-link"
  | "small-image"
  | "nav-footer"
  | "weak-context";

export type EventImageMatchingStats = {
  /** @deprecated Use eventMatchAccepted — kept for backward compatibility */
  imagesWithEventMatch: number;
  crossPageMatchCount: number;
  noPhotoPlaceholderCount: number;
  scheduleFlyersWithEventMatch: number;
  eventMatchCandidates: number;
  eventMatchAccepted: number;
  eventMatchSkipped: number;
  eventMatchSkippedReasons: Partial<Record<EventMatchSkipReason, number>>;
  renderedEventBlocks?: number;
  renderedEventMatches?: number;
  altDateConflicts?: number;
  noPhotoEventMatches?: number;
};

export type AssetMap = {
  generatedAt: string;
  totalPages: number;
  totalImages: number;
  totalRenderedCaptures?: number;
  renderedOnlyImages?: number;
  renderedEventBlocks?: RenderedEventBlock[];
  eventImageMatching?: EventImageMatchingStats;
  pages: AssetMapPage[];
};

export type ImageHtmlContext = {
  imageUrl: string;
  originalSrc: string;
  alt: string;
  width: number | null;
  height: number | null;
  nearbyHeadings: string[];
  nearbyText: string[];
  linkedHref: string | null;
  domIndex: number;
  classNames: string;
  sources: AssetSourceTag[];
  rendered?: AssetRenderedInfo;
};

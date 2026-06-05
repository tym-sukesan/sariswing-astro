import type { PageMetadata } from "./audit-site-types.ts";

type ServiceDefinition = {
  name: string;
  embedPatterns: RegExp[];
  linkPatterns: RegExp[];
};

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  {
    name: "youtube",
    embedPatterns: [
      /youtube\.com\/embed/i,
      /youtube-nocookie\.com\/embed/i,
      /youtube\.com\/iframe_api/i,
    ],
    linkPatterns: [/youtube\.com/i, /youtu\.be/i],
  },
  {
    name: "instagram",
    embedPatterns: [
      /instagram\.com\/embed/i,
      /platform\.instagram\.com/i,
      /data-instgrm-permalink/i,
      /data-instgrm-captioned/i,
      /instgrm\.Permission/i,
      /instagram-media/i,
    ],
    linkPatterns: [/instagram\.com/i],
  },
  {
    name: "spotify",
    embedPatterns: [/open\.spotify\.com\/embed/i, /embed\.spotify\.com/i],
    linkPatterns: [/(?:open\.)?spotify\.com/i],
  },
  {
    name: "soundcloud",
    embedPatterns: [/w\.soundcloud\.com\/player/i, /soundcloud\.com\/player/i],
    linkPatterns: [/soundcloud\.com/i],
  },
  {
    name: "bandcamp",
    embedPatterns: [/bandcamp\.com\/EmbeddedPlayer/i],
    linkPatterns: [/bandcamp\.com/i],
  },
  {
    name: "googleMaps",
    embedPatterns: [/google\.com\/maps\/embed/i, /maps\.google\.com\/maps\?.*output=embed/i],
    linkPatterns: [/google\.com\/maps/i, /maps\.google\.com/i, /goo\.gl\/maps/i],
  },
  {
    name: "hubspot",
    embedPatterns: [
      /\bhbspt\b/i,
      /\bhubspot\b/i,
      /\bhsforms\b/i,
      /js\.hs-scripts\.com/i,
      /js\.hsforms\.net/i,
      /js\.hs-analytics\.net/i,
      /forms\.hubspot\.com/i,
      /app\.hubspot\.com/i,
      /class=["'][^"']*hs-form/i,
    ],
    linkPatterns: [/hubspot\.com/i, /hsforms\.com/i, /hsforms\.net/i],
  },
];

function collectMatches(
  patterns: RegExp[],
  sources: string[],
  found: Set<string>,
  serviceName: string,
): void {
  for (const source of sources) {
    if (!source) continue;
    if (patterns.some((pattern) => pattern.test(source))) {
      found.add(serviceName);
      return;
    }
  }
}

export type ServiceDetectionInput = {
  html: string;
  pageMetadata: PageMetadata;
};

export type ServiceDetectionResult = {
  detectedEmbeds: string[];
  detectedExternalLinks: string[];
  possibleEmbeds: string[];
};

export function detectServices(input: ServiceDetectionInput): ServiceDetectionResult {
  const { html, pageMetadata } = input;
  const embedSources = [
    html,
    ...pageMetadata.iframes.map((frame) => frame.src),
    ...pageMetadata.scripts.map((script) => script.src),
  ];
  const linkSources = pageMetadata.links.map((link) => link.href);

  const detectedEmbeds = new Set<string>();
  const detectedExternalLinks = new Set<string>();

  for (const service of SERVICE_DEFINITIONS) {
    collectMatches(service.embedPatterns, embedSources, detectedEmbeds, service.name);
    collectMatches(service.linkPatterns, linkSources, detectedExternalLinks, service.name);
  }

  const embeds = [...detectedEmbeds].sort();
  const external = [...detectedExternalLinks].sort();
  const possibleEmbeds = [...new Set([...embeds, ...external])].sort();

  return {
    detectedEmbeds: embeds,
    detectedExternalLinks: external,
    possibleEmbeds,
  };
}

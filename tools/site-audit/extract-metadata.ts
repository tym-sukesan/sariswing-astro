import * as cheerio from "cheerio";
import type { PageMetadata } from "./audit-site-types.js";

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractMetadataFromHtml(html: string): PageMetadata {
  const $ = cheerio.load(html);

  const metaDescription =
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    null;

  const headingText = (selector: string) =>
    $(selector)
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter(Boolean);

  const images = $("img")
    .map((_, element) => {
      const img = $(element);
      return {
        src: img.attr("src") ?? "",
        alt: img.attr("alt") ?? "",
        width: parseOptionalInt(img.attr("width")),
        height: parseOptionalInt(img.attr("height")),
      };
    })
    .get()
    .filter((image) => image.src.length > 0);

  const links = $("a[href]")
    .map((_, element) => {
      const anchor = $(element);
      return {
        href: anchor.attr("href") ?? "",
        text: cleanText(anchor.text()),
      };
    })
    .get()
    .filter((link) => link.href.length > 0);

  const iframes = $("iframe")
    .map((_, element) => {
      const frame = $(element);
      return {
        src: frame.attr("src") ?? "",
        title: frame.attr("title") ?? "",
      };
    })
    .get();

  const scripts = $("script[src]")
    .map((_, element) => ({
      src: $(element).attr("src") ?? "",
    }))
    .get()
    .filter((script) => script.src.length > 0);

  return {
    title: cleanText($("title").first().text()) || "",
    metaDescription: metaDescription ? cleanText(metaDescription) : null,
    h1: headingText("h1"),
    h2: headingText("h2"),
    h3: headingText("h3"),
    images,
    links,
    iframes,
    scripts,
  };
}

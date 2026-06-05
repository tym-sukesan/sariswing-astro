(() => {
  const MIN_HEIGHT = 40;
  const MIN_WIDTH = 200;
  const MIN_TEXT_LEN = 24;
  const MAX_TEXT_LEN = 4000;

  const DATE_PATTERN =
    /(?:20\d{2}[.\-/]\d{2}[.\-/]\d{2})|(?:\d{1,2}月\d{1,2}日(?:\([^)]+\))?)|(?:\d{1,2}\/\d{1,2})|(?:\d{1,2}-\d{1,2})/;
  const LIVE_PATTERN = /\b(?:live|ライブ)\b/i;
  const SCHEDULE_SIGNAL_PATTERN =
    /\b(?:open|start|charge)\b|会場|出演|料金|住所|電話|☎|tel|venue|website|予約|sold\s*out/i;
  const NAV_FOOTER_PATTERN =
    /\b(?:footer|header|\bnav\b|social|sns|menu|copyright|©)\b/i;

  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const truncate = (value, max) => {
    const limit = max || 200;
    const text = cleanText(value);
    if (text.length <= limit) return text;
    return text.slice(0, limit - 1) + "\u2026";
  };

  const isExcludedRegion = (el) => {
    let node = el;
    for (let depth = 0; depth < 8 && node; depth++) {
      const tag = (node.tagName || "").toLowerCase();
      if (tag === "header" || tag === "footer" || tag === "nav") return true;
      const id = String(node.id || "").toLowerCase();
      const cls = String(node.className || "").toLowerCase();
      const blob = id + " " + cls;
      if (NAV_FOOTER_PATTERN.test(blob)) return true;
      node = node.parentElement;
    }
    return false;
  };

  const selectorHintFor = (el) => {
    const tag = (el.tagName || "div").toLowerCase();
    if (el.id) return tag + "#" + el.id;
    const cls =
      el.className && typeof el.className === "string"
        ? String(el.className).split(/\s+/).slice(0, 2).join(".")
        : "";
    return cls ? tag + "." + cls : tag;
  };

  const sectionHintFor = (el) => {
    const section = el.closest("section, main, article");
    if (!section) return null;
    const heading = section.querySelector("h1,h2,h3");
    if (heading) return truncate(heading.innerText || "", 80);
    return selectorHintFor(section);
  };

  const extractDateLabel = (text) => {
    const monthDay = text.match(/\d{1,2}月\d{1,2}日(?:\([^)]+\))?/);
    if (monthDay) return monthDay[0];
    const dotted = text.match(/20\d{2}\.\d{2}\.\d{2}/);
    if (dotted) return dotted[0];
    const isoish = text.match(/20\d{2}[.\-/]\d{2}[.\-/]\d{2}/);
    if (isoish) return isoish[0];
    const slash = text.match(/\d{1,2}\/\d{1,2}/);
    if (slash) return slash[0];
    const dash = text.match(/\d{1,2}-\d{1,2}/);
    if (dash) return dash[0];
    return null;
  };

  const extractTitle = (text, dateLabel) => {
    const band = text.match(/[『「]([^』」]+)[』」]/);
    if (band) return truncate(band[1], 80);
    if (dateLabel) {
      const after = text.split(dateLabel)[1] || "";
      const lt = after.match(/<([^>]+)>/);
      if (lt) return truncate(lt[1], 80);
    }
    return undefined;
  };

  const extractVenue = (text) => {
    const venueLine = text.match(/会場[：:]\s*([^\n]+)/);
    if (venueLine) return truncate(venueLine[1], 80);
    const lines = text.split(/\n|。/).map(cleanText).filter(Boolean);
    for (const line of lines) {
      if (/OPEN|START|CHARGE|☎|電話|出演|料金/.test(line)) break;
      if (line.length >= 2 && line.length <= 60 && !/月\d{1,2}日/.test(line) && !/^LIVE/i.test(line)) {
        if (/[都道府県市区町村丁目]|ビル|B\d|Ｆ|F\d|〒/.test(line)) continue;
        if (/^[『「]/.test(line)) continue;
        return truncate(line, 80);
      }
    }
    return undefined;
  };

  const buildSignals = (text, hasDate, hasLive, hasSchedule) => {
    const signals = [];
    if (hasDate) signals.push("date");
    if (hasLive) signals.push("LIVE");
    if (hasSchedule) signals.push("schedule-meta");
    if (/OPEN/i.test(text)) signals.push("OPEN");
    if (/START/i.test(text)) signals.push("START");
    if (/CHARGE|料金/.test(text)) signals.push("CHARGE");
    if (/会場/.test(text)) signals.push("venue");
    return signals;
  };

  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const maxBlockHeight = Math.max(viewportHeight * 0.92, 900);
  const selectors = ["section", "article", "li", "div"];
  const seen = new Set();
  const raw = [];

  for (let s = 0; s < selectors.length; s++) {
    const tag = selectors[s];
    const nodes = document.querySelectorAll(tag);
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (isExcludedRegion(el)) continue;

      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (height < MIN_HEIGHT || width < MIN_WIDTH) continue;
      if (height >= maxBlockHeight) continue;

      const text = cleanText(el.innerText || "");
      if (text.length < MIN_TEXT_LEN || text.length > MAX_TEXT_LEN) continue;

      const hasDate = DATE_PATTERN.test(text);
      if (!hasDate) continue;

      const hasLive = LIVE_PATTERN.test(text);
      const hasSchedule = SCHEDULE_SIGNAL_PATTERN.test(text);
      if (!hasLive && !hasSchedule) continue;

      const dateLabel = extractDateLabel(text);
      if (!dateLabel) continue;

      const key = dateLabel + "|" + truncate(text, 120);
      if (seen.has(key)) continue;
      seen.add(key);

      const headings = Array.from(el.querySelectorAll("h1,h2,h3,h4"))
        .map((h) => truncate(h.innerText || "", 80))
        .filter(Boolean)
        .slice(0, 5);

      const signals = buildSignals(text, hasDate, hasLive, hasSchedule);
      let confidence = "medium";
      if (hasDate && hasLive && hasSchedule) confidence = "high";
      else if (!hasSchedule) confidence = "low";

      raw.push({
        eventDateLabel: dateLabel,
        eventTitle: extractTitle(text, dateLabel),
        venue: extractVenue(text),
        text: truncate(text, 500),
        headings: headings,
        x: Math.round(rect.x),
        y: Math.round(rect.y + window.scrollY),
        width: width,
        height: height,
        sectionHint: sectionHintFor(el),
        selectorHint: selectorHintFor(el),
        confidence: confidence,
        signals: signals,
        elementTag: tag,
      });
    }
  }

  return {
    viewportWidth: viewportWidth,
    viewportHeight: viewportHeight,
    blocks: raw,
    warnings: [],
  };
})()

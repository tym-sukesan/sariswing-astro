(() => {
  const MAX_TEXTS = 8;
  const MAX_HEADINGS = 5;

  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim();

  const truncate = (value, max) => {
    const limit = max || 160;
    const text = cleanText(value);
    if (text.length <= limit) return text;
    return text.slice(0, limit - 1) + "\u2026";
  };

  const isBadUrl = (url) => {
    if (!url) return true;
    return /^(data:|blob:|about:|javascript:|#)/i.test(url);
  };

  const getNearbyText = (el) => {
    const results = [];
    let current = el;
    for (let i = 0; i < 4 && current; i++) {
      const text = truncate(current.innerText || "");
      if (text && results.indexOf(text) === -1) results.push(text);
      current = current.parentElement;
    }
    return results.slice(0, MAX_TEXTS);
  };

  const getNearbyHeadings = (el) => {
    const root = el.closest("section, article, li, div") || document.body;
    const headings = Array.from(root.querySelectorAll("h1,h2,h3"))
      .map((h) => truncate(h.innerText || ""))
      .filter(Boolean);
    const unique = [];
    for (let i = 0; i < headings.length; i++) {
      if (unique.indexOf(headings[i]) === -1) unique.push(headings[i]);
    }
    return unique.slice(0, MAX_HEADINGS);
  };

  const getLinkedHref = (el) => {
    const link = el.closest("a");
    return link ? link.href : null;
  };

  const seen = new Set();
  const assets = [];

  Array.from(document.querySelectorAll("img")).forEach((img, index) => {
    const rect = img.getBoundingClientRect();
    const currentSrc = img.currentSrc || img.src || "";
    if (isBadUrl(currentSrc)) return;
    if (seen.has(currentSrc)) return;
    seen.add(currentSrc);

    const renderedWidth = Math.round(rect.width);
    const renderedHeight = Math.round(rect.height);
    if (renderedWidth < 1 || renderedHeight < 1) return;

    const className =
      img.className && typeof img.className === "string"
        ? String(img.className).split(/\s+/).slice(0, 3).join(".")
        : "";
    const selectorHint = img.id
      ? "img#" + img.id
      : className
        ? "img." + className
        : "img";

    assets.push({
      imageUrl: currentSrc,
      currentSrc: currentSrc,
      src: img.src || null,
      srcset: img.getAttribute("srcset"),
      alt: img.getAttribute("alt"),
      naturalWidth: img.naturalWidth || null,
      naturalHeight: img.naturalHeight || null,
      renderedWidth: renderedWidth,
      renderedHeight: renderedHeight,
      x: Math.round(rect.x),
      y: Math.round(rect.y + window.scrollY),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isVisible: rect.width > 0 && rect.height > 0,
      isAboveFold: rect.top < window.innerHeight && rect.bottom > 0,
      elementTag: "img",
      selectorHint: selectorHint,
      nearbyText: getNearbyText(img),
      nearbyHeadings: getNearbyHeadings(img),
      linkedHref: getLinkedHref(img),
      source: "rendered-img",
      domOrder: index,
    });
  });

  return {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    assets: assets,
    warnings: [],
  };
})()

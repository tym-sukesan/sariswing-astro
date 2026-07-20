/**
 * Gosaki About content — structured field ↔ HTML surgical patch (Node / verifier).
 * Keep in sync with supabase/functions/_shared/gosaki-about-html-patch.ts
 */

export const GOSAKI_ABOUT_PROFILE_BLOCK_ID = "about-profile-html";
export const GOSAKI_ABOUT_BANDS_BLOCK_ID = "about-bands-html";
export const GOSAKI_ABOUT_SITE_SLUG = "gosaki-piano";

const FORBIDDEN_TEXT = [
  /javascript:/i,
  /data:/i,
  /<iframe/i,
  /<script/i,
  /<\/?[a-z][^>]*>/i,
  /on\w+\s*=/i,
];

export function escapeHtmlText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function escapeHtmlAttr(value) {
  return escapeHtmlText(value).replace(/'/g, "&#39;");
}

export function stripTags(html) {
  return String(html ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function splitParagraphs(body) {
  return String(body ?? "")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function assertPlainTextField(label, value, { allowEmpty = false } = {}) {
  if (typeof value !== "string") return `${label} must be a string`;
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) return `${label} must not be empty`;
  for (const pattern of FORBIDDEN_TEXT) {
    if (pattern.test(value)) return `${label} contains forbidden HTML or script patterns`;
  }
  if (value.length > 20000) return `${label} exceeds max length`;
  return null;
}

export function parseImgAlt(html) {
  const tag = String(html ?? "").match(/<img\b[^>]*>/i)?.[0] ?? "";
  return tag.match(/\balt="([^"]*)"/i)?.[1] ?? "";
}

export function parseProfileSnapshot(html) {
  const raw = String(html ?? "");
  const headingMatch = raw.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
  const heading = headingMatch ? stripTags(headingMatch[1]) : "";
  const paragraphs = [...raw.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => stripTags(m[1]))
    .filter(Boolean);
  return {
    heading,
    body: paragraphs.join("\n\n"),
    imageAlt: parseImgAlt(raw),
  };
}

export function parseBandsSnapshot(html) {
  const raw = String(html ?? "");
  const articles = [
    ...raw.matchAll(
      /<article\b([^>]*)class="([^"]*\bband-profile\b[^"]*)"([^>]*)>([\s\S]*?)<\/article>/gi,
    ),
  ];
  return articles.map((match, index) => {
    const openAttrs = `${match[1] ?? ""}${match[3] ?? ""}`;
    const inner = match[4] ?? "";
    const id =
      openAttrs.match(/\bid="([^"]*)"/i)?.[1]?.trim() || `band-${index + 1}`;
    const name = stripTags(
      (inner.match(/band-profile__name[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || "",
    );
    const descInner =
      (inner.match(/band-profile__description[^>]*>([\s\S]*?)<\/div>/i) || [])[1] || "";
    return {
      id,
      name,
      body: stripTags(descInner),
      imageAlt: parseImgAlt(inner),
    };
  });
}

function patchFirstImgAlt(html, imageAlt) {
  const alt = escapeHtmlAttr(String(imageAlt ?? "").trim());
  let replaced = false;
  const next = String(html).replace(/<img\b[^>]*>/i, (tag) => {
    replaced = true;
    if (/\balt\s*=/i.test(tag)) {
      return tag.replace(/\balt\s*=\s*(["'])[\s\S]*?\1/i, `alt="${alt}"`);
    }
    return tag.replace(/^<img\b/i, `<img alt="${alt}"`);
  });
  if (!replaced) {
    return { ok: false, error: "profile/band image tag not found for alt patch" };
  }
  return { ok: true, html: next };
}

export function patchProfileHtml(html, next) {
  let out = String(html ?? "");
  if (!/<h[1-6]\b/i.test(out)) {
    return { ok: false, error: "profile heading not found" };
  }
  out = out.replace(/<(h[1-6])(\b[^>]*)>([\s\S]*?)<\/\1>/i, (_m, tag, attrs) => {
    return `<${tag}${attrs}>${escapeHtmlText(next.heading.trim())}</${tag}>`;
  });

  const paras = splitParagraphs(next.body);
  const pMatches = [...out.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
  if (pMatches.length === 0) {
    return { ok: false, error: "profile paragraphs not found" };
  }
  if (paras.length === 0) {
    return { ok: false, error: "profile.body must contain at least one paragraph" };
  }
  const openTag = pMatches[0][0].match(/^<p\b[^>]*>/i)?.[0] ?? "<p>";
  const rebuilt = paras
    .map((p) => `${openTag}${escapeHtmlText(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n\n");
  const firstIdx = pMatches[0].index ?? 0;
  const last = pMatches[pMatches.length - 1];
  const endIdx = (last.index ?? 0) + last[0].length;
  out = `${out.slice(0, firstIdx)}${rebuilt}${out.slice(endIdx)}`;

  const altRes = patchFirstImgAlt(out, next.imageAlt);
  if (!altRes.ok) return altRes;
  return { ok: true, html: altRes.html };
}

export function patchBandsHtml(html, nextBands) {
  let out = String(html ?? "");
  const current = parseBandsSnapshot(out);
  if (current.length === 0) {
    return { ok: false, error: "bands articles not found" };
  }
  if (!Array.isArray(nextBands) || nextBands.length !== current.length) {
    return {
      ok: false,
      error: `bands length must match current (${current.length})`,
    };
  }
  for (let i = 0; i < current.length; i += 1) {
    if (String(nextBands[i]?.id ?? "").trim() !== current[i].id) {
      return {
        ok: false,
        error: `bands[${i}].id must be ${current[i].id} (immutable)`,
      };
    }
  }

  for (const band of nextBands) {
    const id = String(band.id).trim();
    const articleRe = new RegExp(
      `(<article\\b[^>]*\\bid="${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>)([\\s\\S]*?)(<\\/article>)`,
      "i",
    );
    const match = out.match(articleRe);
    if (!match) {
      return { ok: false, error: `band article not found: ${id}` };
    }
    let inner = match[2];
    if (!/band-profile__name/i.test(inner)) {
      return { ok: false, error: `band name heading missing: ${id}` };
    }
    inner = inner.replace(
      /<(h3)(\b[^>]*\bband-profile__name\b[^>]*)>([\s\S]*?)<\/h3>/i,
      (_m, tag, attrs) =>
        `<${tag}${attrs}>${escapeHtmlText(String(band.name ?? "").trim())}</${tag}>`,
    );

    const descRe =
      /(<div\b[^>]*\bband-profile__description\b[^>]*>)([\s\S]*?)(<\/div>)/i;
    if (!descRe.test(inner)) {
      return { ok: false, error: `band description missing: ${id}` };
    }
    const paras = splitParagraphs(band.body);
    if (paras.length === 0) {
      return { ok: false, error: `band.body must contain at least one paragraph: ${id}` };
    }
    const descInner = paras
      .map((p) => `<p>${escapeHtmlText(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
    inner = inner.replace(descRe, (_m, open, _old, close) => `${open}${descInner}${close}`);

    const altRes = patchFirstImgAlt(inner, band.imageAlt);
    if (!altRes.ok) {
      return { ok: false, error: `${altRes.error}: ${id}` };
    }
    inner = altRes.html;
    out = out.replace(articleRe, `${match[1]}${inner}${match[3]}`);
  }
  return { ok: true, html: out };
}

export function snapshotsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeAboutNext(next) {
  if (!next || typeof next !== "object" || Array.isArray(next)) {
    return { ok: false, error: "next must be an object" };
  }
  const keys = Object.keys(next).sort();
  if (keys.length !== 2 || keys[0] !== "bands" || keys[1] !== "profile") {
    return { ok: false, error: "next must contain exact keys profile, bands" };
  }
  const profile = next.profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return { ok: false, error: "next.profile must be an object" };
  }
  const pKeys = Object.keys(profile).sort();
  if (
    pKeys.length !== 3 ||
    pKeys[0] !== "body" ||
    pKeys[1] !== "heading" ||
    pKeys[2] !== "imageAlt"
  ) {
    return {
      ok: false,
      error: "next.profile must contain exact keys body, heading, imageAlt",
    };
  }
  for (const label of ["heading", "body", "imageAlt"]) {
    const err = assertPlainTextField(
      `next.profile.${label}`,
      profile[label],
      { allowEmpty: label === "imageAlt" },
    );
    if (err) return { ok: false, error: err };
  }
  if (!Array.isArray(next.bands)) {
    return { ok: false, error: "next.bands must be an array" };
  }
  const bands = [];
  for (let i = 0; i < next.bands.length; i += 1) {
    const band = next.bands[i];
    if (!band || typeof band !== "object" || Array.isArray(band)) {
      return { ok: false, error: `next.bands[${i}] must be an object` };
    }
    const bKeys = Object.keys(band).sort();
    if (
      bKeys.length !== 4 ||
      bKeys[0] !== "body" ||
      bKeys[1] !== "id" ||
      bKeys[2] !== "imageAlt" ||
      bKeys[3] !== "name"
    ) {
      return {
        ok: false,
        error: `next.bands[${i}] must contain exact keys body, id, imageAlt, name`,
      };
    }
    for (const label of ["id", "name", "body", "imageAlt"]) {
      const err = assertPlainTextField(`next.bands[${i}].${label}`, band[label], {
        allowEmpty: label === "imageAlt",
      });
      if (err) return { ok: false, error: err };
    }
    bands.push({
      id: String(band.id).trim(),
      name: String(band.name).trim(),
      body: String(band.body).replace(/\r\n/g, "\n").trim(),
      imageAlt: String(band.imageAlt ?? "").trim(),
    });
  }
  return {
    ok: true,
    next: {
      profile: {
        heading: String(profile.heading).trim(),
        body: String(profile.body).replace(/\r\n/g, "\n").trim(),
        imageAlt: String(profile.imageAlt ?? "").trim(),
      },
      bands,
    },
  };
}

export function findAboutBlocks(config) {
  if (!config || typeof config !== "object") return null;
  const blocks = config.blocks;
  if (!Array.isArray(blocks)) return null;
  const profile = blocks.filter((b) => b && b.id === GOSAKI_ABOUT_PROFILE_BLOCK_ID);
  const bands = blocks.filter((b) => b && b.id === GOSAKI_ABOUT_BANDS_BLOCK_ID);
  if (profile.length !== 1 || bands.length !== 1) return null;
  return { profile: profile[0], bands: bands[0] };
}

export function readAboutSnapshotFromConfig(config) {
  if (!config || typeof config !== "object") {
    return { ok: false, error: "config must be a JSON object", httpStatus: 502 };
  }
  if (String(config.siteSlug ?? "").trim() !== GOSAKI_ABOUT_SITE_SLUG) {
    return {
      ok: false,
      error: `config siteSlug must be ${GOSAKI_ABOUT_SITE_SLUG}`,
      httpStatus: 502,
    };
  }
  const found = findAboutBlocks(config);
  if (!found) {
    return {
      ok: false,
      error: "about-profile-html / about-bands-html blocks missing or ambiguous",
      httpStatus: 404,
    };
  }
  const profileHtml = String(found.profile.html ?? "");
  const bandsHtml = String(found.bands.html ?? "");
  return {
    ok: true,
    snapshot: {
      profile: parseProfileSnapshot(profileHtml),
      bands: parseBandsSnapshot(bandsHtml),
    },
    profileHtml,
    bandsHtml,
  };
}

/**
 * Plan structured patch → HTML blocks. Does not mutate input config.
 */
export function planAboutContentPatch(input) {
  const currentRes = readAboutSnapshotFromConfig(input.config);
  if (!currentRes.ok) {
    return { ok: false, error: currentRes.error, httpStatus: currentRes.httpStatus };
  }
  const normalized = normalizeAboutNext(input.next);
  if (!normalized.ok) {
    return { ok: false, error: normalized.error, httpStatus: 422 };
  }
  const next = normalized.next;
  const current = currentRes.snapshot;

  if (input.enforceExpectedBefore !== false) {
    if (!input.expectedBefore || !snapshotsEqual(input.expectedBefore, current)) {
      return {
        ok: false,
        error: "expectedBefore does not match current About snapshot",
        httpStatus: 409,
        current,
      };
    }
  }

  if (snapshotsEqual(current, next)) {
    return {
      ok: true,
      saveReadiness: "no_change",
      changedFields: [],
      current,
      next,
      patchedContentText: null,
    };
  }

  const profilePatch = patchProfileHtml(currentRes.profileHtml, next.profile);
  if (!profilePatch.ok) {
    return { ok: false, error: profilePatch.error, httpStatus: 422, current };
  }
  const bandsPatch = patchBandsHtml(currentRes.bandsHtml, next.bands);
  if (!bandsPatch.ok) {
    return { ok: false, error: bandsPatch.error, httpStatus: 422, current };
  }

  const patched = JSON.parse(JSON.stringify(input.config));
  const found = findAboutBlocks(patched);
  if (!found) {
    return { ok: false, error: "patch target missing", httpStatus: 409 };
  }
  found.profile.html = profilePatch.html;
  found.bands.html = bandsPatch.html;

  // Guard: only html fields on the two blocks may change
  const beforeRoot = JSON.parse(JSON.stringify(input.config));
  const afterSansHtml = JSON.parse(JSON.stringify(patched));
  const beforeSansHtml = JSON.parse(JSON.stringify(beforeRoot));
  const bFound = findAboutBlocks(beforeSansHtml);
  const aFound = findAboutBlocks(afterSansHtml);
  if (bFound) {
    delete bFound.profile.html;
    delete bFound.bands.html;
  }
  if (aFound) {
    delete aFound.profile.html;
    delete aFound.bands.html;
  }
  if (JSON.stringify(beforeSansHtml) !== JSON.stringify(afterSansHtml)) {
    return {
      ok: false,
      error: "forbidden non-html fields would change",
      httpStatus: 422,
    };
  }

  const changedFields = [];
  if (current.profile.heading !== next.profile.heading) changedFields.push("profile.heading");
  if (current.profile.body !== next.profile.body) changedFields.push("profile.body");
  if (current.profile.imageAlt !== next.profile.imageAlt) {
    changedFields.push("profile.imageAlt");
  }
  for (let i = 0; i < next.bands.length; i += 1) {
    const c = current.bands[i];
    const n = next.bands[i];
    if (c.name !== n.name) changedFields.push(`bands[${i}].name`);
    if (c.body !== n.body) changedFields.push(`bands[${i}].body`);
    if (c.imageAlt !== n.imageAlt) changedFields.push(`bands[${i}].imageAlt`);
  }

  // Round-trip parse check
  const verify = {
    profile: parseProfileSnapshot(profilePatch.html),
    bands: parseBandsSnapshot(bandsPatch.html),
  };
  if (!snapshotsEqual(verify, next)) {
    return {
      ok: false,
      error: "patched HTML does not round-trip to requested next snapshot",
      httpStatus: 422,
      current,
    };
  }

  return {
    ok: true,
    saveReadiness: "changed",
    changedFields,
    current,
    next,
    patchedContentText: `${JSON.stringify(patched, null, 2)}\n`,
  };
}

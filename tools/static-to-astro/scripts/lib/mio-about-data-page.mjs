/**
 * Mio Kisaragi Jazz — About page render from injected aboutBundle.
 *
 * Does not import Gosaki About / BandProfiles. Does not read fixture paths implicitly.
 * Applied in adapter applyPostGenerate when aboutBundle is present.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} text
 */
export function escapeMioAboutHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Allow only relative local asset paths (no external URL, no .. traversal).
 * @param {unknown} src
 * @returns {string | null}
 */
export function resolveMioSafeLocalImageSrc(src) {
  const raw = String(src ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//") || raw.startsWith("data:")) {
    return null;
  }
  if (raw.includes("..") || raw.includes("\\")) return null;
  if (raw.startsWith("/")) {
    // Absolute site paths under /images/ only.
    if (!raw.startsWith("/images/")) return null;
    return raw.replace(/^\//, "");
  }
  if (!/^(images|assets)\//i.test(raw)) return null;
  return raw;
}

/**
 * @param {{ about?: unknown, profile?: unknown, collaborators?: unknown, pageFieldsCoreCompatible?: unknown, siteSlug?: string }} doc
 */
export function buildMioInjectAboutBundle(doc) {
  if (!doc || typeof doc !== "object") {
    return { aboutDataSource: "static-fallback", profile: null, collaborators: [], pageFields: [] };
  }
  const profile = doc.profile && typeof doc.profile === "object" ? { ...doc.profile } : {};
  const collaborators = Array.isArray(doc.collaborators) ? doc.collaborators.map((c) => ({ ...c })) : [];
  const pageFields = Array.isArray(doc.pageFieldsCoreCompatible)
    ? doc.pageFieldsCoreCompatible.map((f) => ({ ...f }))
    : [];
  return {
    aboutDataSource: "static-fallback",
    siteSlug: doc.siteSlug ?? "mio-kisaragi-jazz",
    page: doc.page ?? "about",
    version: doc.version ?? 1,
    profile,
    collaborators,
    pageFields,
    pageFieldsCoreCompatible: pageFields,
  };
}

/**
 * @param {unknown} bundle
 */
export function readMioAboutProfile(bundle) {
  if (!bundle || typeof bundle !== "object") return null;
  const profile = /** @type {any} */ (bundle).profile;
  return profile && typeof profile === "object" ? profile : null;
}

/**
 * @param {unknown} bundle
 */
export function readMioAboutCollaborators(bundle) {
  if (!bundle || typeof bundle !== "object") return [];
  return Array.isArray(/** @type {any} */ (bundle).collaborators)
    ? /** @type {any} */ (bundle).collaborators
    : [];
}

/**
 * @param {unknown} bundle
 */
export function readMioAboutLede(bundle) {
  const profile = readMioAboutProfile(bundle);
  if (profile?.jaShort) return String(profile.jaShort);
  const fields = Array.isArray(/** @type {any} */ (bundle)?.pageFields)
    ? /** @type {any} */ (bundle).pageFields
    : Array.isArray(/** @type {any} */ (bundle)?.pageFieldsCoreCompatible)
      ? /** @type {any} */ (bundle).pageFieldsCoreCompatible
      : [];
  const lede = fields.find(
    (f) => f && f.field_key === "profile.lede" && f.published !== false,
  );
  return lede ? String(lede.value_text ?? "") : "";
}

/**
 * @param {string | null} src
 * @param {string} alt
 * @param {{ width?: number, height?: number, className?: string }} [opts]
 */
function renderSafeImg(src, alt, opts = {}) {
  const safe = resolveMioSafeLocalImageSrc(src);
  const altText = String(alt ?? "").trim() || "Portrait";
  if (!safe) {
    return `<div class="mio-about-photo mio-about-photo--missing" data-mio-photo="missing" role="img" aria-label="${escapeMioAboutHtml(altText)}"></div>`;
  }
  const width = opts.width ?? 320;
  const height = opts.height ?? 400;
  const className = opts.className ?? "mio-about-photo__img";
  return `<img class="${className}" src="${escapeMioAboutHtml(safe)}" width="${width}" height="${height}" alt="${escapeMioAboutHtml(altText)}" data-mio-photo="local" />`;
}

/**
 * @param {Record<string, unknown>} collab
 */
export function renderMioAboutCollaboratorCardHtml(collab) {
  const id = String(collab.id ?? "");
  const name = String(collab.name ?? "");
  const role = String(collab.role ?? "");
  const bio = String(collab.bio ?? "");
  const hasPhoto = collab.hasPhoto === true && Boolean(resolveMioSafeLocalImageSrc(collab.photoSrc));
  const photoHtml = hasPhoto
    ? `<div class="mio-about-collaborator__photo">${renderSafeImg(String(collab.photoSrc), `${name}の写真`, {
        width: 160,
        height: 160,
        className: "mio-about-collaborator__img",
      })}</div>`
    : `<div class="mio-about-collaborator__photo mio-about-collaborator__photo--none" data-mio-photo="none" aria-hidden="true"></div>`;

  return `<li class="mio-about-collaborator${hasPhoto ? " mio-about-collaborator--has-photo" : " mio-about-collaborator--no-photo"}" data-mio-collaborator-id="${escapeMioAboutHtml(id)}" data-mio-has-photo="${hasPhoto ? "true" : "false"}">
      ${photoHtml}
      <h3 class="mio-about-collaborator__name">${escapeMioAboutHtml(name)}</h3>
      <p class="mio-about-collaborator__role">${escapeMioAboutHtml(role)}</p>
      <p class="mio-about-collaborator__bio">${escapeMioAboutHtml(bio)}</p>
    </li>`;
}

/**
 * @param {unknown} bundle
 */
export function renderMioAboutMainHtml(bundle) {
  const profile = readMioAboutProfile(bundle) ?? {};
  const lede = readMioAboutLede(bundle);
  const jaLong = String(profile.jaLong ?? "");
  const en = String(profile.en ?? "");
  const photo = profile.photo && typeof profile.photo === "object" ? profile.photo : {};
  const noPhoto = profile.noPhotoBlock && typeof profile.noPhotoBlock === "object" ? profile.noPhotoBlock : {};
  const collaborators = readMioAboutCollaborators(bundle);

  const photoPresent = photo.present === true;
  const photoSrc = photoPresent ? photo.src : null;
  const photoAlt = String(photo.alt ?? "プロフィール写真");
  const photoBlock = photoPresent
    ? `<div class="mio-about-profile__photo">${renderSafeImg(photoSrc, photoAlt)}</div>`
    : "";

  const collabHtml = collaborators.map((c) => renderMioAboutCollaboratorCardHtml(c)).join("\n    ");

  return `<div class="mio-about" data-mio-about="public">
  <p class="eyebrow">About</p>
  <h1 class="mio-about__title page-title">如月 澪</h1>
  <p class="lede mio-about__lede" data-mio-field="profile.lede">${escapeMioAboutHtml(lede)}</p>

  <section class="mio-about-section" data-mio-about-section="ja-short" aria-labelledby="mio-about-short">
    <h2 id="mio-about-short">短い紹介</h2>
    <p class="mio-about-ja-short">${escapeMioAboutHtml(String(profile.jaShort ?? lede))}</p>
  </section>

  <section class="mio-about-section" data-mio-about-section="with-photo" aria-labelledby="mio-about-with-photo">
    <h2 id="mio-about-with-photo">プロフィール（写真あり）</h2>
    <div class="mio-about-profile-grid">
      ${photoBlock}
      <div class="mio-about-profile__text">
        <p class="lang-label">Japanese</p>
        <p class="mio-about-ja-long-excerpt">${escapeMioAboutHtml(jaLong.slice(0, 180))}${jaLong.length > 180 ? "…" : ""}</p>
      </div>
    </div>
  </section>

  <section class="mio-about-section" data-mio-about-section="ja-long" aria-labelledby="mio-about-ja-long">
    <h2 id="mio-about-ja-long">長いプロフィール（日本語）</h2>
    <div class="mio-about-ja-long" data-mio-profile="ja-long">
      <p>${escapeMioAboutHtml(jaLong)}</p>
    </div>
  </section>

  <section class="mio-about-section" data-mio-about-section="en" aria-labelledby="mio-about-en">
    <h2 id="mio-about-en">English profile</h2>
    <div class="mio-about-en" data-mio-profile="en">
      <p class="lang-label">English</p>
      <p>${escapeMioAboutHtml(en)}</p>
    </div>
  </section>

  <section class="mio-about-section" data-mio-about-section="no-photo" aria-labelledby="mio-about-no-photo">
    <h2 id="mio-about-no-photo">写真なしブロック（markup 試験）</h2>
    <div class="mio-about-no-photo" data-mio-profile="no-photo" data-mio-photo="none">
      <p>${escapeMioAboutHtml(String(noPhoto.text ?? ""))}</p>
    </div>
  </section>

  <section class="mio-about-section" data-mio-about-section="collaborators" aria-labelledby="mio-about-collab">
    <h2 id="mio-about-collab">共演者</h2>
    <ul class="mio-about-collaborators people-list" data-mio-collaborator-count="${collaborators.length}">
    ${collabHtml}
    </ul>
  </section>
</div>`;
}

/**
 * @param {string} outDir
 * @returns {string | null}
 */
export function resolveMioAboutPagePath(outDir) {
  const candidates = [
    path.join(outDir, "src/pages/about/index.astro"),
    path.join(outDir, "src/pages/about.astro"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

/**
 * Replace About page body with Mio about markup from injected bundle.
 * No-op (applied:false) when bundle missing — preserves scaffold HTML.
 *
 * @param {string} outDir
 * @param {unknown} aboutBundle
 */
export function applyMioAboutPage(outDir, aboutBundle) {
  const profile = readMioAboutProfile(aboutBundle);
  if (!profile && !readMioAboutCollaborators(aboutBundle).length) {
    return {
      applied: false,
      reason: "mio_about_bundle_missing",
      paths: [],
      collaboratorCount: 0,
    };
  }

  const pagePath = resolveMioAboutPagePath(outDir);
  if (!pagePath) {
    return {
      applied: false,
      reason: "about_page_not_found",
      paths: [],
      collaboratorCount: readMioAboutCollaborators(aboutBundle).length,
    };
  }

  const original = fs.readFileSync(pagePath, "utf8");
  const fmMatch = original.match(/^---\n[\s\S]*?\n---\n?/);
  const frontmatter = fmMatch ? fmMatch[0] : "";
  const body = fmMatch ? original.slice(fmMatch[0].length) : original;

  const layoutOpenMatch = body.match(/^(\s*<BaseLayout[\s\S]*?>)/);
  const closeIdx = body.lastIndexOf("</BaseLayout>");
  if (!layoutOpenMatch || closeIdx === -1) {
    return {
      applied: false,
      reason: "about_baselayout_missing",
      paths: [],
      collaboratorCount: readMioAboutCollaborators(aboutBundle).length,
    };
  }

  const layoutOpen = layoutOpenMatch[1];
  const afterClose = body.slice(closeIdx);
  const mainHtml = renderMioAboutMainHtml(aboutBundle);
  const next = `${frontmatter}${layoutOpen}\n${mainHtml}\n${afterClose}`;
  fs.writeFileSync(pagePath, next, "utf8");

  const collaborators = readMioAboutCollaborators(aboutBundle);
  return {
    applied: true,
    paths: [pagePath],
    aboutDataSource: "static-fallback",
    collaboratorCount: collaborators.length,
    collaboratorIds: collaborators.map((c) => String(c.id ?? "")),
    hasJaShort: Boolean(profile?.jaShort || readMioAboutLede(aboutBundle)),
    hasJaLong: Boolean(profile?.jaLong),
    hasEn: Boolean(profile?.en),
    hasPhoto: Boolean(profile?.photo?.present),
    hasNoPhotoBlock: Boolean(profile?.noPhotoBlock?.present),
  };
}

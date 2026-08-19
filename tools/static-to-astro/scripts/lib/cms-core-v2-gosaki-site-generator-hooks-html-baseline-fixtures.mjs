/**
 * Deterministic inputs + expected return shapes for Gosaki site-generator-hooks HTML baseline.
 * Large Astro/HTML snapshots live under fixtures/cms-core-v2-gosaki-site-generator-hooks-html-baseline/.
 */

export const BASELINE_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
export const BASELINE_BASE_URL = "https://yskcreate.weblike.jp";

export const BASELINE_SCHEDULE_BUNDLE = Object.freeze({
  scheduleDataSource: "supabase",
  schedules: Object.freeze([{ id: "1", month: "2026-08", date: "2026-08-01" }]),
  months: Object.freeze([
    Object.freeze({
      month: "2026-08",
      label: "2026.08",
      route: "/schedule/2026-08/",
      heading: "Schedule 2026.08",
    }),
  ]),
});

export const BASELINE_TRANSFORM_PAGE_IN = Object.freeze({
  sourcePath: "2026-08.html",
  route: "/2026-08/",
  astroRoute: "/2026-08/",
  pagePath: "2026-08/index.astro",
  seo: Object.freeze({
    title: "Aug",
    description: "",
    canonical: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogType: "website",
    ogUrl: "",
    twitterCard: "summary",
    favicon: "",
    appleTouchIcon: "",
    lang: "ja",
  }),
});

export const BASELINE_TRANSFORM_PAGE_OUT = Object.freeze({
  sourcePath: "2026-08.html",
  route: "/schedule/2026-08/",
  astroRoute: "/schedule/2026-08/",
  pagePath: "schedule/2026-08/index.astro",
  seo: Object.freeze({
    title: "Aug",
    description: "",
    canonical:
      "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogType: "website",
    ogUrl:
      "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/",
    twitterCard: "summary",
    favicon: "",
    appleTouchIcon: "",
    lang: "ja",
    canonicalOriginal: "",
    ogUrlOriginal: "",
    ogImageOriginal: "",
    baseUrlApplied: true,
    baseUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano",
    canonicalMode: "staging-url",
  }),
});

export const BASELINE_FOOTER_IN =
  `<footer id="SITE_FOOTER"><div id="LnkBr2">` +
  `<a href="https://facebook.com/goto.saki.3" aria-label="Facebook">f</a>` +
  `<a href="https://twitter.com/goto_saki_pf" aria-label="X">x</a>` +
  `<a href="https://instagram.com/gosaakiii" aria-label="Instagram">i</a>` +
  `</div><div id="WRchTxtx">©</div></footer>`;

export const BASELINE_FOOTER_OUT =
  `<footer id="SITE_FOOTER"><div id="LnkBr2">` +
  `<a href="https://facebook.com/goto.saki.3" aria-label="Facebook">f</a>` +
  `<a href="https://twitter.com/goto_saki_pf" aria-label="X">x</a>` +
  `<a href="https://instagram.com/gosaakiii" aria-label="Instagram">i</a></div>` +
  `<nav class="gosaki-footer-social-links" aria-label="Social links">\n` +
  `  <a href="https://facebook.com/goto.saki.3" target="_blank" rel="noopener noreferrer">Facebook</a>\n` +
  `  <a href="https://twitter.com/goto_saki_pf" target="_blank" rel="noopener noreferrer">X</a>\n` +
  `  <a href="https://instagram.com/gosaakiii" target="_blank" rel="noopener noreferrer">Instagram</a>\n` +
  `</nav><div id="WRchTxtx">©</div></footer>\n`;

export const BASELINE_HOME_IN = `---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
  <div id="comp-m8y53dj5">THIS WEEK</div>
  <p>body</p>
</BaseLayout>
`;

export const BASELINE_HOME_YT_OUT = `---
import YouTubeEmbedSection from "../components/YouTubeEmbedSection.astro";
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
  <div id="comp-m8y53dj5">THIS WEEK</div>
  <YouTubeEmbedSection />

  <p>body</p>
</BaseLayout>
`;

export const BASELINE_ABOUT_IN = `---
import BaseLayout from "../layouts/BaseLayout.astro";
import BandProfilesSection from "../components/BandProfilesSection.astro";
---

<BaseLayout title="About">
  <div data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"><p>OLD</p></div>
  <BandProfilesSection />
</BaseLayout>
`;

export const BASELINE_ABOUT_CONFIG = Object.freeze({
  version: 1,
  blocks: Object.freeze([
    Object.freeze({
      id: "about-profile-html",
      enabled: true,
      html: '<p class="lede">BASELINE_LEDE</p>',
    }),
    Object.freeze({
      id: "about-bands-html",
      enabled: true,
      html: '<section class="bands"><h2>Bands</h2></section>',
    }),
  ]),
});

/** Cheerio serializes unknown tags lowercase — lock current behavior. */
export const BASELINE_ABOUT_OUT = Object.freeze({
  content: `---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="About">
  <div data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"><p class="lede">BASELINE_LEDE</p></div>
  <bandprofilessection>
</bandprofilessection>
  <section class="bands"><h2>Bands</h2></section>
</BaseLayout>
`,
  profileApplied: true,
  bandsApplied: true,
  bandsImportRemoved: true,
});

export const BASELINE_DISCO_HTML_IN =
  `<div id="comp-llexymga__item-1" class="wixui-repeater__item"><div>「Baseline Album」</div>` +
  `<a href="https://old.base.shop/">https://old.base.shop/</a></div>`;

export const BASELINE_DISCO_OUT = Object.freeze({
  html:
    `<!-- CMS_TARGET: DISCOGRAPHY_INDEX discographyDataSource=supabase -->` +
    `<div id="comp-llexymga__item-1" class="wixui-repeater__item"><div>「Baseline Album」</div>` +
    `<a href="https://new.base.shop/">https://new.base.shop/</a></div>`,
  summary: Object.freeze({
    discographyDataSource: "supabase",
    rowCount: 1,
    patchCount: 1,
    purchasePatchCount: 1,
    artistPatchCount: 0,
    labelPatchCount: 0,
    trackPatchCount: 0,
    trackRowCount: 0,
  }),
});

export const BASELINE_CONTACT_PAGE_IN = `---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Contact">
  <div id="comp-jqbwo704">OLD FORM</div>
</BaseLayout>
`;

export const BASELINE_LEGACY_STUB_HTML =
  `---\n<!-- legacy stub baseline -->\n---\n` +
  `<section class="gosaki-schedule-legacy-stub" data-month="2026-08" data-route="/schedule/2026-08/" data-robots="noindex,follow"></section>\n`;

export const BASELINE_HOOK_METHOD_NAMES = Object.freeze([
  "matchFixture",
  "resolveVisualOverrideSiteSlug",
  "transformAnalysisPages",
  "generateFooter",
  "resolveScheduleDataUsage",
  "shouldSkipScheduleMonthPage",
  "patchDiscographyPageMainHtml",
  "applyScheduleDataPages",
  "applyLegacyMonthStubs",
  "applyPostGenerate",
]);

export const BASELINE_POST_GENERATE_KEYS = Object.freeze([
  "gosakiAboutContentSummary",
  "gosakiBandProfilesSummary",
  "gosakiContactHubspotSummary",
  "gosakiHomeStaleThisWeekSummary",
  "gosakiReadOnlyAdminSummary",
  "gosakiYoutubeEmbedSummary",
  "writtenPaths",
]);

/** Empty Astro project + features on: admin shell still injects; content hooks no-op without pages. */
export const BASELINE_POST_GENERATE_EMPTY_PROJECT = Object.freeze({
  bandApplied: false,
  aboutApplied: false,
  homeThisWeekHideApplied: false,
  ytApplied: false,
  contactApplied: false,
  adminApplied: true,
  writtenPathBasenames: Object.freeze([
    "src/data/gosaki-read-only-admin-dashboard.json",
    "src/data/gosaki-read-only-admin-discography-editor.json",
    "src/lib/gosaki-staging-read-only-admin.ts",
    "src/pages/admin/index.astro",
  ]),
  adminPortalPage: `---
import GosakiStagingReadOnlyAdminPage from "../../components/GosakiStagingReadOnlyAdminPage.astro";
---
<GosakiStagingReadOnlyAdminPage page="portal" />
`,
  adminSummaryShape: Object.freeze({
    applied: true,
    reason: null,
    adminRoute: "/admin/",
    multiRoute: true,
    pagePath: "src/pages/admin/index.astro",
    libPath: "src/lib/gosaki-staging-read-only-admin.ts",
    dashboardPath: "src/data/gosaki-read-only-admin-dashboard.json",
    discographyEditorPath: "src/data/gosaki-read-only-admin-discography-editor.json",
  }),
  adminDashboardSafety: Object.freeze({
    environment: "staging",
    readOnly: true,
    saveEnabled: false,
    productionUploadStop: true,
  }),
});

export const BASELINE_SCHEDULE_APPLY_KEYS = Object.freeze([
  "hubPath",
  "monthPaths",
  "scheduleDataSource",
  "eventCount",
]);

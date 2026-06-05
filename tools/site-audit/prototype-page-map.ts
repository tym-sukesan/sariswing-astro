export type PrototypePageEntry = {
  fileName: string;
  slug: string;
};

/** HTML files to capture (order preserved for reports). */
export const GOSAKI_V4_PROTOTYPE_PAGES: PrototypePageEntry[] = [
  { fileName: "index.html", slug: "index" },
  { fileName: "about.html", slug: "about" },
  { fileName: "schedule-2026-03.html", slug: "schedule-2026-03" },
  { fileName: "schedule-2026-04.html", slug: "schedule-2026-04" },
  { fileName: "schedule-2026-05.html", slug: "schedule-2026-05" },
  { fileName: "schedule-2026-06.html", slug: "schedule-2026-06" },
  { fileName: "schedule-2026-07.html", slug: "schedule-2026-07" },
  { fileName: "discography.html", slug: "discography" },
  { fileName: "contact.html", slug: "contact" },
  { fileName: "link.html", slug: "link" },
];

export function slugFromFileName(fileName: string): string {
  return fileName.replace(/\.html$/i, "");
}

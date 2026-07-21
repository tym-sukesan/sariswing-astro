/**
 * Post-auth live source-of-truth reads for Gosaki staging admin (package-safe).
 * SELECT / GitHub-GET via existing dry-run only — no writes · anon+user JWT only.
 *
 * Schedule / Discography: authenticated Supabase REST.
 * YouTube / About: caller uses existing dry-run Edge (GitHub Contents GET).
 */

export const GOSAKI_ADMIN_LIVE_SITE_SLUG = "gosaki-piano";
export const GOSAKI_ADMIN_STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const GOSAKI_ADMIN_PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

export const GOSAKI_ADMIN_LIVE_READ_PENDING_MESSAGE = "最新データを読み込み中…";
export const GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE =
  "最新データの取得に失敗しました。編集はできません。";

const SCHEDULE_SELECT =
  "id,legacy_id,site_slug,date,month,title,venue,open_time,start_time,price,description,published,updated_at,sort_order";

const DISCOGRAPHY_SELECT =
  "legacy_id,title,artist,label,catalog_number,purchase_url,streaming_url,sort_order,published,release_date,description,cover_image_url,updated_at";

const DISCOGRAPHY_TRACKS_SELECT =
  "id,discography_legacy_id,track_number,title,sort_order,site_slug";

export type GosakiAdminLiveScheduleEvent = {
  id?: string | null;
  legacyId?: string | null;
  date?: string | null;
  yearMonth?: string | null;
  title?: string | null;
  venue?: string | null;
  openTime?: string | null;
  startTime?: string | null;
  price?: string | null;
  description?: string | null;
  published?: boolean;
  updatedAt?: string | null;
};

export type GosakiAdminLiveDiscographyAlbum = {
  legacyId: string;
  title: string;
  artist?: string | null;
  releaseDate?: string | null;
  label?: string | null;
  catalogNumber?: string | null;
  published?: boolean;
  coverImageUrl?: string | null;
  purchaseUrl?: string | null;
  streamingUrl?: string | null;
  description?: string | null;
  trackListText?: string;
  trackCount?: number;
  updatedAt?: string | null;
};

export function assertGosakiAdminLiveReadSupabaseUrlSafe(supabaseUrl: string): boolean {
  const url = String(supabaseUrl ?? "").trim();
  if (!url) return false;
  if (url.includes(GOSAKI_ADMIN_PRODUCTION_REF_STOP)) return false;
  return url.includes(GOSAKI_ADMIN_STAGING_PROJECT_REF);
}

function restHeaders(token: string, anonKey: string): Record<string, string> {
  return {
    Accept: "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  };
}

async function restGetJson(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<{ ok: true; rows: Record<string, unknown>[] } | { ok: false; error: string }> {
  try {
    const res = await fetchImpl(url, { method: "GET", headers });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) {
      return { ok: false, error: "unexpected response shape" };
    }
    return { ok: true, rows: data as Record<string, unknown>[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

function mapScheduleRow(row: Record<string, unknown>): GosakiAdminLiveScheduleEvent {
  const date = String(row.date ?? "").trim();
  const month = String(row.month ?? "").trim();
  const yearMonth =
    month ||
    (date.match(/^(\d{4}-\d{2})/) || [])[1] ||
    "";
  return {
    id: row.id != null ? String(row.id) : null,
    legacyId: row.legacy_id != null ? String(row.legacy_id) : null,
    date: date || null,
    yearMonth: yearMonth || null,
    title: row.title != null ? String(row.title) : "",
    venue: row.venue != null ? String(row.venue) : "",
    openTime: row.open_time != null ? String(row.open_time) : "",
    startTime: row.start_time != null ? String(row.start_time) : "",
    price: row.price != null ? String(row.price) : "",
    description: row.description != null ? String(row.description) : "",
    published: row.published !== false,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  };
}

function formatTrackListText(tracks: Record<string, unknown>[]): string {
  return tracks
    .slice()
    .sort((a, b) => {
      const ao = Number(a.sort_order ?? a.track_number ?? 0);
      const bo = Number(b.sort_order ?? b.track_number ?? 0);
      if (ao !== bo) return ao - bo;
      return Number(a.track_number ?? 0) - Number(b.track_number ?? 0);
    })
    .map((t) => String(t.title ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Authenticated SELECT of gosaki-piano schedules (published + unpublished).
 * Build snapshot must not be treated as SoT after this succeeds.
 */
export async function fetchGosakiSchedulesAuthenticatedLive(input: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  siteSlug?: string;
  fetchImpl?: typeof fetch;
}): Promise<
  | { ok: true; events: GosakiAdminLiveScheduleEvent[]; source: "supabase-authenticated" }
  | { ok: false; error: string; events: [] }
> {
  const supabaseUrl = String(input.supabaseUrl ?? "").trim().replace(/\/$/, "");
  const anonKey = String(input.anonKey ?? "").trim();
  const token = String(input.accessToken ?? "").trim();
  const siteSlug = String(input.siteSlug ?? GOSAKI_ADMIN_LIVE_SITE_SLUG).trim();
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!assertGosakiAdminLiveReadSupabaseUrlSafe(supabaseUrl)) {
    return { ok: false, error: "staging Supabase host gate failed", events: [] };
  }
  if (!anonKey || !token || !siteSlug) {
    return { ok: false, error: "missing auth or siteSlug", events: [] };
  }

  const qs = new URLSearchParams({
    select: SCHEDULE_SELECT,
    site_slug: `eq.${siteSlug}`,
    order: "date.desc,sort_order.asc",
    limit: "200",
  });
  const url = `${supabaseUrl}/rest/v1/schedules?${qs.toString()}`;
  const got = await restGetJson(url, restHeaders(token, anonKey), fetchImpl);
  if (!got.ok) {
    return { ok: false, error: got.error, events: [] };
  }
  if (got.rows.length === 0) {
    return { ok: false, error: "no schedule rows returned", events: [] };
  }

  const events = got.rows.map(mapScheduleRow).filter((e) => e.legacyId || e.id);
  if (events.length === 0) {
    return { ok: false, error: "schedule rows unusable", events: [] };
  }
  return { ok: true, events, source: "supabase-authenticated" };
}

/**
 * Authenticated SELECT of gosaki-piano discography + tracks.
 */
export async function fetchGosakiDiscographyAuthenticatedLive(input: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  siteSlug?: string;
  fetchImpl?: typeof fetch;
}): Promise<
  | {
      ok: true;
      albums: GosakiAdminLiveDiscographyAlbum[];
      source: "supabase-authenticated";
    }
  | { ok: false; error: string; albums: [] }
> {
  const supabaseUrl = String(input.supabaseUrl ?? "").trim().replace(/\/$/, "");
  const anonKey = String(input.anonKey ?? "").trim();
  const token = String(input.accessToken ?? "").trim();
  const siteSlug = String(input.siteSlug ?? GOSAKI_ADMIN_LIVE_SITE_SLUG).trim();
  const fetchImpl = input.fetchImpl ?? fetch;

  if (!assertGosakiAdminLiveReadSupabaseUrlSafe(supabaseUrl)) {
    return { ok: false, error: "staging Supabase host gate failed", albums: [] };
  }
  if (!anonKey || !token || !siteSlug) {
    return { ok: false, error: "missing auth or siteSlug", albums: [] };
  }

  const headers = restHeaders(token, anonKey);
  const releaseQs = new URLSearchParams({
    select: DISCOGRAPHY_SELECT,
    site_slug: `eq.${siteSlug}`,
    order: "sort_order.asc,legacy_id.asc",
    limit: "100",
  });
  const trackQs = new URLSearchParams({
    select: DISCOGRAPHY_TRACKS_SELECT,
    site_slug: `eq.${siteSlug}`,
    order: "sort_order.asc,track_number.asc",
    limit: "500",
  });

  const [releases, tracks] = await Promise.all([
    restGetJson(`${supabaseUrl}/rest/v1/discography?${releaseQs}`, headers, fetchImpl),
    restGetJson(
      `${supabaseUrl}/rest/v1/discography_tracks?${trackQs}`,
      headers,
      fetchImpl,
    ),
  ]);

  if (!releases.ok) {
    return { ok: false, error: `discography: ${releases.error}`, albums: [] };
  }
  if (!tracks.ok) {
    return { ok: false, error: `tracks: ${tracks.error}`, albums: [] };
  }
  if (releases.rows.length === 0) {
    return { ok: false, error: "no discography rows returned", albums: [] };
  }

  const tracksByLegacy: Record<string, Record<string, unknown>[]> = {};
  for (const row of tracks.rows) {
    const legacy = String(row.discography_legacy_id ?? "").trim();
    if (!legacy) continue;
    (tracksByLegacy[legacy] ??= []).push(row);
  }

  const albums: GosakiAdminLiveDiscographyAlbum[] = releases.rows.map((row) => {
    const legacyId = String(row.legacy_id ?? "").trim();
    const albumTracks = tracksByLegacy[legacyId] ?? [];
    return {
      legacyId,
      title: String(row.title ?? ""),
      artist: row.artist != null ? String(row.artist) : null,
      releaseDate: row.release_date != null ? String(row.release_date) : null,
      label: row.label != null ? String(row.label) : null,
      catalogNumber: row.catalog_number != null ? String(row.catalog_number) : null,
      published: row.published !== false,
      coverImageUrl: row.cover_image_url != null ? String(row.cover_image_url) : null,
      purchaseUrl: row.purchase_url != null ? String(row.purchase_url) : null,
      streamingUrl: row.streaming_url != null ? String(row.streaming_url) : null,
      description: row.description != null ? String(row.description) : "",
      trackListText: formatTrackListText(albumTracks),
      trackCount: albumTracks.length,
      updatedAt: row.updated_at != null ? String(row.updated_at) : null,
    };
  }).filter((a) => a.legacyId);

  if (albums.length === 0) {
    return { ok: false, error: "discography rows unusable", albums: [] };
  }
  return { ok: true, albums, source: "supabase-authenticated" };
}

/**
 * Pure helper: prefer server current over build snapshot (for verifiers).
 */
export function preferLiveSourceOverBuildSnapshot<T>(input: {
  buildSnapshot: T;
  liveSource: T | null;
  liveOk: boolean;
}): { value: T; usedLive: boolean; editable: boolean; error?: string } {
  if (input.liveOk && input.liveSource != null) {
    return { value: input.liveSource, usedLive: true, editable: true };
  }
  return {
    value: input.buildSnapshot,
    usedLive: false,
    editable: false,
    error: "live source unavailable — build snapshot is not editable SoT",
  };
}

/** idle → loading → ready|error. ready/error never auto-return to loading for the same auth session. */
export type GosakiAdminLiveReadPhase = "idle" | "loading" | "ready" | "error";

export function gosakiAdminLiveReadAuthFingerprint(input: {
  signedIn?: boolean;
  userId?: string | null;
  email?: string | null;
}): string {
  if (!input?.signedIn) return "signed-out";
  const userId = String(input.userId ?? "").trim();
  if (userId) return `user:${userId}`;
  const email = String(input.email ?? "").trim();
  if (email) return `email:${email}`;
  return "signed-in:session";
}

function isSignedInLiveReadFingerprint(fp: string): boolean {
  return Boolean(fp) && fp !== "signed-out";
}

/**
 * Same browser auth session (no logout between) — seed `signed-in:session` and later `user:…`
 * must not trigger a second live-read.
 */
export function sameGosakiAdminLiveReadAuthSession(
  a: string | null | undefined,
  b: string,
): boolean {
  if (!a) return false;
  if (a === b) return true;
  if (!isSignedInLiveReadFingerprint(a) || !isSignedInLiveReadFingerprint(b)) return false;
  if (a.startsWith("user:") && b.startsWith("user:")) return a === b;
  return true;
}

/**
 * Deterministic live-read controller: one fetch per auth session (single-flight).
 * Does not use debounce/timeouts to hide loops.
 */
export function createGosakiAdminLiveReadSession(handlers: {
  onPhaseChange: (phase: GosakiAdminLiveReadPhase, error?: string) => void;
  fetchLive: () => Promise<{ ok: true } | { ok: false; error: string }>;
  /** When true, skip starting a fetch without changing phase (e.g. dirty edit form). */
  shouldDefer?: () => boolean;
}): {
  notifyAuth: (fingerprint: string) => Promise<void>;
  requestManualReload: () => Promise<void>;
  getPhase: () => GosakiAdminLiveReadPhase;
  getBoundAuthFingerprint: () => string | null;
  getFetchCount: () => number;
} {
  let phase: GosakiAdminLiveReadPhase = "idle";
  let boundAuthFp: string | null = null;
  let inFlight: Promise<void> | null = null;
  let fetchCount = 0;
  let generation = 0;

  function setPhase(next: GosakiAdminLiveReadPhase, error?: string) {
    phase = next;
    handlers.onPhaseChange(next, error);
  }

  async function runOnce(authFp: string, force: boolean): Promise<void> {
    if (authFp === "signed-out") {
      generation += 1;
      boundAuthFp = null;
      inFlight = null;
      setPhase("idle");
      return;
    }

    if (!force) {
      if (
        (phase === "ready" || phase === "error") &&
        sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp)
      ) {
        return;
      }
      if (
        phase === "loading" &&
        sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp) &&
        inFlight
      ) {
        return inFlight;
      }
    }

    if (!force && handlers.shouldDefer?.()) {
      return;
    }

    if (inFlight && !force) {
      await inFlight;
      if (
        (phase === "ready" || phase === "error") &&
        sameGosakiAdminLiveReadAuthSession(boundAuthFp, authFp)
      ) {
        return;
      }
    }

    const myGen = ++generation;
    boundAuthFp = authFp;
    setPhase("loading");
    const work = (async () => {
      fetchCount += 1;
      try {
        const result = await handlers.fetchLive();
        if (myGen !== generation) return;
        if (result.ok) setPhase("ready");
        else setPhase("error", result.error || GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE);
      } catch {
        if (myGen !== generation) return;
        setPhase("error", GOSAKI_ADMIN_LIVE_READ_ERROR_MESSAGE);
      } finally {
        if (myGen === generation) inFlight = null;
      }
    })();
    inFlight = work;
    await work;
  }

  return {
    notifyAuth: (fingerprint) => runOnce(String(fingerprint || "signed-out"), false),
    requestManualReload: () =>
      runOnce(boundAuthFp && isSignedInLiveReadFingerprint(boundAuthFp)
        ? boundAuthFp
        : "signed-in:session", true),
    getPhase: () => phase,
    getBoundAuthFingerprint: () => boundAuthFp,
    getFetchCount: () => fetchCount,
  };
}

/* ==========================================================
   Sportsbook data from The Odds API (https://the-odds-api.com)

   What this file does
   - Game lines: consensus spread and total for each game.
   - Player props: passing yards (QB), rushing yards (RB), and
     receiving yards (WR, TE) lines.
   - Weekly snapshots: lines are saved to a small database
     (Upstash Redis, connected through Vercel) BEFORE each game
     kicks off. After kickoff sportsbooks switch to live in-game
     numbers and then drop the game entirely, so without a saved
     copy those players would show wrong or missing lines.

   Environment variables (set in Vercel)
   - ODDS_API_KEY     your Odds API key
   - CRON_SECRET      any long random text; protects /api/snapshot
   - Upstash Redis    added automatically when you connect the
                      database (KV_REST_API_URL / KV_REST_API_TOKEN
                      or UPSTASH_REDIS_REST_URL / _TOKEN)

   Nothing here ever throws. If something is missing or fails, the
   board runs without that piece and a short note explains why.
   ========================================================== */

export type GameLine = {
  eventId: string;
  home: string; // Sleeper-style abbreviation, e.g. "KC"
  away: string;
  total: number; // consensus game total
  homeSpread: number; // consensus home spread (negative = home favored)
  kickoff: string; // ISO time
};

export type PropMarket = "pass" | "rush" | "rec";

export type PropRow = {
  key: string; // normalized player name
  name: string;
  market: PropMarket;
  line: number;
};

export type WeekLines = {
  games: GameLine[];
  props: Record<string, PropRow[]>; // by eventId
  note: string;
  source: "snapshot" | "live" | "none";
};

type Snapshot = {
  updated: string;
  games: Record<string, GameLine>; // by eventId
  props: Record<string, PropRow[]>; // by eventId
  propsFetchedAt: Record<string, string>; // by eventId
};

/* ---------- Settings ---------- */

const SPORT = "americanfootball_nfl";
const API = "https://api.the-odds-api.com/v4";

// Fetch player props for a game only when it kicks off within this many hours.
const PROPS_WINDOW_HOURS = 24;
// And don't refetch a game's props more often than this.
const PROPS_MIN_AGE_HOURS = 18;
// Saved weekly snapshots are kept this long.
const SNAPSHOT_TTL_SECONDS = 60 * 60 * 24 * 21;

const PROP_MARKETS: Record<string, PropMarket> = {
  player_pass_yds: "pass",
  player_rush_yds: "rush",
  player_reception_yds: "rec",
};

// The Odds API uses full team names. Sleeper uses abbreviations.
const TEAM_ABBR: Record<string, string> = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
};

/* ---------- Raw response shapes ---------- */

type RawOutcome = { name: string; description?: string; point?: number };
type RawMarket = { key: string; outcomes?: RawOutcome[] };
type RawBook = { markets?: RawMarket[] };
type RawEvent = {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: RawBook[];
};

/* ---------- Small helpers ---------- */

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sportsbooks quote in half points, so snap averages to the nearest 0.5.
function toHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

// Lets "Marvin Harrison Jr." match "Marvin Harrison".
export function normName(s: string): string {
  const skip = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !skip.has(t))
    .join(" ");
}

function etLabel(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET"
  );
}

/* ---------- Redis (Upstash) over plain HTTP, no extra packages ---------- */

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function hasRedis(): boolean {
  return redisConfig() !== null;
}

async function redisGet(key: string, cacheSeconds: number | "fresh"): Promise<string | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  const res = await fetch(`${cfg.url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${cfg.token}` },
    ...(cacheSeconds === "fresh"
      ? { cache: "no-store" as const }
      : { next: { revalidate: cacheSeconds } }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: string | null };
  return data.result ?? null;
}

async function redisSet(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const cfg = redisConfig();
  if (!cfg) return false;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["SET", key, value, "EX", ttlSeconds]),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  return res.ok;
}

function snapshotKey(season: string, week: number): string {
  return `edge-lines-${season}-${week}`;
}

/* ---------- Game lines (spreads and totals) ---------- */

type LiveResult = { games: GameLine[]; note: string; credits: string | null };

// Only returns games that have NOT kicked off. After kickoff the feed shows
// in-game numbers (like a 61.5 total that was 47.5 before the game), and
// those would be wrong as pregame lines.
async function fetchUpcomingGames(fresh: boolean): Promise<LiveResult> {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    return { games: [], note: "No ODDS_API_KEY is set in Vercel yet.", credits: null };
  }

  try {
    const url =
      `${API}/sports/${SPORT}/odds` +
      "?regions=us&markets=spreads,totals&oddsFormat=american" +
      `&apiKey=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 21600 } }),
      signal: AbortSignal.timeout(10000),
    });
    const credits = res.headers.get("x-requests-remaining");

    if (!res.ok) {
      const hint = res.status === 401 ? " (the key was rejected)" : "";
      return { games: [], note: `The Odds API returned status ${res.status}${hint}.`, credits };
    }

    const events = (await res.json()) as RawEvent[];
    if (!Array.isArray(events) || events.length === 0) {
      return { games: [], note: "The Odds API returned no NFL games right now.", credits };
    }

    const now = Date.now();
    const games: GameLine[] = [];
    for (const ev of events) {
      if (new Date(ev.commence_time).getTime() <= now) continue; // already started
      const home = TEAM_ABBR[ev.home_team];
      const away = TEAM_ABBR[ev.away_team];
      if (!home || !away) continue;

      const spreads: number[] = [];
      const totals: number[] = [];
      for (const book of ev.bookmakers ?? []) {
        for (const market of book.markets ?? []) {
          if (market.key === "spreads") {
            const o = market.outcomes?.find((x) => x.name === ev.home_team);
            if (o && typeof o.point === "number") spreads.push(o.point);
          }
          if (market.key === "totals") {
            const o = market.outcomes?.find((x) => x.name === "Over");
            if (o && typeof o.point === "number") totals.push(o.point);
          }
        }
      }

      const spread = average(spreads);
      const total = average(totals);
      if (spread === null || total === null) continue;

      games.push({
        eventId: ev.id,
        home,
        away,
        total: toHalf(total),
        homeSpread: toHalf(spread),
        kickoff: ev.commence_time,
      });
    }

    if (games.length === 0) {
      return { games: [], note: "No upcoming games with usable spreads and totals.", credits };
    }
    return { games, note: `${games.length} upcoming games loaded.`, credits };
  } catch (err) {
    return {
      games: [],
      note: `The odds request failed: ${err instanceof Error ? err.message : "unknown error"}`,
      credits: null,
    };
  }
}

/* ---------- Player props (one request per game) ---------- */

async function fetchGameProps(eventId: string): Promise<PropRow[]> {
  const key = process.env.ODDS_API_KEY ?? "";
  const url =
    `${API}/sports/${SPORT}/events/${encodeURIComponent(eventId)}/odds` +
    `?regions=us&markets=${Object.keys(PROP_MARKETS).join(",")}&oddsFormat=american` +
    `&apiKey=${encodeURIComponent(key)}`;

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`status ${res.status}`);

  const data = (await res.json()) as { bookmakers?: RawBook[] };
  const buckets = new Map<string, { name: string; market: PropMarket; points: number[] }>();

  for (const book of data.bookmakers ?? []) {
    for (const market of book.markets ?? []) {
      const kind = PROP_MARKETS[market.key];
      if (!kind) continue;
      for (const o of market.outcomes ?? []) {
        if (o.name !== "Over" || !o.description || typeof o.point !== "number") continue;
        const k = `${kind}|${normName(o.description)}`;
        const bucket = buckets.get(k) ?? { name: o.description, market: kind, points: [] };
        bucket.points.push(o.point);
        buckets.set(k, bucket);
      }
    }
  }

  const rows: PropRow[] = [];
  buckets.forEach((b) => {
    const avg = average(b.points);
    if (avg !== null) {
      rows.push({ key: normName(b.name), name: b.name, market: b.market, line: toHalf(avg) });
    }
  });
  return rows;
}

/* ==========================================================
   Used by the board: get this week's lines
   ========================================================== */

export async function getWeekLines(season: string, week: number): Promise<WeekLines> {
  // 1. Saved snapshot (best: includes games that already kicked off).
  try {
    const raw = await redisGet(snapshotKey(season, week), 300);
    if (raw) {
      const snap = JSON.parse(raw) as Snapshot;
      const games = Object.values(snap.games ?? {});
      if (games.length > 0) {
        const propGames = Object.values(snap.props ?? {}).filter((p) => p.length > 0).length;
        return {
          games,
          props: snap.props ?? {},
          source: "snapshot",
          note: `Saved pregame lines, updated ${etLabel(snap.updated)}. ${games.length} games, player props for ${propGames}.`,
        };
      }
    }
  } catch {
    // fall through to live
  }

  // 2. Live feed, upcoming games only (no props on this path, to save credits).
  const live = await fetchUpcomingGames(false);
  const why = hasRedis()
    ? " No saved snapshot yet. Visit /api/snapshot once to create it."
    : " Database not connected, so games that already kicked off have no lines.";
  return {
    games: live.games,
    props: {},
    source: live.games.length > 0 ? "live" : "none",
    note: `${live.note}${why}`,
  };
}

/* ==========================================================
   Used by /api/snapshot: fetch and save this week's lines
   ========================================================== */

export async function runSnapshot(season: string, week: number): Promise<string[]> {
  const log: string[] = [];

  if (!process.env.ODDS_API_KEY) return ["No ODDS_API_KEY is set."];
  if (!hasRedis()) {
    return ["The database is not connected. Add Upstash Redis in Vercel, Storage."];
  }

  const key = snapshotKey(season, week);

  // Load what we already saved this week.
  let snap: Snapshot = { updated: "", games: {}, props: {}, propsFetchedAt: {} };
  try {
    const raw = await redisGet(key, "fresh");
    if (raw) snap = { ...snap, ...(JSON.parse(raw) as Partial<Snapshot>) };
  } catch {
    log.push("Could not read the existing snapshot; starting a new one.");
  }

  // Game lines for everything that has not kicked off.
  const live = await fetchUpcomingGames(true);
  log.push(live.note);
  for (const g of live.games) {
    snap.games[g.eventId] = g; // safe: only pregame games are returned
  }

  // Player props for games kicking off soon.
  const now = Date.now();
  const windowMs = PROPS_WINDOW_HOURS * 3600 * 1000;
  const minAgeMs = PROPS_MIN_AGE_HOURS * 3600 * 1000;
  let propsCalls = 0;

  for (const g of Object.values(snap.games)) {
    const until = new Date(g.kickoff).getTime() - now;
    if (until <= 0 || until > windowMs) continue;

    const last = snap.propsFetchedAt[g.eventId];
    if (last && now - new Date(last).getTime() < minAgeMs) continue;

    try {
      const rows = await fetchGameProps(g.eventId);
      propsCalls += 1;
      if (rows.length > 0) {
        snap.props[g.eventId] = rows;
        snap.propsFetchedAt[g.eventId] = new Date().toISOString();
      } else {
        log.push(`${g.away} at ${g.home}: props not posted yet.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error";
      log.push(`${g.away} at ${g.home}: props request failed (${msg}). Stopping props for this run.`);
      break;
    }
  }
  log.push(`Player prop requests made: ${propsCalls}.`);

  snap.updated = new Date().toISOString();
  const saved = await redisSet(key, JSON.stringify(snap), SNAPSHOT_TTL_SECONDS);
  log.push(
    saved
      ? `Saved snapshot: ${Object.keys(snap.games).length} games, props for ${
          Object.values(snap.props).filter((p) => p.length > 0).length
        }.`
      : "FAILED to save the snapshot to the database."
  );
  if (live.credits) log.push(`Odds API credits left this month: ${live.credits}.`);

  return log;
}

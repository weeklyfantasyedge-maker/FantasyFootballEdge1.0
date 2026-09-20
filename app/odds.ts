/* ==========================================================
   Sportsbook lines (spread and game total) from The Odds API.
   https://the-odds-api.com

   - Needs an environment variable named ODDS_API_KEY (set in Vercel).
   - Costs 2 credits per refresh (spreads + totals, 1 region).
   - Refreshes every 6 hours, so about 240 of the 500 free credits a month.
   - Never throws. If anything goes wrong it returns no games plus a
     short note, and the board simply runs without odds.
   ========================================================== */

export type GameLine = {
  home: string; // Sleeper-style abbreviation, e.g. "KC"
  away: string;
  total: number; // consensus game total
  homeSpread: number; // consensus home spread (negative = home favored)
  kickoff: string; // ISO time
};

export type OddsResult = {
  games: GameLine[];
  note: string;
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

type RawOutcome = { name: string; point?: number };
type RawMarket = { key: string; outcomes?: RawOutcome[] };
type RawBook = { markets?: RawMarket[] };
type RawEvent = {
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: RawBook[];
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sportsbooks quote in half points, so snap the average to the nearest 0.5.
function toHalf(n: number): number {
  return Math.round(n * 2) / 2;
}

export async function getGameLines(): Promise<OddsResult> {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    return { games: [], note: "No ODDS_API_KEY is set in Vercel yet." };
  }

  try {
    const url =
      "https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds" +
      "?regions=us&markets=spreads,totals&oddsFormat=american" +
      `&apiKey=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const hint = res.status === 401 ? " (the key was rejected)" : "";
      return { games: [], note: `The Odds API returned status ${res.status}${hint}.` };
    }

    const events = (await res.json()) as RawEvent[];
    if (!Array.isArray(events) || events.length === 0) {
      return { games: [], note: "The Odds API returned no NFL games right now." };
    }

    const games: GameLine[] = [];
    for (const ev of events) {
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
        home,
        away,
        total: toHalf(total),
        homeSpread: toHalf(spread),
        kickoff: ev.commence_time,
      });
    }

    if (games.length === 0) {
      return { games: [], note: "Read the odds feed but found no usable spreads and totals." };
    }

    const left = res.headers.get("x-requests-remaining");
    return {
      games,
      note: left ? `${games.length} games loaded. Credits left this month: ${left}.` : `${games.length} games loaded.`,
    };
  } catch (err) {
    return {
      games: [],
      note: `The odds request failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}

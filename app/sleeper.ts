/* ==========================================================
   Pulls this week's projections from Sleeper and turns them
   into the Edge Board. Runs on the server, never in the browser.

   Sleeper endpoints used:
   - /v1/state/nfl          current season and week (documented)
   - /projections/nfl/...   weekly projections for all players (undocumented,
                            but widely used; it could change without notice)
   - /v1/players/nfl        full player list, only used as a backup for names

   If anything fails, getBoard() returns the demo board so the
   site never shows an error page.
   ========================================================== */

import { DEMO_BOARD, callFor } from "./board";
import { getWeekLines, normName } from "./odds";
import type { GameLine, PropMarket, PropRow } from "./odds";
import type { BoardData, Player, Pos } from "./board";

/* ---------- Settings you can change ---------- */

// Which Sleeper scoring column to rank by: "pts_ppr", "pts_half_ppr", or "pts_std"
const SCORING: "pts_ppr" | "pts_half_ppr" | "pts_std" = "pts_ppr";

// How many players per position make the board.
const POOL: Record<Pos, number> = { QB: 30, RB: 60, WR: 80, TE: 30 };

// The "replacement level" rank per position (roughly a 12-team league).
// A player's gap is his projection minus the projection at this rank.
const REPLACEMENT: Record<Pos, number> = { QB: 12, RB: 30, WR: 36, TE: 12 };

// How much each piece counts toward the 0 to 100 Edge score.
// Sleeper's projections already bake in some game context, so the sportsbook
// (Environment) piece is kept modest.
const WEIGHTS_WITH_ODDS = { pts: 0.4, dep: 0.25, eff: 0.2, env: 0.15 };
const WEIGHTS_NO_ODDS = { pts: 0.45, dep: 0.3, eff: 0.25, env: 0 };

// Implied team scores run from roughly 16 (bad) to 30 (great).
const IMPLIED_LOW = 16;
const IMPLIED_HIGH = 30;

/* ---------- Types for Sleeper's responses ---------- */

const BASE = "https://api.sleeper.app";
const POSITIONS: Pos[] = ["QB", "RB", "WR", "TE"];

type RawState = {
  week: number;
  season: string;
  season_type: string;
};

type RawPlayer = {
  first_name?: string | null;
  last_name?: string | null;
  position?: string | null;
  team?: string | null;
  injury_status?: string | null;
};

type RawProjection = {
  player_id: string;
  team?: string | null;
  opponent?: string | null;
  player?: RawPlayer | null;
  stats?: Record<string, number> | null;
};

type Env = {
  eventId: string;
  total: number;
  teamSpread: number; // negative = this team is favored
  implied: number; // implied team score from the total and spread
  isHome: boolean;
  opp: string;
};

type Candidate = {
  id: string;
  name: string;
  pos: Pos;
  team: string;
  opp: string;
  pts: number;
  opps: number;
  eff: number;
  injury: string;
  env: Env | null;
  propLine: number | null;
};

/* ---------- Helpers ---------- */

async function getJson<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Sleeper returned ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

function demo(reason: string): BoardData {
  console.error("Edge Board showing demo data:", reason);
  return { ...DEMO_BOARD, reason };
}

function isPos(value: string | null | undefined): value is Pos {
  return value === "QB" || value === "RB" || value === "WR" || value === "TE";
}

// Rank-based percentile inside a group: best = 1, worst = 0.
function percentiles(values: number[]): number[] {
  const n = values.length;
  if (n <= 1) return values.map(() => 1);
  const order = values
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v);
  const out = new Array<number>(n).fill(0);
  order.forEach((o, rank) => {
    out[o.i] = 1 - rank / (n - 1);
  });
  return out;
}

function lineFor(games: GameLine[], team: string, opp: string): Env | null {
  if (!team) return null;
  let g = games.find(
    (x) => (x.home === team && x.away === opp) || (x.away === team && x.home === opp)
  );
  // If Sleeper gave no opponent, fall back to the team's earliest listed game.
  if (!g && !opp) {
    g = games
      .filter((x) => x.home === team || x.away === team)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  }
  if (!g) return null;
  const isHome = g.home === team;
  const teamSpread = isHome ? g.homeSpread : -g.homeSpread;
  return {
    eventId: g.eventId,
    total: g.total,
    teamSpread,
    implied: g.total / 2 - teamSpread / 2,
    isHome,
    opp: isHome ? g.away : g.home,
  };
}

function fmtSpread(n: number): string {
  if (n === 0) return "PK";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}`;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Injury designations that keep a player off the board entirely.
const OUT_STATUSES = new Set(["Out", "IR", "PUP", "Sus", "NA", "DNR", "COV"]);

function injuryPenalty(status: string): number {
  if (status === "Doubtful") return 35;
  if (status === "Questionable") return 12;
  return 0;
}

// Which sportsbook prop goes with each position.
const PROP_MARKET: Record<Pos, PropMarket> = { QB: "pass", RB: "rush", WR: "rec", TE: "rec" };
const PROP_LABEL: Record<Pos, string> = {
  QB: "Passing yards",
  RB: "Rushing yards",
  WR: "Receiving yards",
  TE: "Receiving yards",
};

function propFor(rows: PropRow[] | undefined, name: string, pos: Pos): number | null {
  if (!rows) return null;
  const key = normName(name);
  const hit = rows.find((r) => r.key === key && r.market === PROP_MARKET[pos]);
  return hit ? hit.line : null;
}

function buildSummary(c: Candidate, edge: number): string {
  const label = PROP_LABEL[c.pos].toLowerCase();
  const parts: string[] = [];

  if (c.env) {
    const e = c.env;
    const role =
      e.teamSpread < 0
        ? `a ${Math.abs(e.teamSpread)}-point favorite`
        : e.teamSpread > 0
          ? `a ${e.teamSpread}-point underdog`
          : "a pick'em";
    parts.push(
      `${c.team} ${e.isHome ? "is at home against" : "is on the road at"} ${e.opp} as ${role} in a game with a ${e.total}-point total, which puts the team total near ${e.implied.toFixed(1)}.`
    );
    parts.push(
      c.propLine !== null
        ? `The ${label} line for ${c.name} is ${c.propLine}.`
        : `No ${label} line is posted for ${c.name} yet.`
    );
  } else {
    parts.push("Sportsbook lines are not available for this game.");
  }

  const workload = c.pos === "QB" ? "pass and rush attempts" : "carries and targets";
  parts.push(
    `Sleeper projects ${c.pts.toFixed(1)} points on about ${Math.round(c.opps)} ${workload}.`
  );
  parts.push(`That gives him an Edge score of ${edge}, which is a ${callFor(edge)} call.`);

  if (c.injury === "Questionable") parts.push("He is listed as questionable, so check his status before lock.");
  if (c.injury === "Doubtful") parts.push("He is listed as doubtful. Have a backup ready.");

  return parts.join(" ");
}

function buildNote(c: Candidate): string {
  const opps = Math.round(c.opps);
  const workload =
    c.pos === "QB"
      ? `${opps} pass and rush attempts`
      : `${opps} ${opps === 1 ? "opportunity" : "opportunities"}`;
  let note = `Projected for ${c.pts.toFixed(1)} points on about ${workload}.`;
  if (c.env) note += ` Books have ${c.team} at about ${c.env.implied.toFixed(1)} points.`;
  if (c.injury === "Questionable") note += " Listed as questionable, so check status before lock.";
  if (c.injury === "Doubtful") note += " Listed as doubtful. Have a backup ready.";
  return note;
}

function updatedLabel(): string {
  return (
    new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET"
  );
}

/* ---------- Main ---------- */

export async function getBoard(): Promise<BoardData> {
  try {
    const state = await getJson<RawState>("/v1/state/nfl", 900);

    // Offseason or playoffs: keep the demo board instead of showing stale numbers.
    if (state.season_type !== "regular" || !state.week) {
      return demo(
        `Sleeper says the season type is "${state.season_type}" and the week is ${state.week}.`
      );
    }

    const query =
      `?season_type=regular&order_by=${SCORING}` +
      POSITIONS.map((p) => `&position[]=${p}`).join("");

    const raw = await getJson<RawProjection[]>(
      `/projections/nfl/${state.season}/${state.week}${query}`,
      1800
    );

    if (!Array.isArray(raw) || raw.length === 0) {
      return demo(
        `Sleeper returned no projections for season ${state.season}, week ${state.week}.`
      );
    }

    // Backup: only fetch the big player list if projections don't carry player info.
    let playerMap: Record<string, RawPlayer> | null = null;
    if (raw.some((r) => !r.player)) {
      playerMap = await getJson<Record<string, RawPlayer>>("/v1/players/nfl", 86400);
    }

    // Sportsbook lines and player props. Never throws.
    const oddsResult = await getWeekLines(state.season, state.week);

    // 1. Turn raw rows into clean candidates.
    const candidates: Candidate[] = [];
    for (const r of raw) {
      const info: RawPlayer | undefined = r.player ?? playerMap?.[r.player_id];
      const stats = r.stats ?? {};
      const pts = Number(stats[SCORING] ?? 0);
      const pos = info?.position;

      if (!info || !isPos(pos) || !Number.isFinite(pts) || pts < 2) continue;

      const injury = info.injury_status ?? "";
      if (OUT_STATUSES.has(injury)) continue;

      const rush = Number(stats.rush_att ?? 0);
      const tgt = Number(stats.rec_tgt ?? 0);
      const pass = Number(stats.pass_att ?? 0);
      const opps = pos === "QB" ? pass + rush : rush + tgt;
      if (opps <= 0) continue;

      const name = `${info.first_name ?? ""} ${info.last_name ?? ""}`.trim();
      if (!name) continue;

      const team = r.team ?? info.team ?? "";
      const opp = r.opponent ?? "";

      const env = lineFor(oddsResult.games, team, opp);

      candidates.push({
        id: r.player_id,
        name,
        pos,
        team,
        opp,
        pts,
        opps,
        eff: pts / opps,
        injury,
        env,
        propLine: env ? propFor(oddsResult.props[env.eventId], name, pos) : null,
      });
    }

    // Use the odds piece only if lines matched a healthy share of players.
    const matched = candidates.filter((c) => c.env).length;
    const hasOdds = candidates.length > 0 && matched / candidates.length >= 0.5;
    const w = hasOdds ? WEIGHTS_WITH_ODDS : WEIGHTS_NO_ODDS;

    // 2. Score each position group against its own pool.
    const players: Player[] = [];
    for (const pos of POSITIONS) {
      const group = candidates
        .filter((c) => c.pos === pos)
        .sort((a, b) => b.pts - a.pts)
        .slice(0, POOL[pos]);
      if (group.length === 0) continue;

      const replacementIdx = Math.min(REPLACEMENT[pos], group.length) - 1;
      const replacementPts = group[replacementIdx].pts;

      const ptsPct = percentiles(group.map((c) => c.pts));
      const depPct = percentiles(group.map((c) => c.opps));
      const effPct = percentiles(group.map((c) => c.eff));

      group.forEach((c, i) => {
        const envScore = c.env
          ? clamp01((c.env.implied - IMPLIED_LOW) / (IMPLIED_HIGH - IMPLIED_LOW))
          : 0.5;
        const raw100 =
          100 * (w.pts * ptsPct[i] + w.dep * depPct[i] + w.eff * effPct[i] + w.env * envScore);
        const edge = Math.max(0, Math.min(99, Math.round(raw100 - injuryPenalty(c.injury))));

        players.push({
          id: c.id,
          name: c.name,
          pos,
          spot: c.env
            ? `${c.team} ${c.env.isHome ? "vs." : "at"} ${c.env.opp}, O/U ${c.env.total}, ${c.team} ${fmtSpread(c.env.teamSpread)}`
            : c.team
              ? c.opp
                ? `${c.team}, facing ${c.opp}`
                : c.team
              : "Team unknown",
          edge,
          gap: Math.round((c.pts - replacementPts) * 10) / 10,
          note: buildNote(c),
          report: {
            team: c.team,
            opp: c.env ? c.env.opp : c.opp,
            isHome: c.env ? c.env.isHome : false,
            gameTotal: c.env ? c.env.total : null,
            teamSpread: c.env ? c.env.teamSpread : null,
            teamTotal: c.env ? Math.round(c.env.implied * 10) / 10 : null,
            propLabel: PROP_LABEL[pos],
            propLine: c.propLine,
            summary: buildSummary(c, edge),
          },
        });
      });
    }

    if (players.length < 10) {
      return demo(
        `Read ${raw.length} projection rows but only ${players.length} were usable. First row: ${JSON.stringify(raw[0]).slice(0, 400)}`
      );
    }

    return {
      week: state.week,
      live: true,
      updated: updatedLabel(),
      gapLabel: "pts over replacement",
      players,
      odds: hasOdds,
      oddsNote: `${oddsResult.note} Matched ${matched} of ${candidates.length} players to a game.`,
    };
  } catch (err) {
    return demo(`Sleeper request failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

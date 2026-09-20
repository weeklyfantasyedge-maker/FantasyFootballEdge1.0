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

import { DEMO_BOARD, DEMO_WEEK } from "./board";
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
const W_POINTS = 0.45; // projected points
const W_DEPLOY = 0.3; // expected workload
const W_EFFICIENCY = 0.25; // points per opportunity

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
};

/* ---------- Helpers ---------- */

async function getJson<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`Sleeper returned ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
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

// Injury designations that keep a player off the board entirely.
const OUT_STATUSES = new Set(["Out", "IR", "PUP", "Sus", "NA", "DNR", "COV"]);

function injuryPenalty(status: string): number {
  if (status === "Doubtful") return 35;
  if (status === "Questionable") return 12;
  return 0;
}

function buildNote(c: Candidate): string {
  const opps = Math.round(c.opps);
  const workload =
    c.pos === "QB"
      ? `${opps} pass and rush attempts`
      : `${opps} ${opps === 1 ? "opportunity" : "opportunities"}`;
  let note = `Projected for ${c.pts.toFixed(1)} points on about ${workload}.`;
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
      return DEMO_BOARD;
    }

    const query =
      `?season_type=regular&order_by=${SCORING}` +
      POSITIONS.map((p) => `&position[]=${p}`).join("");

    const raw = await getJson<RawProjection[]>(
      `/projections/nfl/${state.season}/${state.week}${query}`,
      1800
    );

    if (!Array.isArray(raw) || raw.length === 0) {
      return DEMO_BOARD;
    }

    // Backup: only fetch the big player list if projections don't carry player info.
    let playerMap: Record<string, RawPlayer> | null = null;
    if (raw.some((r) => !r.player)) {
      playerMap = await getJson<Record<string, RawPlayer>>("/v1/players/nfl", 86400);
    }

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

      candidates.push({
        id: r.player_id,
        name,
        pos,
        team: r.team ?? info.team ?? "",
        opp: r.opponent ?? "",
        pts,
        opps,
        eff: pts / opps,
        injury,
      });
    }

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
        const raw100 =
          100 * (W_POINTS * ptsPct[i] + W_DEPLOY * depPct[i] + W_EFFICIENCY * effPct[i]);
        const edge = Math.max(0, Math.min(99, Math.round(raw100 - injuryPenalty(c.injury))));

        players.push({
          id: c.id,
          name: c.name,
          pos,
          spot: c.team ? (c.opp ? `${c.team}, facing ${c.opp}` : c.team) : "Team unknown",
          edge,
          gap: Math.round((c.pts - replacementPts) * 10) / 10,
          note: buildNote(c),
        });
      });
    }

    if (players.length < 10) return DEMO_BOARD;

    return {
      week: state.week,
      live: true,
      updated: updatedLabel(),
      gapLabel: "pts over replacement",
      players,
    };
  } catch (err) {
    console.error("Sleeper board failed, using demo data:", err);
    return { ...DEMO_BOARD, week: DEMO_WEEK };
  }
}

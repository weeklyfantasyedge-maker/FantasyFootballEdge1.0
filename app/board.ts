/* ==========================================================
   Shared board types and settings.
   Used by both the server (sleeper.ts) and the page (Home.tsx).
   ========================================================== */

export type Pos = "QB" | "RB" | "WR" | "TE";
export type Call = "Start" | "Flex" | "Sit";

export type Player = {
  id: string;
  name: string;
  pos: Pos;
  spot: string;
  edge: number; // 0 to 100
  gap: number; // points above replacement (live) or vs. consensus (demo)
  note: string;
};

export type BoardData = {
  week: number;
  live: boolean; // true = real Sleeper data, false = demo fallback
  updated: string | null; // "Sep 20, 3:00 PM ET"
  gapLabel: string;
  players: Player[];
   reason? string;
};

// Edge score cutoffs that decide each call.
export const START_AT = 70;
export const FLEX_AT = 45;

export const CALL_COLOR: Record<Call, string> = {
  Start: "#39ff5a",
  Flex: "#ffc23d",
  Sit: "#ff5a4f",
};

export function callFor(edge: number): Call {
  if (edge >= START_AT) return "Start";
  if (edge >= FLEX_AT) return "Flex";
  return "Sit";
}

/* ==========================================================
   DEMO DATA
   Only shown if Sleeper can't be reached (or in the offseason),
   so the site never breaks.
   ========================================================== */

export const DEMO_WEEK = 3;

type DemoRow = Omit<Player, "id">;

const DEMO_ROWS: DemoRow[] = [
  { name: "Jaylen Brooks", pos: "RB", spot: "Home, 22 touches expected", edge: 91, gap: 4.2, note: "Lead back with goal-line work against a soft run defense." },
  { name: "Marcus Delray", pos: "QB", spot: "Home, high game total", edge: 84, gap: 3.1, note: "A shootout script keeps the ball in his hands all game." },
  { name: "Isaiah Cartwright", pos: "WR", spot: "Away, target leader", edge: 78, gap: 2.6, note: "Owns the target share and draws a thin secondary." },
  { name: "Owen Pruitt", pos: "TE", spot: "Home, red-zone role", edge: 72, gap: 1.9, note: "One of the few tight ends with a locked-in scoring role." },
  { name: "Dante Rivas", pos: "RB", spot: "Away, shared backfield", edge: 66, gap: 0.8, note: "Efficient runner, but the touches are split. A flex, not a lock." },
  { name: "Devon Kessler", pos: "WR", spot: "Home, WR2 role", edge: 61, gap: 0.4, note: "The volume is fine. His ceiling depends on game script." },
  { name: "Cole Whitaker", pos: "QB", spot: "Away, windy forecast", edge: 55, gap: -0.3, note: "Wind trims the deep passing game. Safe floor, capped ceiling." },
  { name: "Gabe Lindqvist", pos: "TE", spot: "Away, targets dipping", edge: 48, gap: -0.9, note: "Snaps are steady but targets are not. Start him only if you have to." },
  { name: "Malik Hensley", pos: "WR", spot: "Home, tough cornerback", edge: 42, gap: -1.7, note: "Shadow coverage and a low game total. Look elsewhere." },
  { name: "Trey Okafor", pos: "RB", spot: "Away, losing snaps", edge: 37, gap: -2.4, note: "His snap share has fallen two weeks in a row." },
  { name: "Ryan Talbot", pos: "WR", spot: "Away, injury designation", edge: 31, gap: -3.0, note: "Questionable and likely limited. Not worth the risk." },
  { name: "Andre Voss", pos: "RB", spot: "Home, committee back", edge: 24, gap: -3.6, note: "Third in the rotation on a team that runs the ball less than most." },
];

export const DEMO_BOARD: BoardData = {
  week: DEMO_WEEK,
  live: false,
  updated: null,
  gapLabel: "pts vs. consensus",
  players: DEMO_ROWS.map((r) => ({ ...r, id: `demo-${r.name}` })),
};

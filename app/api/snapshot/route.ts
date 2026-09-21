import { runSnapshot } from "../../odds";

// This page runs on demand. Vercel's daily schedule calls it (see vercel.json),
// and you can open it yourself to save the lines right now:
//   https://YOUR-SITE/api/snapshot?key=YOUR_CRON_SECRET
export const dynamic = "force-dynamic";

type SleeperState = { week: number; season: string; season_type: string };

function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return text("Add an environment variable named CRON_SECRET in Vercel first.\n", 503);
  }

  const bearer = req.headers.get("authorization");
  const queryKey = new URL(req.url).searchParams.get("key");
  if (bearer !== `Bearer ${secret}` && queryKey !== secret) {
    return text("Not authorized.\n", 401);
  }

  try {
    const res = await fetch("https://api.sleeper.app/v1/state/nfl", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return text(`Sleeper state returned status ${res.status}.\n`, 502);

    const state = (await res.json()) as SleeperState;
    if (state.season_type !== "regular" || !state.week) {
      return text(`Sleeper says the season type is "${state.season_type}". Nothing to save.\n`);
    }

    const log = await runSnapshot(state.season, state.week);
    return text(`Season ${state.season}, week ${state.week}\n\n${log.join("\n")}\n`);
  } catch (err) {
    return text(`Snapshot failed: ${err instanceof Error ? err.message : "unknown error"}\n`, 500);
  }
}

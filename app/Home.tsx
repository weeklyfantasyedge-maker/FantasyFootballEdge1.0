"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Image from "next/image";
import logo from "./logo.png";
import FieldLines from "./FieldLines";
import { SiteFooter, SiteNav } from "./SiteChrome";
import { CALL_COLOR, FLEX_AT, START_AT, callFor } from "./board";
import type { BoardData, Call, Pos } from "./board";

// Add your email here to show an "Email it" button on the intake form.
// Example: "hello@fantasyfootballedge.com"
const CONTACT_EMAIL = "";

function tone(color: string): CSSProperties {
  return { "--call": color } as CSSProperties;
}

const HERO_BARS = [22, 30, 26, 40, 34, 52, 46, 64, 58, 76, 70, 90, 84, 100];

const PAGE_SIZE = 25;

type Factor = {
  letter: string;
  title: string;
  bullets: string[];
  status: "Live" | "Partly live" | "Coming soon";
  live?: string; // what is actually powering the score today
};

const FACTORS: Factor[] = [
  {
    letter: "E",
    title: "Environment",
    bullets: ["Vegas total & spread", "Expected game script", "Weather & stadium"],
    status: "Coming soon",
  },
  {
    letter: "D",
    title: "Deployment",
    bullets: ["Snap %", "Target & carry share", "First-read share", "Red-zone usage"],
    status: "Partly live",
    live: "Live now: expected carries, targets, and pass attempts.",
  },
  {
    letter: "G",
    title: "Game Matchup",
    bullets: ["Defensive DVOA & EPA", "Coverage matchup", "Run/pass tendencies"],
    status: "Coming soon",
  },
  {
    letter: "E",
    title: "Evidence",
    bullets: ["Last 2–3 games", "Season baseline", "Injury trends"],
    status: "Partly live",
    live: "Live now: injury designations.",
  },
];

/* ==========================================================
   PAGE
   ========================================================== */

export default function Home({ board }: { board: BoardData }) {
  const factors: Factor[] = FACTORS.map((f) =>
    f.title === "Environment" && board.odds
      ? { ...f, status: "Partly live" as const, live: "Live now: Vegas total and spread." }
      : f
  );
  // Troubleshooting lines are hidden unless the address ends with ?debug=1
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  const [openId, setOpenId] = useState<string | null>(null);
  const [pos, setPos] = useState<"All" | Pos>("All");
  const [callFilter, setCallFilter] = useState<"All" | Call>("All");

  const rows = useMemo(
    () =>
      [...board.players]
        .sort((a, b) => b.edge - a.edge)
        .map((p, i) => ({ ...p, rank: i + 1, call: callFor(p.edge) }))
        .filter((p) => (pos === "All" ? true : p.pos === pos))
        .filter((p) => (callFilter === "All" ? true : p.call === callFilter)),
    [board.players, pos, callFilter]
  );
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = rows.slice(0, visible);

  // Intake form
  const [scoring, setScoring] = useState("Half PPR");
  const [size, setSize] = useState("12 teams");
  const [lock, setLock] = useState("");
  const [question, setQuestion] = useState("");
  const [request, setRequest] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function buildRequest(e: FormEvent) {
    e.preventDefault();
    const lines = [
      "Fantasy Football Edge lineup request",
      `League scoring: ${scoring}`,
      `League size: ${size}`,
      `Lineup lock: ${lock.trim() || "Not given"}`,
      "",
      `My decision: ${question.trim()}`,
    ];
    setRequest(lines.join("\n"));
    setCopied(false);
  }

  async function copyRequest() {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  const mailto = CONTACT_EMAIL
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        "Lineup request"
      )}&body=${encodeURIComponent(request ?? "")}`
    : "";

  return (
    <>
      <SiteNav />

      <main id="top">
        {/* ---------- HERO ---------- */}
        <section className="hero">
          <FieldLines />

          <div className="hero-bars" aria-hidden="true">
            {HERO_BARS.map((h, i) => (
              <i key={i} style={{ "--h": `${h}%`, "--i": i } as CSSProperties} />
            ))}
          </div>

          <div className="wrap hero-grid">
            <div>
              <h1>
                I do the research.
                <span>You set the lineup.</span>
              </h1>
              <p className="hero-sub">
                Every week I break down usage, matchups, and injury news, then boil it
                down to one call per player: Start, Flex, or Sit.
              </p>
              <div className="hero-cta">
                <a href="#board" className="btn btn-solid">
                  <span>See the Edge Board</span>
                </a>
                <a href="#intake" className="btn btn-ghost">
                  <span>Get help with my lineup</span>
                </a>
              </div>
            </div>
            <div className="hero-art">
              <Image
                src={logo}
                alt="Fantasy Football Edge logo: a football wearing a fedora in front of rising green bars"
                className="hero-logo"
                width={470}
                height={470}
                priority
              />
            </div>
          </div>
        </section>

        {/* ---------- EDGE BOARD ---------- */}
        <section id="board" className="section">
          <div className="wrap">
            <div className="board-head">
              <div>
                <h2 className="h2">Edge Board: Week {board.week}</h2>
                <p className="lede">
                  Every player gets an Edge score from 0 to 100. The higher the score,
                  the more the numbers back him this week.
                </p>
              </div>
            </div>

            {board.live ? (
              <p className="live-note">
                Live from Sleeper projections, refreshed {board.updated}. Today&apos;s Edge
                score blends projected points, expected workload, and efficiency, with a
                penalty for injury designations.
                {board.odds && " Sportsbook totals and spreads are included."} The rest of
                the EDGE Framework is rolling in.
                {debug && board.oddsNote && (
                  <span className="reason">Odds: {board.oddsNote}</span>
                )}
              </p>
            ) : (
              <p className="demo-note">
                Demo data. These players and scores are placeholders until the live
                weekly board is published.
                {debug && board.reason && <span className="reason">Why: {board.reason}</span>}
              </p>
            )}

            <div className="filters">
              <div className="tabs" role="group" aria-label="Filter by position">
                {(["All", "QB", "RB", "WR", "TE"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="tab"
                    aria-pressed={pos === p}
                    onClick={() => {
                      setPos(p);
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="tabs" role="group" aria-label="Filter by call">
                {(["All", "Start", "Flex", "Sit"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="tab"
                    aria-pressed={callFilter === c}
                    onClick={() => {
                      setCallFilter(c);
                      setVisible(PAGE_SIZE);
                    }}
                  >
                    {c === "All" ? "EDGE Rankings" : c}
                  </button>
                ))}
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="empty">
                No players match those filters. Set one of them back to All to see the
                full board.
              </p>
            ) : (
              <ol className="board">
                {shown.map((p) => {
                  const lit = Math.round(p.edge / 10);
                  return (
                    <li key={p.id} className="row" style={tone(CALL_COLOR[p.call])}>
                      <div className="rank">{p.rank}</div>
                      <div className="who">
                        <div className="who-name">{p.name}</div>
                        <div className="who-meta">
                          <b>{p.pos}</b>
                          {p.spot}
                        </div>
                        <p className="who-note">{p.note}</p>
                        {p.report && (
                          <button
                            type="button"
                            className="report-toggle"
                            aria-expanded={openId === p.id}
                            onClick={() => setOpenId(openId === p.id ? null : p.id)}
                          >
                            {openId === p.id ? "Hide report" : "Full report"}
                            <span aria-hidden="true" className="chev" />
                          </button>
                        )}
                      </div>
                      <div className="call">{p.call}</div>
                      <div className="edge">
                        <div className="edge-top">
                          <div className="edge-score">{p.edge}</div>
                          <div className="meter" aria-hidden="true">
                            {Array.from({ length: 10 }, (_, i) => (
                              <i
                                key={i}
                                className={i < lit ? "on" : ""}
                                style={{ "--h": `${25 + i * 8}%` } as CSSProperties}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="edge-gap">
                          {p.gap > 0 ? "+" : ""}
                          {p.gap.toFixed(1)} {board.gapLabel}
                        </div>
                      </div>
                      {p.report && openId === p.id && (
                        <div className="report">
                          <dl className="report-stats">
                            <div>
                              <dt>Game total (O/U)</dt>
                              <dd>{p.report.gameTotal ?? "Not available"}</dd>
                            </div>
                            <div>
                              <dt>{p.report.team || "Team"} team total</dt>
                              <dd>{p.report.teamTotal ?? "Not available"}</dd>
                            </div>
                            <div>
                              <dt>Spread</dt>
                              <dd>
                                {p.report.teamSpread === null
                                  ? "Not available"
                                  : `${p.report.team} ${
                                      p.report.teamSpread === 0
                                        ? "PK"
                                        : (p.report.teamSpread > 0 ? "+" : "") +
                                          p.report.teamSpread.toFixed(1)
                                    }`}
                              </dd>
                            </div>
                            <div>
                              <dt>{p.report.propLabel} line</dt>
                              <dd>{p.report.propLine ?? "Not posted"}</dd>
                            </div>
                          </dl>
                          <p className="report-summary">{p.report.summary}</p>
                          <p className="report-fine">
                            Summary is generated from the numbers above. Lines are the consensus
                            of US sportsbooks, saved before kickoff.
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}

            {rows.length > visible && (
              <div className="more">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  <span>Show {Math.min(PAGE_SIZE, rows.length - visible)} more</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------- START / FLEX / SIT ---------- */}
        <section id="system" className="section">
          <div className="wrap">
            <h2 className="h2">Three calls. No guessing.</h2>
            <p className="lede">
              The Edge score turns into one of three calls, so you know what to do
              without reading a spreadsheet.
            </p>

            <div className="calls">
              <div className="call-row" style={tone(CALL_COLOR.Start)}>
                <div className="call-word">Start</div>
                <p className="call-copy">
                  Lock him in. Role, matchup, and health all point up. Sitting him
                  should take a real reason.
                </p>
                <div className="call-range">Edge {START_AT}+</div>
              </div>
              <div className="call-row" style={tone(CALL_COLOR.Flex)}>
                <div className="call-word">Flex</div>
                <p className="call-copy">
                  Playable, with a catch. Use him when your other options are weaker,
                  or when you need a swing.
                </p>
                <div className="call-range">
                  Edge {FLEX_AT} to {START_AT - 1}
                </div>
              </div>
              <div className="call-row" style={tone(CALL_COLOR.Sit)}>
                <div className="call-word">Sit</div>
                <p className="call-copy">
                  Bench him. The role is shrinking, the matchup is bad, or the injury
                  risk is not worth it. Check the waiver wire.
                </p>
                <div className="call-range">Edge under {FLEX_AT}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- METHOD ---------- */}
        <section id="method" className="section method">
          <div className="wrap">
            <h2 className="h2">How the Edge score works</h2>
            <p className="lede">
              Every player is evaluated through the EDGE Framework:
            </p>
            <div className="method-grid">
              {factors.map((f) => (
                <div key={f.title} className="factor">
                  <div className="factor-letter" aria-hidden="true">
                    {f.letter}
                  </div>
                  <h3>{f.title}</h3>
                  <span
                    className={
                      f.status === "Coming soon" ? "factor-tag" : "factor-tag is-live"
                    }
                  >
                    {f.status}
                  </span>
                  <ul className="factor-list">
                    {f.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  {f.live && <p className="factor-live">{f.live}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- INTAKE ---------- */}
        <section id="intake" className="section intake">
          <div className="wrap intake-grid">
            <div>
              <h2 className="h2">Stuck on a lineup call?</h2>
              <p className="lede">
                Tell me your scoring, your deadline, and the decision you are stuck on.
                I will put it into a clean request with everything needed to weigh in.
              </p>
              <svg className="chalk" viewBox="0 0 300 150" aria-hidden="true">
                <path d="M20 20l22 22M42 20L20 42" />
                <path d="M120 22l22 22M142 22l-22 22" />
                <circle cx="230" cy="112" r="14" />
                <circle cx="60" cy="118" r="14" />
                <path d="M46 46C86 50 122 62 148 80" />
                <path d="M138 68l12 14l-18 4" />
                <path d="M152 50C190 52 214 72 226 92" />
                <path d="M212 88l14 6l-2 -16" />
              </svg>
            </div>

            <div className="form">
              <form onSubmit={buildRequest}>
                <div className="field-row">
                  <label className="field">
                    <span>Scoring</span>
                    <select value={scoring} onChange={(e) => setScoring(e.target.value)}>
                      <option>Full PPR</option>
                      <option>Half PPR</option>
                      <option>Standard</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>League size</span>
                    <select value={size} onChange={(e) => setSize(e.target.value)}>
                      <option>8 teams</option>
                      <option>10 teams</option>
                      <option>12 teams</option>
                      <option>14 teams</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span>When does your lineup lock?</span>
                  <input
                    type="text"
                    value={lock}
                    onChange={(e) => setLock(e.target.value)}
                    placeholder="Sunday 1 PM ET"
                  />
                </label>
                <label className="field">
                  <span>What are you deciding?</span>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Who should I start at RB2: Dante Rivas or Trey Okafor?"
                    required
                  />
                </label>
                <button type="submit" className="btn btn-solid">
                  <span>Build my request</span>
                </button>
              </form>

              {request && (
                <div className="output" aria-live="polite">
                  <pre>{request}</pre>
                  <div className="output-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={copyRequest}>
                      <span>Copy request</span>
                    </button>
                    {CONTACT_EMAIL && (
                      <a href={mailto} className="btn btn-ghost btn-sm">
                        <span>Email it</span>
                      </a>
                    )}
                    {copied && <span className="copied">Copied</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter live={board.live} />
    </>
  );
}

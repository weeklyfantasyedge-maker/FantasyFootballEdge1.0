import Link from "next/link";

const nav = ["EDGE BOARD", "START / SIT", "WAIVERS", "TRADES", "DYNASTY", "THE METHOD"];

const board = [
  ["Example Player", "8.4", "9.1", "7.8", "8.7", "START"],
  ["Example Player", "6.9", "8.2", "5.8", "7.1", "FLEX"],
  ["Example Player", "5.4", "4.9", "6.2", "5.1", "SIT"],
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <div className="shell header-inner">
          <Link href="/" className="wordmark">
            <span className="mark">F</span>
            <span>FANTASY FOOTBALL <b>EDGE</b></span>
          </Link>
          <nav>
            {nav.map((item) => <a key={item} href="#content">{item}</a>)}
            <Link className="nav-cta" href="#get-your-edge">GET YOUR EDGE</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="mountain-art" aria-hidden="true">
          <div className="sun"></div>
          <div className="mountain m1"></div>
          <div className="mountain m2"></div>
          <div className="mountain m3"></div>
        </div>
        <div className="shell hero-content">
          <p className="eyebrow">FANTASY FOOTBALL RESEARCH</p>
          <h1>I do the research.<br /><em>You set the lineup.</em></h1>
          <p className="hero-copy">
            For the normal fantasy player who decided to do an unreasonable
            amount of research before setting his lineup.
          </p>
          <div className="button-row">
            <a className="button primary" href="#weekly-edge">GET THE WEEKLY EDGE</a>
            <a className="button secondary" href="#get-your-edge">GET YOUR TEAM ANALYZED</a>
          </div>
        </div>
      </section>

      <section className="ticker">
        <div className="shell ticker-inner">
          <span>USAGE</span><span>MATCHUPS</span><span>GAME SCRIPT</span><span>INJURIES</span><span>ADVANCED METRICS</span><span>WEATHER</span><span>VEGAS</span>
        </div>
      </section>

      <section className="section" id="content">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">THE METHOD</p>
            <h2>Stop guessing.<br /><em>Start with the evidence.</em></h2>
            <p>Every player gets evaluated through the same four-part EDGE framework, then translated into a decision you can actually use.</p>
          </div>

          <div className="framework">
            {[
              ["E", "ENVIRONMENT", "Vegas total · Spread · Game script · Weather"],
              ["D", "DEPLOYMENT", "Snaps · Routes · Target share · Red-zone usage"],
              ["G", "GAME MATCHUP", "DVOA · EPA · Coverage · Run/pass tendencies"],
              ["E", "EVIDENCE", "Recent form · Season baseline · Injuries · History"],
            ].map(([letter, title, text], i) => (
              <article className="framework-card" key={title}>
                <div className="letter">{letter}</div>
                <div>
                  <p className="card-kicker">0{i + 1}</p>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="stoplight">
            <div><span className="dot green"></span><b>START</b><small>Strong evidence across the board</small></div>
            <div><span className="dot yellow"></span><b>FLEX / FRINGE</b><small>Context matters. Decision depends on roster.</small></div>
            <div><span className="dot red"></span><b>SIT</b><small>Too many warning signs to ignore.</small></div>
          </div>
        </div>
      </section>

      <section className="section dark" id="weekly-edge">
        <div className="shell">
          <div className="split-heading">
            <div>
              <p className="eyebrow">THE WEEKLY EDGE</p>
              <h2>The research behind<br /><em>the decisions.</em></h2>
            </div>
            <p>Every week: usage changes, matchup shifts, injury fallout, waiver targets and the box scores that are lying to you.</p>
          </div>
          <div className="story-grid">
            {["THE RECEIPTS", "THE BOX SCORE TRAP", "THE MATCHUP I'M WATCHING", "THE USAGE CHANGE"].map((x, i) => (
              <article className="story" key={x}>
                <span>0{i + 1}</span>
                <h3>{x}</h3>
                <p>Research notes, context and the numbers worth knowing before lineup lock.</p>
                <a href="#get-your-edge">READ THE EDGE →</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section board-section">
        <div className="shell">
          <div className="section-heading inline">
            <div>
              <p className="eyebrow">EDGE BOARD</p>
              <h2>Make the signal <em>scannable.</em></h2>
            </div>
            <p>A sample of the weekly board. The full research belongs to members.</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>PLAYER</th><th>ENV</th><th>DEP</th><th>MATCH</th><th>EVIDENCE</th><th>EDGE</th></tr></thead>
              <tbody>{board.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className={j === 5 ? `edge ${cell.toLowerCase()}` : ""}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="note">Sample interface only — real player data will be added after the V1 design is approved.</p>
        </div>
      </section>

      <section className="section cream" id="get-your-edge">
        <div className="shell intake-promo">
          <div>
            <p className="eyebrow">GET YOUR EDGE</p>
            <h2>Your league isn't generic.<br /><em>Your advice shouldn't be either.</em></h2>
            <p>Tell me about your league, roster, opponent and the decision keeping you up at night. The custom intake is designed to capture the context that rankings miss.</p>
          </div>
          <div className="intake-card">
            <div className="step">01 / 04</div>
            <h3>Let's get the league context first.</h3>
            <p>League type, scoring, team count, platform and settings.</p>
            <a className="button primary full" href="#intake">START MY TEAM ANALYSIS</a>
          </div>
        </div>
      </section>

      <section className="section" id="intake">
        <div className="shell">
          <div className="section-heading">
            <p className="eyebrow">CUSTOM INTAKE / V1</p>
            <h2>Build the brief.<br /><em>Then build the edge.</em></h2>
            <p>For V1, this is a polished front-end intake experience. We can connect it to Tally, Typeform, Google Forms, Airtable or a custom database once the workflow is approved.</p>
          </div>
          <div className="form-shell">
            <div className="form-grid">
              <label>League name<input placeholder="Sunday Night League" /></label>
              <label>Platform<select><option>Sleeper</option><option>ESPN</option><option>Yahoo</option><option>NFL</option><option>Other</option></select></label>
              <label>League type<select><option>Redraft</option><option>Dynasty</option><option>Keeper</option></select></label>
              <label>Teams<select><option>10</option><option>12</option><option>14</option><option>16</option></select></label>
              <label>Scoring<select><option>PPR</option><option>Half PPR</option><option>Standard</option><option>Custom</option></select></label>
              <label>Superflex?<select><option>No</option><option>Yes</option></select></label>
            </div>
            <label>What is the biggest decision you're facing?<select><option>Start / Sit</option><option>Waivers</option><option>Trade</option><option>Roster construction</option><option>Playoff push</option><option>Dynasty rebuild</option></select></label>
            <label>Players you're deciding between<input placeholder="e.g. Player A vs. Player B" /></label>
            <label>Anything else I should know?<textarea rows={5} placeholder="Tell me what you're thinking, what you're worried about, or what the league context doesn't capture."></textarea></label>
            <button className="button primary submit" type="button">SUBMIT MY EDGE BRIEF</button>
            <p className="form-note">V1 demo form — submission routing will be connected after the design is approved.</p>
          </div>
        </div>
      </section>

      <section className="newsletter">
        <div className="shell newsletter-inner">
          <div><p className="eyebrow">FREE EVERY WEEK</p><h2>The Weekly Edge.</h2><p>Five minutes of research before you set your lineup.</p></div>
          <form><input type="email" placeholder="you@example.com" /><button className="button primary">SEND IT MY WAY →</button></form>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <div><div className="wordmark"><span className="mark">F</span><span>FANTASY FOOTBALL <b>EDGE</b></span></div><p>I do the research. You set the lineup.</p></div>
          <div className="footer-links"><a href="#">YouTube</a><a href="#">Contact</a><a href="#">Privacy</a><a href="#">Terms</a></div>
        </div>
        <div className="shell copyright">© 2026 Fantasy Football Edge. Research and analysis for fantasy football decision-making.</div>
      </footer>
    </main>
  );
}
/* ==========================================================
   The football terms glossary.
   Each entry has a status so the page never implies the site uses
   something it does not:
   - live:     used on this site right now
   - soon:     planned; the data is available and not yet wired in
   - licensed: needs a paid or licensed data source
   - ref:      reference only
   ========================================================== */

export type Status = "live" | "soon" | "licensed" | "ref";

export const STATUS_LABEL: Record<Status, string> = {
  live: "Used on this site",
  soon: "Coming soon",
  licensed: "Needs licensed data",
  ref: "Reference",
};

export const CATEGORIES = [
  "Usage & role",
  "Efficiency",
  "Game environment",
  "Matchup",
  "Betting lines",
  "Scoring & roster",
  "Health",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Term = {
  term: string;
  category: Category;
  status: Status;
  what: string;
  why: string;
};

export const TERMS: Term[] = [
  /* ---------- Usage & role ---------- */
  {
    term: "Snap %",
    category: "Usage & role",
    status: "soon",
    what: "The share of a team's offensive plays that a player is on the field for.",
    why: "You can't produce without playing time. Snap share sets the floor for opportunity, and a rising or falling trend often shows a role change before the box score does.",
  },
  {
    term: "Route participation",
    category: "Usage & role",
    status: "licensed",
    what: "Routes run divided by team dropbacks: how often a player actually goes out on a pass route when his team throws.",
    why: "A tight end or running back can play many snaps and stay in to block. Route participation shows who is really a receiving option.",
  },
  {
    term: "Target share",
    category: "Usage & role",
    status: "soon",
    what: "The percentage of a team's pass targets that go to a player.",
    why: "Targets are the raw material for receptions and yards, which makes target share one of the steadiest receiver stats in PPR.",
  },
  {
    term: "Carry share",
    category: "Usage & role",
    status: "soon",
    what: "The percentage of a team's rushing attempts that a player gets.",
    why: "It separates a true lead back from a committee. Read it next to snap % and goal-line work.",
  },
  {
    term: "Opportunities",
    category: "Usage & role",
    status: "live",
    what: "Carries plus targets for running backs, receivers, and tight ends. For quarterbacks this site counts pass attempts plus rush attempts.",
    why: "Volume drives fantasy scoring. The Edge score uses projected opportunities as its workload input.",
  },
  {
    term: "Touches",
    category: "Usage & role",
    status: "ref",
    what: "Carries plus receptions.",
    why: "A quick volume count, but it leaves out targets that were not caught, so opportunities is the more complete measure.",
  },
  {
    term: "Red-zone touches",
    category: "Usage & role",
    status: "soon",
    what: "Carries and targets inside the opponent's 20-yard line.",
    why: "Scoring chances cluster near the goal line, so red-zone usage predicts touchdowns better than yardage does.",
  },
  {
    term: "Goal-line carries",
    category: "Usage & role",
    status: "ref",
    what: "Rushing attempts from inside the opponent's 5-yard line.",
    why: "These are the most valuable carries in fantasy. A back who gets most of them can score even on a low-yardage day.",
  },
  {
    term: "High-value touches",
    category: "Usage & role",
    status: "ref",
    what: "A grouping of the most valuable touches: receptions plus carries near the goal line. Data providers set the cutoff differently.",
    why: "It shows who is getting scoring-position work and PPR receptions instead of empty carries.",
  },
  {
    term: "Air yards",
    category: "Usage & role",
    status: "soon",
    what: "The distance a pass travels in the air, from the line of scrimmage to where the target is, whether or not it is caught.",
    why: "It measures the quality of a receiver's opportunity, not just the number of targets.",
  },
  {
    term: "Air yards share",
    category: "Usage & role",
    status: "soon",
    what: "A player's percentage of his team's total air yards.",
    why: "A high share marks the offense's main downfield weapon. Paired with target share, it forms WOPR.",
  },
  {
    term: "aDOT",
    category: "Usage & role",
    status: "ref",
    what: "Average depth of target: the average number of air yards per target.",
    why: "A high aDOT means a deep, boom-or-bust role. A low one means short catches, which help a PPR floor.",
  },
  {
    term: "WOPR",
    category: "Usage & role",
    status: "soon",
    what: "Weighted opportunity rating. It combines target share and air yards share: 1.4 times target share plus 0.7 times air yards share.",
    why: "One number for a receiver's overall share of his team's passing game. Higher is better.",
  },
  {
    term: "First-read share",
    category: "Usage & role",
    status: "licensed",
    what: "How often a receiver is the quarterback's first option on a pass play.",
    why: "It shows trust and play design. Some receivers get looked to first even on plays where the ball goes elsewhere.",
  },
  {
    term: "Targets per route run (TPRR)",
    category: "Usage & role",
    status: "licensed",
    what: "Targets divided by routes run.",
    why: "It strips out team pass volume and shows how much a player commands the ball each time he runs a route.",
  },
  {
    term: "Yards per route run (YPRR)",
    category: "Usage & role",
    status: "licensed",
    what: "Receiving yards divided by routes run.",
    why: "One of the best single measures of how productive a receiver is each time he goes out for a pass.",
  },
  {
    term: "Expected fantasy points",
    category: "Usage & role",
    status: "ref",
    what: "The fantasy points an average player would score on the same opportunities, based on factors like distance and field position.",
    why: "Compare it with actual points to see who is beating or lagging his usage, and who is likely to regress.",
  },

  /* ---------- Efficiency ---------- */
  {
    term: "Points per opportunity",
    category: "Efficiency",
    status: "live",
    what: "Projected fantasy points divided by projected opportunities.",
    why: "It shows how much each touch is worth. The Edge score uses it as its efficiency input.",
  },
  {
    term: "Yards per carry (YPC)",
    category: "Efficiency",
    status: "ref",
    what: "Rushing yards divided by rushing attempts.",
    why: "A basic efficiency check for backs, though long runs and blocking can distort it.",
  },
  {
    term: "Yards per target (Y/T)",
    category: "Efficiency",
    status: "ref",
    what: "Receiving yards divided by targets, counting the ones that fall incomplete.",
    why: "It rates how productive a receiver's targets are and is less noisy than yards per catch.",
  },
  {
    term: "EPA (expected points added)",
    category: "Efficiency",
    status: "soon",
    what: "The change in a team's expected points from before a play to after it, based on down, distance, and field position.",
    why: "Yards treat every play the same. EPA credits a play for how much it actually helped the team score, so it is a cleaner efficiency measure.",
  },
  {
    term: "Success rate",
    category: "Efficiency",
    status: "ref",
    what: "The percentage of plays that keep an offense on schedule. A common version counts a play as a success when it has positive EPA.",
    why: "It rewards consistency instead of a few long gains.",
  },
  {
    term: "CPOE",
    category: "Efficiency",
    status: "ref",
    what: "Completion percentage over expected: a quarterback's actual completion rate minus what a typical passer would complete on the same throws.",
    why: "It separates real accuracy from easy throws.",
  },
  {
    term: "Yards after contact",
    category: "Efficiency",
    status: "ref",
    what: "Rushing yards gained after the first defender touches the ball carrier.",
    why: "It credits a back's power and elusiveness. Yards before contact points more at the blocking.",
  },
  {
    term: "Explosive plays",
    category: "Efficiency",
    status: "ref",
    what: "Big gains. Common cutoffs are runs of 10 or more yards and passes of 20 or more yards, though definitions vary.",
    why: "Explosive plays drive a player's ceiling and an offense's touchdown production.",
  },
  {
    term: "Boom and bust rate",
    category: "Efficiency",
    status: "ref",
    what: "How often a player has a big week (for example a top-12 finish at his position) versus a poor week (for example outside the top 24).",
    why: "It tells you whether a player is steady or volatile.",
  },
  {
    term: "Floor and ceiling",
    category: "Efficiency",
    status: "ref",
    what: "Floor is a realistic bad-week outcome. Ceiling is a realistic best-week outcome.",
    why: "Lean on floor when you are protecting a lead and on ceiling when you need a big swing.",
  },

  /* ---------- Game environment ---------- */
  {
    term: "Spread",
    category: "Game environment",
    status: "live",
    what: "The number of points sportsbooks expect the favorite to win by. A minus sign marks the favorite (KC -6.5). A plus sign marks the underdog.",
    why: "It shows the expected flow of the game. Favorites tend to run more late, and underdogs tend to throw more.",
  },
  {
    term: "Game total (over/under)",
    category: "Game environment",
    status: "live",
    what: "The combined number of points sportsbooks expect both teams to score.",
    why: "High-total games mean more plays and more scoring chances for everyone in them.",
  },
  {
    term: "Implied team total",
    category: "Game environment",
    status: "live",
    what: "A team's expected points, worked out from the total and spread: the total divided by 2, minus the team's spread divided by 2.",
    why: "It turns a game total into a forecast for one team, which matters more for that team's players. The Edge score uses it for its Environment input.",
  },
  {
    term: "Game script",
    category: "Game environment",
    status: "ref",
    what: "The way the score shapes play calling. Teams with a lead run more, and teams that trail throw more.",
    why: "It explains why an underdog can help its receivers and a favorite can help its running backs.",
  },
  {
    term: "Pace",
    category: "Game environment",
    status: "ref",
    what: "How fast a team runs its plays, usually measured in plays per game or seconds per play.",
    why: "More plays means more volume for everyone on the offense.",
  },
  {
    term: "Neutral script",
    category: "Game environment",
    status: "ref",
    what: "Plays run while the game is close, so the score is not forcing a run or a pass. Exact cutoffs vary.",
    why: "It reveals a team's true tendencies without the noise of blowouts.",
  },
  {
    term: "Pass rate over expected (PROE)",
    category: "Game environment",
    status: "soon",
    what: "How often a team passes compared with what would be expected from the down, distance, score, and time remaining.",
    why: "It shows which offenses throw more than the situation calls for, which lifts the value of their receivers.",
  },
  {
    term: "Weather and roof",
    category: "Game environment",
    status: "soon",
    what: "Wind, rain, snow, and temperature for outdoor games, plus whether the stadium is a dome, has a retractable roof, or is open air.",
    why: "Strong wind hurts deep passing and kicking. Domes remove weather from the picture entirely.",
  },

  /* ---------- Matchup ---------- */
  {
    term: "Points allowed to a position",
    category: "Matchup",
    status: "soon",
    what: "How many fantasy points a defense has given up to a position, ranked against the rest of the league.",
    why: "It points to soft and tough spots. Early in the season it is a small sample, so treat it with caution.",
  },
  {
    term: "DVOA",
    category: "Matchup",
    status: "licensed",
    what: "Defense-adjusted Value Over Average, an efficiency rating from Football Outsiders that adjusts each play for the situation and the opponent.",
    why: "It rates how good a unit really is, not just how many yards it has piled up or allowed.",
  },
  {
    term: "Coverage matchup",
    category: "Matchup",
    status: "licensed",
    what: "How a receiver fares against man versus zone coverage, and who is expected to cover him, such as a top cornerback shadowing him.",
    why: "A great receiver against a shutdown corner can have a very different week than the same receiver against a weak secondary.",
  },
  {
    term: "Pressure rate and sack rate",
    category: "Matchup",
    status: "ref",
    what: "Pressure rate is the percentage of dropbacks where the quarterback is pressured. Sack rate is the percentage of dropbacks that end in a sack.",
    why: "Heavy pressure lowers passing efficiency and can cap a quarterback and his receivers.",
  },
  {
    term: "Offensive line continuity",
    category: "Matchup",
    status: "ref",
    what: "How many of the same starting linemen play together from week to week, and how healthy they are.",
    why: "A cohesive line blocks more consistently. A missing tackle or center can change both the run game and the pass game.",
  },
  {
    term: "Run and pass tendencies",
    category: "Matchup",
    status: "ref",
    what: "The balance of a team's play calling, and how strong its defense is against the run versus the pass.",
    why: "A soft run defense is good news for a back. A weak pass defense is good news for the passing game.",
  },

  /* ---------- Betting lines ---------- */
  {
    term: "Player prop",
    category: "Betting lines",
    status: "live",
    what: "A sportsbook line on one player's stat total in a game, such as 262.5 passing yards.",
    why: "Books set props with detailed models, so the number is a useful read on expected volume. Full reports show passing yards for quarterbacks, rushing yards for running backs, and receiving yards for receivers and tight ends.",
  },
  {
    term: "Consensus line",
    category: "Betting lines",
    status: "live",
    what: "The average of the lines posted by several sportsbooks, rounded to the nearest half point.",
    why: "It smooths out the quirks of any one book.",
  },
  {
    term: "Pick'em",
    category: "Betting lines",
    status: "ref",
    what: "A game with no favorite, where the spread is zero. It shows as PK.",
    why: "It signals a coin-flip game, which usually means a more balanced script.",
  },
  {
    term: "Juice (vig)",
    category: "Betting lines",
    status: "ref",
    what: "The commission built into sportsbook odds, such as -110 on both sides of a line.",
    why: "A lopsided price on one side, like -130 on the over, hints at which way the market leans even when the line has not moved.",
  },
  {
    term: "Line movement",
    category: "Betting lines",
    status: "ref",
    what: "Changes in a spread, total, or prop between when it opens and kickoff.",
    why: "Late moves often reflect news, such as an injury or a weather change.",
  },

  /* ---------- Scoring & roster ---------- */
  {
    term: "PPR, half PPR, and standard",
    category: "Scoring & roster",
    status: "live",
    what: "Scoring formats. Full PPR gives 1 point per reception. Half PPR gives 0.5. Standard gives none.",
    why: "PPR raises the value of pass-catching backs and high-target receivers. The Edge Board uses full PPR.",
  },
  {
    term: "Flex and superflex",
    category: "Scoring & roster",
    status: "ref",
    what: "A flex spot can start a running back, wide receiver, or tight end. A superflex spot can also start a quarterback.",
    why: "Superflex makes quarterbacks far more valuable than they are in standard formats.",
  },
  {
    term: "Replacement level",
    category: "Scoring & roster",
    status: "live",
    what: "The production of the best freely available player at a position, roughly the last starter in a typical league. This site uses about QB12, RB30, WR36, and TE12.",
    why: "It is the baseline for measuring how much a player is really worth.",
  },
  {
    term: "Points over replacement",
    category: "Scoring & roster",
    status: "live",
    what: "A player's projected points minus the projection for a replacement-level player at his position.",
    why: "It is the fairest way to compare players at different positions, and it is the number shown under each Edge score.",
  },
  {
    term: "Dynasty and taxi squad",
    category: "Scoring & roster",
    status: "ref",
    what: "Dynasty leagues let you keep your whole roster from year to year. A taxi squad is a set of extra spots for stashing young players.",
    why: "In dynasty, age and future value matter as much as this week's points.",
  },
  {
    term: "Waiver wire and FAAB",
    category: "Scoring & roster",
    status: "ref",
    what: "The waiver wire is the pool of players no one has rostered. FAAB is a season-long budget used to bid on them.",
    why: "Breakout players often show up here after one big week, so timing and budget matter.",
  },

  /* ---------- Health ---------- */
  {
    term: "Injury designations",
    category: "Health",
    status: "live",
    what: "The NFL's weekly status labels. Questionable means uncertain. Doubtful means unlikely to play. Out means will not play. Injured reserve (IR) keeps a player out for several weeks.",
    why: "The Edge score penalizes Questionable and Doubtful players and leaves Out players off the board.",
  },
  {
    term: "Practice participation",
    category: "Health",
    status: "ref",
    what: "Whether a player did not practice, practiced in a limited way, or practiced fully.",
    why: "The trend through the week hints at game-day availability before the final designation.",
  },
  {
    term: "Inactives",
    category: "Health",
    status: "ref",
    what: "The list of players ruled out for a game, released about 90 minutes before kickoff.",
    why: "It is the final word on who plays, so check it before lineup lock for later games.",
  },
];

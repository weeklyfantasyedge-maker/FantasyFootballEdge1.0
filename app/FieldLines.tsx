/* ==========================================================
   Football field paint lines for the hero background:
   sidelines, goal lines, yard lines every 5 yards, hash marks,
   one-yard ticks, yard numbers with direction arrows (far-side
   numbers upside down, like the real thing), and a faint EDGE
   in the end zone. Drawn once, in the same dusk blue-gray the
   old mountains used.
   ========================================================== */

const X0 = 100; // goal line x (end zone is 0 to 100)
const PX = 10; // pixels per yard
const TOP = 60; // far sideline y
const BOT = 380; // near sideline y
const H = BOT - TOP;
const HASH_A = TOP + H * 0.442; // NFL hash rows sit 70'9" from each sideline
const HASH_B = TOP + H * 0.558;

const yardX = (y: number) => X0 + y * PX;

export default function FieldLines() {
  const yards = Array.from({ length: 99 }, (_, i) => i + 1);
  const fives = yards.filter((y) => y % 5 === 0);
  const tens = yards.filter((y) => y % 10 === 0);
  const single = yards.filter((y) => y % 5 !== 0);

  return (
    <div className="hero-field" aria-hidden="true">
      <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a6580" stopOpacity="0" />
            <stop offset="1" stopColor="#22374d" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* turf tint */}
        <rect x="0" y={TOP} width="1200" height={H} fill="url(#turf)" />

        <g className="ff-lines">
          {/* sidelines and end lines */}
          <line x1="0" y1={TOP} x2="1200" y2={TOP} className="ff-thick" />
          <line x1="0" y1={BOT} x2="1200" y2={BOT} className="ff-thick" />
          <line x1="0" y1={TOP} x2="0" y2={BOT} className="ff-thick" />
          <line x1="1200" y1={TOP} x2="1200" y2={BOT} className="ff-thick" />

          {/* goal lines */}
          <line x1={yardX(0)} y1={TOP} x2={yardX(0)} y2={BOT} className="ff-thick" />
          <line x1={yardX(100)} y1={TOP} x2={yardX(100)} y2={BOT} className="ff-thick" />

          {/* yard lines every 5 yards */}
          {fives.map((y) => (
            <line
              key={`f${y}`}
              x1={yardX(y)}
              y1={TOP}
              x2={yardX(y)}
              y2={BOT}
              className={y === 50 ? "ff-thick" : "ff-mid"}
            />
          ))}

          {/* one-yard ticks: both sidelines and both hash rows */}
          {single.map((y) => (
            <g key={`t${y}`}>
              <line x1={yardX(y)} y1={TOP} x2={yardX(y)} y2={TOP + 12} className="ff-thin" />
              <line x1={yardX(y)} y1={BOT} x2={yardX(y)} y2={BOT - 12} className="ff-thin" />
              <line x1={yardX(y)} y1={HASH_A - 7} x2={yardX(y)} y2={HASH_A + 7} className="ff-thin" />
              <line x1={yardX(y)} y1={HASH_B - 7} x2={yardX(y)} y2={HASH_B + 7} className="ff-thin" />
            </g>
          ))}

          {/* short hash ticks where the 5-yard lines cross the hash rows */}
          {fives.map((y) => (
            <g key={`h${y}`}>
              <line x1={yardX(y) - 6} y1={HASH_A} x2={yardX(y) + 6} y2={HASH_A} className="ff-thin" />
              <line x1={yardX(y) - 6} y1={HASH_B} x2={yardX(y) + 6} y2={HASH_B} className="ff-thin" />
            </g>
          ))}

          {/* 2-point / PAT marks just outside each goal line */}
          <line x1={yardX(-2)} y1={HASH_A + 6} x2={yardX(-2)} y2={HASH_B - 6} className="ff-mid" />
          <line x1={yardX(102)} y1={HASH_A + 6} x2={yardX(102)} y2={HASH_B - 6} className="ff-mid" />
        </g>

        {/* yard numbers: near side upright, far side upside down */}
        <g className="ff-nums">
          {tens.map((y) => {
            const label = String(y <= 50 ? y : 100 - y);
            const x = yardX(y);
            const left = y < 50;
            const right = y > 50;
            const near = BOT - 58;
            const far = TOP + 58;
            return (
              <g key={`n${y}`}>
                <g>
                  <text x={x - 15} y={near} textAnchor="middle">
                    {label[0]}
                  </text>
                  <text x={x + 15} y={near} textAnchor="middle">
                    {label[1]}
                  </text>
                  {left && <polygon points={`${x - 40},${near - 12} ${x - 30},${near - 22} ${x - 30},${near - 2}`} />}
                  {right && <polygon points={`${x + 40},${near - 12} ${x + 30},${near - 22} ${x + 30},${near - 2}`} />}
                </g>
                <g transform={`rotate(180 ${x} ${far - 12})`}>
                  <text x={x - 15} y={far} textAnchor="middle">
                    {label[0]}
                  </text>
                  <text x={x + 15} y={far} textAnchor="middle">
                    {label[1]}
                  </text>
                  {left && <polygon points={`${x - 40},${far - 12} ${x - 30},${far - 22} ${x - 30},${far - 2}`} />}
                  {right && <polygon points={`${x + 40},${far - 12} ${x + 30},${far - 22} ${x + 30},${far - 2}`} />}
                </g>
              </g>
            );
          })}
        </g>

        {/* end zone lettering */}
        <text
          x="52"
          y={(TOP + BOT) / 2}
          className="ff-endzone"
          textAnchor="middle"
          transform={`rotate(-90 52 ${(TOP + BOT) / 2})`}
          dominantBaseline="middle"
        >
          EDGE
        </text>
      </svg>
    </div>
  );
}

// Scenery generated per design-reference/index.html. No image files.
// The reference uses Math.random(); here a seeded generator keeps server and
// client markup identical so React does not report a hydration mismatch.

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** mandap garland + fairy lights — lehengas */
export function Mandap() {
  const beads = Array.from({ length: 70 }, (_, i) => ({
    cx: i * 17 + 6,
    cy: 30 + Math.sin(i / 6) * 22 + (i % 3) * 9,
    r: 4 + (i % 3),
    fill: i % 4 === 0 ? '#EE8B2A' : i % 3 === 0 ? '#D9A93C' : '#E0552F',
  }));

  const rnd = seeded(861203);
  const bokeh = Array.from({ length: 22 }, () => {
    const s = 6 + rnd() * 16;
    return {
      size: s,
      left: rnd() * 100,
      top: 8 + rnd() * 70,
      delay: rnd() * 4,
    };
  });

  return (
    <>
      <svg
        className="mandap"
        viewBox="0 0 1200 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0 H1200 V70 Q1080 130 960 70 Q840 10 720 70 Q600 130 480 70 Q360 10 240 70 Q120 130 0 70 Z"
          fill="rgba(238,139,42,.20)"
        />
        <path
          d="M150 700 L150 210 Q150 120 300 110 L300 700 Z"
          fill="rgba(0,0,0,.30)"
        />
        <path
          d="M1050 700 L1050 210 Q1050 120 900 110 L900 700 Z"
          fill="rgba(0,0,0,.30)"
        />
      </svg>

      <svg
        className="garland"
        viewBox="0 0 1200 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {beads.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.fill} opacity={0.85} />
        ))}
      </svg>

      {bokeh.map((b, i) => (
        <div
          key={i}
          className="bokeh"
          style={{
            position: 'absolute',
            zIndex: 1,
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            top: `${b.top}%`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </>
  );
}

/** city skyline — sarees */
export function City() {
  const rnd = seeded(4471902);
  const towers: { x: number; y: number; w: number; h: number }[] = [];
  const windows: { x: number; y: number; fill: string; opacity: number }[] = [];

  let x = 0;
  while (x < 1200) {
    const w = 34 + rnd() * 80;
    const h = 110 + rnd() * 300;
    towers.push({ x, y: 500 - h, w, h });
    for (let wy = 500 - h + 16; wy < 492; wy += 20) {
      for (let wx = x + 7; wx < x + w - 7; wx += 15) {
        if (rnd() > 0.45) {
          windows.push({
            x: wx,
            y: wy,
            fill: rnd() > 0.75 ? '#F2D98B' : '#8FB8D8',
            opacity: 0.25 + rnd() * 0.6,
          });
        }
      }
    }
    x += w + 6;
  }

  return (
    <>
      <svg
        className="city"
        viewBox="0 0 1200 500"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {towers.map((t, i) => (
          <rect
            key={`t${i}`}
            x={t.x}
            y={t.y}
            width={t.w}
            height={t.h}
            fill="rgba(7,10,32,.82)"
          />
        ))}
        {windows.map((q, i) => (
          <rect
            key={`w${i}`}
            x={q.x}
            y={q.y}
            width={6}
            height={9}
            fill={q.fill}
            opacity={q.opacity}
          />
        ))}
      </svg>
      <div className="city-glow" />
    </>
  );
}

/** mountains + shore — suits */
export function Hills() {
  return (
    <>
      <svg
        className="hills"
        viewBox="0 0 1200 500"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 500 L0 300 L180 140 L320 290 L430 190 L560 330 L700 160 L860 320 L1000 210 L1200 350 L1200 500 Z"
          fill="rgba(6,52,60,.55)"
        />
        <path
          d="M0 500 L0 380 L220 250 L380 370 L540 280 L720 400 L900 300 L1080 390 L1200 330 L1200 500 Z"
          fill="rgba(10,74,74,.5)"
        />
      </svg>
      <svg
        className="surf"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 60 Q150 20 300 60 T600 60 T900 60 T1200 60 V120 H0 Z"
          fill="rgba(255,255,255,.35)"
        />
        <path
          d="M0 84 Q150 46 300 84 T600 84 T900 84 T1200 84 V120 H0 Z"
          fill="rgba(255,255,255,.5)"
        />
      </svg>
    </>
  );
}

/** spotlight — gowns */
export function Spotlight() {
  return (
    <>
      <div className="spot" />
      <div className="bars" />
    </>
  );
}

export function Scenery({ slug }: { slug: string }) {
  switch (slug) {
    case 'lehengas':
      return <Mandap />;
    case 'sarees':
      return <City />;
    case 'suits':
      return <Hills />;
    case 'gowns':
      return <Spotlight />;
    default:
      return null;
  }
}

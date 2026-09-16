'use client';

import { useMemo } from 'react';

/**
 * Warp threads and falling petals, generated as in design-reference/index.html
 * (hero loom warps + petals). The reference uses Math.random() for the petals;
 * here they come from a seeded generator so the server and client markup agree
 * and React does not report a hydration mismatch.
 */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export default function Loom() {
  // for(let x=0;x<=1200;x+=26)
  const warps = useMemo(() => {
    const out: { x: number; delay: string }[] = [];
    for (let x = 0; x <= 1200; x += 26) {
      out.push({ x, delay: `${(x / 1200) * 0.8}s` });
    }
    return out;
  }, []);

  // for(let i=0;i<16;i++)
  const petals = useMemo(() => {
    const rnd = seeded(20260916);
    return Array.from({ length: 16 }, () => ({
      cx: 60 + rnd() * 1080,
      cy: rnd() * 300,
      r: 1.6 + rnd() * 2.4,
      delay: `${rnd() * 5}s`,
      duration: `${4 + rnd() * 4}s`,
    }));
  }, []);

  return (
    <svg
      className="loom"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="zari" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8E6A18" />
          <stop offset="35%" stopColor="#F2D98B" />
          <stop offset="60%" stopColor="#D9A93C" />
          <stop offset="100%" stopColor="#FFF4D2" />
        </linearGradient>
        <linearGradient id="shut" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#FFE9A8" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <g id="warps">
        {warps.map((w) => (
          <line
            key={w.x}
            className="warp"
            x1={w.x}
            y1={0}
            x2={w.x}
            y2={800}
            style={{ animationDelay: w.delay }}
          />
        ))}
      </g>

      {/* mehrab arch */}
      <path
        className="arch"
        d="M330 790 L330 400 Q330 180 600 150 Q870 180 870 400 L870 790"
      />
      <path
        className="arch"
        style={{ animationDelay: '.9s' }}
        d="M368 790 L368 408 Q368 218 600 192 Q832 218 832 408 L832 790"
      />
      <path
        className="arch"
        style={{ animationDelay: '1.3s', strokeWidth: 1 }}
        d="M600 150 L600 96 M556 122 Q600 60 644 122"
      />

      <rect
        className="shuttle"
        x="300"
        y="392"
        width="600"
        height="3"
        fill="url(#shut)"
      />

      <g id="petals">
        {petals.map((p, i) => (
          <circle
            key={i}
            className="petal"
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#F2D98B"
            style={{ animationDelay: p.delay, animationDuration: p.duration }}
          />
        ))}
      </g>
    </svg>
  );
}

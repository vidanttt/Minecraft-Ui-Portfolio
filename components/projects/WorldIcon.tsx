/**
 * Procedural 16x16 "world thumbnail" generated from a project slug: a tiny
 * landscape of sky, terrain and water. Used when a project has no artwork.
 */

function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const PALETTES = [
  { sky: "#7fa8ff", sky2: "#b5cfff", top: "#6aa84f", top2: "#82c062", soil: "#866043", deep: "#6d4c33", water: "#3a62c4" },
  { sky: "#f0a96a", sky2: "#ffd7a3", top: "#dccf9b", top2: "#e9dfb0", soil: "#c9b47a", deep: "#a8935e", water: "#3a8cc4" },
  { sky: "#9fc4e8", sky2: "#dce9f5", top: "#f2f6fa", top2: "#ffffff", soil: "#7d7d7d", deep: "#5f5f5f", water: "#5a7fd0" },
  { sky: "#3b2a5c", sky2: "#6d4a8a", top: "#4a7a3c", top2: "#5b8f4a", soil: "#5a3e2b", deep: "#3f2b1e", water: "#2c4a9a" },
];

export function WorldIcon({ slug, className, detail = 16 }: { slug: string; className?: string; detail?: number }) {
  const r = rng(seedFrom(slug));
  const pal = PALETTES[Math.floor(r() * PALETTES.length)];
  const W = detail;
  const H = Math.round(detail * (detail > 16 ? 0.5 : 1));
  const rects: React.ReactElement[] = [];
  const waterY = Math.round(H * 0.68);
  let h = Math.round(H * (0.45 + r() * 0.2));
  // a couple of flat pixel clouds
  const clouds: [number, number, number][] = Array.from({ length: detail > 16 ? 3 : 1 }, () => [
    Math.floor(r() * W),
    1 + Math.floor(r() * Math.max(1, H * 0.2)),
    3 + Math.floor(r() * (W / 6)),
  ]);
  const isCloud = (x: number, y: number) =>
    clouds.some(([cx, cy, cw]) => (y === cy && x >= cx && x < cx + cw) || (y === cy - 1 && x > cx && x < cx + cw - 1));
  for (let x = 0; x < W; x++) {
    h = Math.max(Math.round(H * 0.3), Math.min(H - 3, h + Math.round((r() - 0.5) * 3)));
    for (let y = 0; y < H; y++) {
      let fill: string;
      if (y < h) fill = y >= waterY ? pal.water : isCloud(x, y) ? pal.sky2 : pal.sky;
      else if (y === h) fill = r() > 0.5 ? pal.top : pal.top2;
      else if (y < h + 3) fill = pal.soil;
      else fill = pal.deep;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} shapeRendering="crispEdges" aria-hidden preserveAspectRatio="xMidYMid slice">
      {rects}
    </svg>
  );
}

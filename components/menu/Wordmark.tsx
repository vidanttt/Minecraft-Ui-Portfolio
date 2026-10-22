import { BLOCK_LETTERS } from "@/lib/icons/block-letters";

interface WordmarkProps {
  text: string;
  className?: string;
}

const DEPTH = 1.25;

/**
 * Chunky stone wordmark: emboldened pixel capitals with a stone texture,
 * bevelled edges, a dark extruded underside and a black outline. Pure SVG,
 * so it is crisp at any GUI scale and renders on the server.
 */
export function Wordmark({ text, className }: WordmarkProps) {
  const pixels = new Set<string>();
  let cursor = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = BLOCK_LETTERS[ch] ?? BLOCK_LETTERS[" "];
    glyph.forEach((row, y) => {
      row.split("").forEach((c, x) => {
        if (c !== "#") return;
        // embolden: each pixel also fills its right neighbour
        pixels.add(`${cursor + x},${y}`);
        pixels.add(`${cursor + x + 1},${y}`);
      });
    });
    cursor += glyph[0].length + 1 + 1;
  }
  const width = cursor - 1;
  const height = 7;
  const has = (x: number, y: number) => pixels.has(`${x},${y}`);
  const list = [...pixels].map((p) => p.split(",").map(Number) as [number, number]);

  // merge horizontal runs for the face
  const runs: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < height; y++) {
    let x = 0;
    while (x <= width) {
      if (!has(x, y)) {
        x++;
        continue;
      }
      let end = x;
      while (has(end + 1, y)) end++;
      runs.push({ x, y, w: end - x + 1 });
      x = end + 1;
    }
  }

  const o = 0.32; // outline thickness in letter-pixels
  const pad = 0.6;
  const vb = `${-pad} ${-pad} ${width + pad * 2} ${height + DEPTH + pad * 2}`;

  return (
    <svg
      viewBox={vb}
      className={className}
      role="img"
      aria-label={text}
      shapeRendering="crispEdges"
      style={{ overflow: "visible" }}
    >
      <defs>
        <pattern id="wm-stone" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#a9a9a9" />
          <rect x="0" y="0" width="0.5" height="0.5" fill="#bdbdbd" />
          <rect x="1" y="0.5" width="0.5" height="0.5" fill="#979797" />
          <rect x="0.5" y="1" width="0.5" height="0.5" fill="#c6c6c6" />
          <rect x="1.5" y="1.5" width="0.5" height="0.5" fill="#8f8f8f" />
          <rect x="1.5" y="0" width="0.5" height="0.5" fill="#b3b3b3" />
          <rect x="0" y="1.5" width="0.5" height="0.5" fill="#9e9e9e" />
        </pattern>
        <pattern id="wm-side" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#4c4c4c" />
          <rect x="0.5" y="0" width="0.5" height="0.5" fill="#3f3f3f" />
          <rect x="1.5" y="1" width="0.5" height="0.5" fill="#575757" />
        </pattern>
        <linearGradient id="wm-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id="wm-face">
          {runs.map((r) => (
            <rect key={`c${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
          ))}
        </clipPath>
      </defs>

      {/* outline around face + extrusion */}
      <g fill="#000">
        {list.map(([x, y]) => (
          <rect key={`o${x}-${y}`} x={x - o} y={y - o} width={1 + o * 2} height={1 + DEPTH + o * 2} />
        ))}
      </g>
      {/* extruded underside */}
      <g fill="url(#wm-side)">
        {list.map(([x, y]) => (
          <rect key={`d${x}-${y}`} x={x} y={y + DEPTH * 0.5} width={1} height={1 + DEPTH * 0.5} />
        ))}
      </g>
      {/* face */}
      <g fill="url(#wm-stone)">
        {runs.map((r) => (
          <rect key={`f${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} />
        ))}
      </g>
      <rect x={0} y={0} width={width} height={height} fill="url(#wm-light)" clipPath="url(#wm-face)" />
      {/* bevels */}
      <g>
        {list.map(([x, y]) => (
          <g key={`b${x}-${y}`}>
            {!has(x, y - 1) && <rect x={x} y={y} width={1} height={0.2} fill="#ffffff" fillOpacity={0.55} />}
            {!has(x - 1, y) && <rect x={x} y={y} width={0.2} height={1} fill="#ffffff" fillOpacity={0.3} />}
            {!has(x, y + 1) && <rect x={x} y={y + 0.8} width={1} height={0.2} fill="#000000" fillOpacity={0.35} />}
            {!has(x + 1, y) && <rect x={x + 0.8} y={y} width={0.2} height={1} fill="#000000" fillOpacity={0.22} />}
          </g>
        ))}
      </g>
    </svg>
  );
}

import type { PixelIconName } from "@/lib/types";

/**
 * Original 16x16 pixel-art icons. Each icon is a palette plus 16 rows; "." is
 * transparent. Rendered as crisp SVG rects by <PixelIcon/>.
 */
export interface PixelArt {
  palette: Record<string, string>;
  rows: string[];
}

const SIZE = 16;

function blank(): string[][] {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => "."));
}

function fromGrid(grid: string[][]): string[] {
  return grid.map((r) => r.join(""));
}

const MICRO: Record<string, string[]> = {
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  S: ["###", "#..", "###", "..#", "###"],
  J: ["..#", "..#", "..#", "#.#", "###"],
  N: ["#..#", "##.#", "#.##", "#..#", "#..#"],
  G: ["###", "#..", "#.#", "#.#", "###"],
  "3": ["###", "..#", "###", "..#", "###"],
  "5": ["###", "#..", "###", "..#", "###"],
  i: ["#", ".", "#", "#", "#"],
  n: ["...", "##.", "#.#", "#.#", "#.#"],
};

type BadgeShape = "square" | "circle" | "shield";

function inShape(shape: BadgeShape, x: number, y: number): boolean {
  if (shape === "circle") {
    const dx = x - 7.5;
    const dy = y - 7.5;
    return dx * dx + dy * dy <= 7.2 * 7.2;
  }
  if (shape === "shield") {
    if (y < 1 || y > 15 || x < 2 || x > 13) return false;
    if (y >= 11) {
      const inset = y - 10;
      return x >= 2 + inset && x <= 13 - inset;
    }
    return true;
  }
  if (x < 1 || x > 14 || y < 1 || y > 14) return false;
  const corner = (x === 1 || x === 14) && (y === 1 || y === 14);
  return !corner;
}

/** Logo-style badge item: a shape with a short label in a 3x5 micro font. */
function badge(
  shape: BadgeShape,
  bg: string,
  fg: string,
  text: string,
  anchor: "center" | "bottom-right" = "center",
): PixelArt {
  const grid = blank();
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inShape(shape, x, y)) grid[y][x] = "b";
    }
  }
  // dark outline + shade on the lower edge for an item-like look
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (grid[y][x] !== "b") continue;
      const below = y + 1 >= SIZE || grid[y + 1][x] === ".";
      const right = x + 1 >= SIZE || grid[y][x + 1] === ".";
      if (below || right) grid[y][x] = "s";
    }
  }
  const glyphs = text.split("").map((c) => MICRO[c]);
  const width = glyphs.reduce((w, g) => w + g[0].length, 0) + glyphs.length - 1;
  let ox = Math.round((SIZE - width) / 2);
  let oy = 5;
  if (anchor === "bottom-right") {
    ox = 13 - width;
    oy = 8;
  }
  if (shape === "shield") oy = 4;
  for (const g of glyphs) {
    g.forEach((row, ry) => {
      row.split("").forEach((ch, rx) => {
        if (ch === "#") grid[oy + ry][ox + rx] = "f";
      });
    });
    ox += g[0].length + 1;
  }
  return {
    palette: { b: bg, s: shadeHex(bg, 0.72), f: fg },
    rows: fromGrid(grid),
  };
}

function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const art = (palette: Record<string, string>, rows: string[]): PixelArt => ({ palette, rows });

export const pixelIcons: Record<PixelIconName, PixelArt> = {
  typescript: badge("square", "#3178c6", "#ffffff", "TS", "bottom-right"),
  javascript: badge("square", "#f0d31a", "#1b1b1b", "JS", "bottom-right"),
  nextjs: badge("circle", "#141414", "#ffffff", "N"),
  html: badge("shield", "#e34f26", "#ffffff", "5"),
  css: badge("shield", "#2965f1", "#ffffff", "3"),
  gsap: badge("square", "#1b1d1c", "#88ce02", "G"),
  linkedin: badge("square", "#0a66c2", "#ffffff", "in"),

  react: art({ c: "#61dafb", d: "#2f9fc4", k: "#20232a" }, [
    "................",
    "................",
    "......cccc......",
    "....cc....cc....",
    "...c..c..c..c...",
    "..c....cc....c..",
    "..c...c..c...c..",
    ".cc..c.kk.c..cc.",
    ".cc..c.kk.c..cc.",
    "..c...c..c...c..",
    "..c....cc....c..",
    "...c..c..c..c...",
    "....dd....dd....",
    "......dddd......",
    "................",
    "................",
  ]),
  tailwind: art({ c: "#38bdf8", d: "#0e8ac7" }, [
    "................",
    "................",
    "................",
    "......cccc......",
    "....cc....cc....",
    "..cc........d...",
    ".c...cccc.......",
    "...cc....cc.....",
    ".dd........dd...",
    "...............d",
    "........cccc....",
    "......cc....cc..",
    "....cc........d.",
    "...c...........d",
    "................",
    "................",
  ]),
  threejs: art({ w: "#f2f2f2", g: "#9a9a9a" }, [
    "................",
    "..w.............",
    "..ww............",
    "..w.w...........",
    "..w..w..........",
    "..wwwww.........",
    "..w.w..w........",
    "..ww.w..w.......",
    "..w...w..w......",
    "..wwwwwwwww.....",
    "..w.w...w..w....",
    "..ww.w..ww..w...",
    "..w...w.w.w..w..",
    "..wwwwwwwwwwwww.",
    "..gggggggggggggg",
    "................",
  ]),
  git: art({ o: "#f05133", d: "#b33a22", w: "#ffffff" }, [
    "................",
    ".......oo.......",
    "......oooo......",
    ".....oooooo.....",
    "....oooowooo....",
    "...ooooowoooo...",
    "..oooowwwwoooo..",
    ".ooooowooowoooo.",
    ".ooooowoooowooo.",
    "..oooowooooooo..",
    "...ooowwooooo...",
    "....oooooooo....",
    ".....dddddd.....",
    "......dddd......",
    ".......dd.......",
    "................",
  ]),
  node: badge("circle", "#5fa04e", "#ffffff", "N"),
  figma: badge("square", "#1e1e1e", "#a259ff", "G"),
  blender: badge("circle", "#e87d0d", "#ffffff", "S"),
  brush: art({ h: "#8a5a32", m: "#c0c0c0", b: "#d23a3a", d: "#8e2222" }, [
    "................",
    "............hh..",
    "...........hhh..",
    "..........hhh...",
    ".........hhh....",
    "........hhh.....",
    ".......hhh......",
    "......mmm.......",
    ".....mmm........",
    "....bbb.........",
    "...bbbb.........",
    "..bbbbd.........",
    "..bbbd..........",
    ".bddd...........",
    ".d..............",
    "................",
  ]),
  film: art({ k: "#2a2a2a", g: "#5a5a5a", w: "#d8d8d8" }, [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kwkwkwkwkwkwkk.",
    ".kkkkkkkkkkkkkk.",
    ".kggggggggggggk.",
    ".kgwwwwgwwwwwgk.",
    ".kgwwwwgwwwwwgk.",
    ".kgwwwwgwwwwwgk.",
    ".kgwwwwgwwwwwgk.",
    ".kggggggggggggk.",
    ".kkkkkkkkkkkkkk.",
    ".kwkwkwkwkwkwkk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
  ]),
  book: art({ c: "#7a3b1e", d: "#53260f", p: "#efe6cf", g: "#c8b98f", r: "#c23b3b" }, [
    "................",
    "....cccccccccc..",
    "...cccccccccccd.",
    "..cccccccccccdd.",
    "..cccccrrcccddp.",
    "..cccccrrccddpp.",
    "..cccccccccddpg.",
    "..cccccccccddpp.",
    "..ccccccccddpgp.",
    "..ccccccccddppp.",
    "..cccccccddpgpd.",
    "..cccccccddpppd.",
    "..cccccccddppd..",
    "..dddddddddpd...",
    "...ddddddddd....",
    "................",
  ]),
  compass: art({ k: "#3b3b3b", o: "#9a9a9a", f: "#d6d6d6", r: "#d22b2b", b: "#505050" }, [
    "................",
    ".....kkkkkk.....",
    "...kkooooookk...",
    "..kooffffffook..",
    "..koffffffffok..",
    ".kofffffffrrfok.",
    ".koffffffrrrfok.",
    ".kofffffrrrffok.",
    ".koffffbbbfffok.",
    ".kofffbbbffffok.",
    ".koffbbbfffffok.",
    "..koffffffffok..",
    "..kooffffffook..",
    "...kkooooookk...",
    ".....kkkkkk.....",
    "................",
  ]),
  chest: art({ k: "#2b1c0e", w: "#a8742e", d: "#7a5220", l: "#d8d8d8", g: "#888888" }, [
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kwwwwwwwwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kddddddddddddk.",
    ".kkkkkkllkkkkkk.",
    ".kwwwwwlgwwwwwk.",
    ".kwwwwwggwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kddddddddddddk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
  ]),
  pickaxe: art({ h: "#8a5a32", d: "#5e3b1d", a: "#5ce1e6", b: "#2aa5ad", w: "#c9fbfd" }, [
    "................",
    "....bbbbbbb.....",
    "...bawwaaaab....",
    "..b........ab...",
    "...........dab..",
    "..........hd.b..",
    ".........hd..ab.",
    "........hd....b.",
    ".......hd.......",
    "......hd........",
    ".....hd.........",
    "....hd..........",
    "...hd...........",
    "..hd............",
    "..d.............",
    "................",
  ]),
  star: art({ y: "#ffe866", o: "#f2b632", w: "#fffbd6" }, [
    "................",
    ".......y........",
    ".......y........",
    "......yyy.......",
    "......ywy.......",
    "yyyyyyywyyyyyyy.",
    ".yyyyywwwyyyyy..",
    "..oyyywwwyyyo...",
    "...oyyywyyyo....",
    "....oyyyyyo.....",
    "...oyyyoyyyo....",
    "...oyyo.oyyo....",
    "..oyo.....oyo...",
    "..oo.......oo...",
    "................",
    "................",
  ]),
  github: art({ k: "#24292f", w: "#ffffff" }, [
    "................",
    ".....kkkkkk.....",
    "...kkkkkkkkkk...",
    "..kkwkkkkkkwkk..",
    ".kkkwwkkkkwwkkk.",
    ".kkkwwwwwwwwkkk.",
    "kkkwwwwwwwwwwkkk",
    "kkkwwwwwwwwwwkkk",
    "kkkwwwwwwwwwwkkk",
    "kkkkwwwwwwwwkkkk",
    ".kkkkwwwwwwkkkk.",
    ".kwkkkwwwwkkkkk.",
    "..kwwkkwwkkkkk..",
    "...kkkkwwkkkk...",
    ".....kkwwkk.....",
    "................",
  ]),
  instagram: art({ p: "#d62976", o: "#fa7e1e", v: "#962fbf", w: "#ffffff" }, [
    "................",
    "..vvvvvvvvvvvv..",
    ".vvvvvvvvvvvvvv.",
    ".vvwwwwwwwwwwvv.",
    ".vpwppppppppwwp.",
    ".ppwpppwwwpppwp.",
    ".ppwppwppwppwpp.",
    ".ppwpwppppwpwpp.",
    ".ppwpwppppwpwpp.",
    ".ppwppwppwppwpp.",
    ".ooworwwwoppwpp.",
    ".oowooooooooooo.",
    ".oowwwwwwwwwwoo.",
    ".oooooooooooooo.",
    "..oooooooooooo..",
    "................",
  ]),
  youtube: art({ r: "#ff0033", d: "#b80024", w: "#ffffff" }, [
    "................",
    "................",
    "................",
    "..rrrrrrrrrrrr..",
    ".rrrrrrrrrrrrrr.",
    ".rrrrrwrrrrrrrr.",
    ".rrrrrwwrrrrrrr.",
    ".rrrrrwwwrrrrrr.",
    ".rrrrrwwwwrrrrr.",
    ".rrrrrwwwrrrrrr.",
    ".rrrrrwwrrrrrrr.",
    ".rrrrrwrrrrrrrr.",
    ".dddddddddddddd.",
    "..dddddddddddd..",
    "................",
    "................",
  ]),
  x: art({ k: "#111111", w: "#ffffff" }, [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kwwkkkkkkkkwkk.",
    ".kkwwkkkkkkwkkk.",
    ".kkkwwkkkkwkkkk.",
    ".kkkkwwkkwkkkkk.",
    ".kkkkkwwwkkkkkk.",
    ".kkkkkkwwkkkkkk.",
    ".kkkkkwkwwkkkkk.",
    ".kkkkwkkkwwkkkk.",
    ".kkkwkkkkkwwkkk.",
    ".kkwkkkkkkkwwkk.",
    ".kwkkkkkkkkkwwk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
  ]),
  globe: art({ b: "#3d7bd9", g: "#4fae4f", d: "#2a5aa8", k: "#1b2f55" }, [
    "................",
    ".....kkkkkk.....",
    "...kkbbggbbkk...",
    "..kbbbgggbbbbk..",
    "..kbggggbbbggk..",
    ".kbbbgggbbbgggk.",
    ".kbbbbggbbbbggk.",
    ".kbbbbbbbbgbbbk.",
    ".kbggbbbbggbbbk.",
    ".kbgggbbbgggbbk.",
    ".kdbggbbbbggbdk.",
    "..kdbgbbbbbbdk..",
    "..kddbbbbbbddk..",
    "...kkddddddkk...",
    ".....kkkkkk.....",
    "................",
  ]),
  mail: art({ w: "#efe6cf", g: "#bcae86", k: "#5b4a2a", r: "#c23b3b" }, [
    "................",
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kgwwwwwwwwwwgk.",
    ".kwgwwwwwwwwgwk.",
    ".kwwgwwwwwwgwwk.",
    ".kwwwgwwwwgwwwk.",
    ".kwwwwgrrgwwwwk.",
    ".kwwwwwrrwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
  ]),
  speaker: art({ w: "#ffffff", g: "#bdbdbd" }, [
    "................",
    "................",
    "........w.......",
    ".......ww...g...",
    "......www....g..",
    "..wwwwwww..g..g.",
    "..wwwwwww...g.g.",
    "..wwwwwww...g.g.",
    "..wwwwwww...g.g.",
    "..wwwwwww..g..g.",
    "......www....g..",
    ".......ww...g...",
    "........w.......",
    "................",
    "................",
    "................",
  ]),
  speakerOff: art({ w: "#ffffff", r: "#ff5555" }, [
    "................",
    "................",
    "........w.......",
    ".......ww.......",
    "......www.......",
    "..wwwwwww.r...r.",
    "..wwwwwww..r.r..",
    "..wwwwwww...r...",
    "..wwwwwww..r.r..",
    "..wwwwwww.r...r.",
    "......www.......",
    ".......ww.......",
    "........w.......",
    "................",
    "................",
    "................",
  ]),
  person: art({ w: "#ffffff" }, [
    "................",
    "................",
    ".......ww.......",
    "......wwww......",
    ".......ww.......",
    "................",
    "...wwwwwwwwww...",
    ".......ww.......",
    ".......ww.......",
    ".......ww.......",
    "......w..w......",
    ".....w....w.....",
    "....w......w....",
    "................",
    "................",
    "................",
  ]),
  gear: art({ w: "#ffffff", g: "#bdbdbd" }, [
    "................",
    "................",
    ".......ww.......",
    "...w..wwww..w...",
    "...wwwwwwwwww...",
    "....wwwggwww....",
    "...wwwg..gwww...",
    ".wwwwg....gwwww.",
    ".wwwwg....gwwww.",
    "...wwwg..gwww...",
    "....wwwggwww....",
    "...wwwwwwwwww...",
    "...w..wwww..w...",
    ".......ww.......",
    "................",
    "................",
  ]),
  map: art({ p: "#e8dcb4", d: "#b8a676", g: "#6a9a4a", b: "#4d79c9", r: "#c23b3b", k: "#6b5a35" }, [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kppppppppppppk.",
    ".kpggggpbbbpppk.",
    ".kpgggpbbbbbppk.",
    ".kpggppbbbbgppk.",
    ".kppppppbbggggk.",
    ".kpprpppppggggk.",
    ".kpprrppppgggpk.",
    ".kppppppbbbppdk.",
    ".kpggppbbbbpddk.",
    ".kpgggppbbppdpk.",
    ".kppppppppppppk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
  ]),
  heart: art({ r: "#e53b3b", d: "#a01f1f", w: "#ffb3b3", k: "#3a0f0f" }, [
    "................",
    "................",
    "..kkk....kkk....",
    ".krrrk..krrrk...",
    "krwwrrkkrrrrrk..",
    "krwrrrrrrrrrrk..",
    "krrrrrrrrrrrrk..",
    "krrrrrrrrrrrdk..",
    ".krrrrrrrrrdk...",
    "..krrrrrrrdk....",
    "...krrrrrdk.....",
    "....krrrdk......",
    ".....krdk.......",
    "......kk........",
    "................",
    "................",
  ]),
  lock: art({ g: "#c9c9c9", d: "#7d7d7d", y: "#e3b53a", o: "#a77a16", k: "#3a3a3a" }, [
    "................",
    ".....dddddd.....",
    "....dggggggd....",
    "...dgd....dgd...",
    "...dgd....dgd...",
    "...dgd....dgd...",
    "..kkkkkkkkkkkk..",
    "..kyyyyyyyyyyk..",
    "..kyyyykkyyyyk..",
    "..kyyyykkyyyyk..",
    "..kyyyyykyyyyk..",
    "..kyyyyyyyyyyk..",
    "..kooooooooook..",
    "..kkkkkkkkkkkk..",
    "................",
    "................",
  ]),
  grass: art({ g: "#73b04c", l: "#8ccf5c", d: "#5a8f3b", b: "#8a6142", c: "#6b4a31", e: "#a2754f" }, [
    "................",
    "......llll......",
    "....llggggll....",
    "..llggggggggll..",
    ".dggggggggggggg.",
    ".bddggggggggddb.",
    ".bbbddggggddbbc.",
    ".bebbbddddbbbcc.",
    ".bbbebbbbbbcccc.",
    ".bbbbbbbbbccecc.",
    ".bebbbbbbbcccec.",
    ".bbbbebbbbccccc.",
    "..bbbbbbbbcccc..",
    "....bbbbbbcc....",
    "......bbcc......",
    "................",
  ]),
};

/** Pad/truncate any malformed row so a typo never breaks the grid. */
for (const icon of Object.values(pixelIcons)) {
  icon.rows = icon.rows.slice(0, SIZE).map((r) => r.padEnd(SIZE, ".").slice(0, SIZE));
}

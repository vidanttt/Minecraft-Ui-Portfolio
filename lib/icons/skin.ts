import type { AvatarPalette } from "@/lib/types";

/**
 * Builds the faces of a blocky player model from a colour palette. Each face is
 * a tiny pixel grid encoded as an SVG data URI. Original design; no game skins.
 */

type Grid = string[][];

export interface BoxFaces {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
}

export interface PlayerSkin {
  head: BoxFaces;
  body: BoxFaces;
  armL: BoxFaces;
  armR: BoxFaces;
  legL: BoxFaces;
  legR: BoxFaces;
}

function hash(x: number, y: number, s: number) {
  let h = (x * 73856093) ^ (y * 19349663) ^ (s * 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function vary(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function fill(w: number, h: number, color: string): Grid {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => color));
}

function toUri(grid: Grid, seed: number): string {
  const h = grid.length;
  const w = grid[0].length;
  let rects = "";
  grid.forEach((row, y) =>
    row.forEach((c, x) => {
      const k = 0.94 + hash(x, y, seed) * 0.1;
      rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${vary(c, k)}"/>`;
    }),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function box(faces: Record<keyof BoxFaces, Grid>, seed: number): BoxFaces {
  return {
    front: toUri(faces.front, seed + 1),
    back: toUri(faces.back, seed + 2),
    left: toUri(faces.left, seed + 3),
    right: toUri(faces.right, seed + 4),
    top: toUri(faces.top, seed + 5),
    bottom: toUri(faces.bottom, seed + 6),
  };
}

export function buildSkin(p: AvatarPalette): PlayerSkin {
  // head 8x8x8
  const face = fill(8, 8, p.skin);
  for (let x = 0; x < 8; x++) {
    face[0][x] = p.hair;
    face[1][x] = p.hair;
  }
  face[2][0] = p.hair;
  face[2][7] = p.hair;
  face[4][1] = "#ffffff";
  face[4][2] = p.eyes;
  face[4][5] = p.eyes;
  face[4][6] = "#ffffff";
  face[6][3] = vary(p.skin, 0.72);
  face[6][4] = vary(p.skin, 0.72);
  const side = fill(8, 8, p.skin);
  for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) side[y][x] = p.hair;
  const back = fill(8, 8, p.hair);
  for (let x = 0; x < 8; x++) back[7][x] = vary(p.hair, 0.85);
  const sideL = side.map((r, y) => r.map((c, x) => (y < 6 && x < 3 ? p.hair : c)));
  const sideR = side.map((r, y) => r.map((c, x) => (y < 6 && x > 4 ? p.hair : c)));

  // body 8x12x4
  const shirtFront = fill(8, 12, p.shirt);
  shirtFront[0][3] = p.skin;
  shirtFront[0][4] = p.skin;
  shirtFront[1][3] = p.skin;
  shirtFront[1][4] = p.skin;
  for (let x = 0; x < 8; x++) shirtFront[6][x] = p.shirtAccent;
  for (let x = 0; x < 8; x++) shirtFront[11][x] = vary(p.pants, 0.9);
  const shirtBack = fill(8, 12, p.shirt);
  for (let x = 0; x < 8; x++) shirtBack[11][x] = vary(p.pants, 0.9);
  const shirtSide = fill(4, 12, p.shirt);
  for (let x = 0; x < 4; x++) shirtSide[6][x] = p.shirtAccent;

  // arms 4x12x4: short sleeves
  const arm = fill(4, 12, p.skin);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) arm[y][x] = p.shirt;
  for (let x = 0; x < 4; x++) arm[4][x] = p.shirtAccent;
  const armTop = fill(4, 4, p.shirt);
  const hand = fill(4, 4, vary(p.skin, 0.92));

  // legs 4x12x4
  const leg = fill(4, 12, p.pants);
  for (let y = 9; y < 12; y++) for (let x = 0; x < 4; x++) leg[y][x] = p.shoes;
  const legTop = fill(4, 4, p.pants);
  const sole = fill(4, 4, vary(p.shoes, 0.8));

  return {
    head: box({ front: face, back, left: sideL, right: sideR, top: fill(8, 8, p.hair), bottom: fill(8, 8, p.skin) }, 10),
    body: box(
      { front: shirtFront, back: shirtBack, left: shirtSide, right: shirtSide, top: fill(8, 4, p.shirt), bottom: fill(8, 4, p.pants) },
      20,
    ),
    armL: box({ front: arm, back: arm, left: arm, right: arm, top: armTop, bottom: hand }, 30),
    armR: box({ front: arm, back: arm, left: arm, right: arm, top: armTop, bottom: hand }, 40),
    legL: box({ front: leg, back: leg, left: leg, right: leg, top: legTop, bottom: sole }, 50),
    legR: box({ front: leg, back: leg, left: leg, right: leg, top: legTop, bottom: sole }, 60),
  };
}

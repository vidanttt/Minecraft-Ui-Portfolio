/**
 * Procedural voxel world for the title-screen panorama. Pure TypeScript, no
 * Three.js: it returns typed arrays that the renderer turns into three
 * BufferGeometries (opaque, cut-out, water). Deterministic for a given seed.
 */

export const Block = {
  Air: 0,
  Grass: 1,
  Dirt: 2,
  Stone: 3,
  Sand: 4,
  Log: 5,
  Leaves: 6,
  Water: 7,
  Snow: 8,
  Gravel: 9,
  Flower: 10,
} as const;
export type Block = (typeof Block)[keyof typeof Block];

/** Atlas tile index (4x4 atlas, row-major from the top-left). */
const TILE = {
  grassTop: 0,
  grassSide: 1,
  dirt: 2,
  stone: 3,
  sand: 4,
  logSide: 5,
  logTop: 6,
  leaves: 7,
  water: 8,
  snow: 9,
  gravel: 10,
  flower: 12,
} as const;

export interface MeshData {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

export interface WorldMeshes {
  opaque: MeshData;
  cutout: MeshData;
  water: MeshData;
  size: number;
  waterLevel: number;
  cameraHeight: number;
}

// ---------------------------------------------------------------- noise ----

function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

// ----------------------------------------------------------- generation ----

export function generateWorld(seed = 1337, size = 112): WorldMeshes {
  const H = 64;
  const waterLevel = 20;
  const blocks = new Uint8Array(size * size * H);
  const idx = (x: number, y: number, z: number) => (y * size + z) * size + x;
  const half = size / 2;

  const heights = new Int16Array(size * size);
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const base = fbm(x / 42, z / 42, seed);
      const hills = fbm(x / 18, z / 18, seed + 7, 3);
      const mountain = Math.max(0, fbm(x / 70, z / 70, seed + 99, 3) - 0.48) * 70;
      let h = 8 + (base - 0.2) * 24 + hills * 5 + mountain;
      // a low clearing around the camera so the view opens up over the land
      const d = Math.hypot(x - half, z - half);
      const t = Math.min(1, Math.max(0, (d - 9) / 16));
      const k = t * t * (3 - 2 * t);
      const clearing = waterLevel - 2 + hills * 5;
      h = clearing + (h - clearing) * k;
      heights[z * size + x] = Math.min(H - 8, Math.max(4, Math.round(h)));
    }
  }

  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const h = heights[z * size + x];
      const beach = h <= waterLevel + 1;
      const peak = h >= 40;
      for (let y = 0; y <= h; y++) {
        let b: Block = Block.Stone;
        if (y === h) b = peak ? (h >= 43 ? Block.Snow : Block.Stone) : beach ? Block.Sand : Block.Grass;
        else if (y > h - 4) b = peak ? Block.Stone : beach ? (y > h - 3 ? Block.Sand : Block.Gravel) : Block.Dirt;
        blocks[idx(x, y, z)] = b;
      }
      for (let y = h + 1; y <= waterLevel; y++) blocks[idx(x, y, z)] = Block.Water;
    }
  }

  // trees and flowers
  for (let z = 3; z < size - 3; z++) {
    for (let x = 3; x < size - 3; x++) {
      const h = heights[z * size + x];
      if (blocks[idx(x, h, z)] !== Block.Grass) continue;
      const forest = fbm(x / 24, z / 24, seed + 5, 2);
      const r = hash2(x, z, seed + 3);
      const treeChance = forest > 0.55 ? 0.05 : 0.008;
      if (r < treeChance && Math.hypot(x - half, z - half) > 24) {
        const trunk = 4 + Math.floor(hash2(x, z, seed + 4) * 3);
        for (let y = 1; y <= trunk; y++) blocks[idx(x, h + y, z)] = Block.Log;
        const top = h + trunk;
        for (let dy = -2; dy <= 1; dy++) {
          const rad = dy >= 0 ? 1 : 2;
          for (let dz = -rad; dz <= rad; dz++) {
            for (let dx = -rad; dx <= rad; dx++) {
              if (Math.abs(dx) === rad && Math.abs(dz) === rad && (dy === 1 || hash2(x + dx, z + dz, top + dy) < 0.5))
                continue;
              const yy = top + dy;
              if (yy >= H) continue;
              const i = idx(x + dx, yy, z + dz);
              if (blocks[i] === Block.Air) blocks[i] = Block.Leaves;
            }
          }
        }
        if (top + 2 < H) blocks[idx(x, top + 2, z)] = Block.Leaves;
      } else if (r > 0.965 && h + 1 < H) {
        blocks[idx(x, h + 1, z)] = Block.Flower;
      }
    }
  }

  const get = (x: number, y: number, z: number): Block => {
    if (x < 0 || z < 0 || x >= size || z >= size || y < 0) return Block.Stone;
    if (y >= H) return Block.Air;
    return blocks[idx(x, y, z)] as Block;
  };
  const isOpaque = (b: Block) => b !== Block.Air && b !== Block.Water && b !== Block.Leaves && b !== Block.Flower;

  const opaque = new MeshBuilder();
  const cutout = new MeshBuilder();
  const water = new MeshBuilder();

  for (let y = 0; y < H; y++) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const b = blocks[idx(x, y, z)] as Block;
        if (b === Block.Air) continue;
        const px = x - half;
        const pz = z - half;
        if (b === Block.Water) {
          if (get(x, y + 1, z) === Block.Air) water.waterTop(px, y, pz);
          continue;
        }
        if (b === Block.Flower) {
          cutout.cross(px, y, pz, TILE.flower);
          continue;
        }
        const target = b === Block.Leaves ? cutout : opaque;
        for (let f = 0; f < 6; f++) {
          const face = FACES[f];
          const n = get(x + face.dir[0], y + face.dir[1], z + face.dir[2]);
          const visible = b === Block.Leaves ? n !== Block.Leaves && !isOpaque(n) : !isOpaque(n);
          if (!visible) continue;
          target.face(px, y, pz, f, tileFor(b, f), (dx, dy, dz) => isOpaque(get(x + dx, y + dy, z + dz)));
        }
      }
    }
  }

  return {
    opaque: opaque.build(),
    cutout: cutout.build(),
    water: water.build(),
    size,
    waterLevel,
    cameraHeight: waterLevel + 17,
  };
}

function tileFor(b: Block, face: number): number {
  const top = face === 3;
  const bottom = face === 2;
  switch (b) {
    case Block.Grass:
      return top ? TILE.grassTop : bottom ? TILE.dirt : TILE.grassSide;
    case Block.Dirt:
      return TILE.dirt;
    case Block.Sand:
      return TILE.sand;
    case Block.Log:
      return top || bottom ? TILE.logTop : TILE.logSide;
    case Block.Leaves:
      return TILE.leaves;
    case Block.Snow:
      return TILE.snow;
    case Block.Gravel:
      return TILE.gravel;
    default:
      return TILE.stone;
  }
}

// --------------------------------------------------------------- meshing ----

interface Face {
  dir: [number, number, number];
  shade: number;
  corners: { pos: [number, number, number]; uv: [number, number] }[];
}

/** Face order: -x, +x, -y, +y, -z, +z. Shading mimics the game's directional light. */
const FACES: Face[] = [
  {
    dir: [-1, 0, 0],
    shade: 0.6,
    corners: [
      { pos: [0, 1, 0], uv: [0, 1] },
      { pos: [0, 0, 0], uv: [0, 0] },
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [0, 0, 1], uv: [1, 0] },
    ],
  },
  {
    dir: [1, 0, 0],
    shade: 0.6,
    corners: [
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [1, 0, 1], uv: [0, 0] },
      { pos: [1, 1, 0], uv: [1, 1] },
      { pos: [1, 0, 0], uv: [1, 0] },
    ],
  },
  {
    dir: [0, -1, 0],
    shade: 0.5,
    corners: [
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 0], uv: [1, 1] },
      { pos: [0, 0, 0], uv: [0, 1] },
    ],
  },
  {
    dir: [0, 1, 0],
    shade: 1,
    corners: [
      { pos: [0, 1, 1], uv: [1, 1] },
      { pos: [1, 1, 1], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 0] },
    ],
  },
  {
    dir: [0, 0, -1],
    shade: 0.8,
    corners: [
      { pos: [1, 0, 0], uv: [0, 0] },
      { pos: [0, 0, 0], uv: [1, 0] },
      { pos: [1, 1, 0], uv: [0, 1] },
      { pos: [0, 1, 0], uv: [1, 1] },
    ],
  },
  {
    dir: [0, 0, 1],
    shade: 0.8,
    corners: [
      { pos: [0, 0, 1], uv: [0, 0] },
      { pos: [1, 0, 1], uv: [1, 0] },
      { pos: [0, 1, 1], uv: [0, 1] },
      { pos: [1, 1, 1], uv: [1, 1] },
    ],
  },
];

const AO_CURVE = [0.5, 0.68, 0.84, 1];
const ATLAS = 4;
const EPS = 0.5 / 64;

function tileUV(tile: number, u: number, v: number): [number, number] {
  const col = tile % ATLAS;
  const row = Math.floor(tile / ATLAS);
  const u0 = col / ATLAS + EPS;
  const u1 = (col + 1) / ATLAS - EPS;
  const v1 = 1 - row / ATLAS - EPS;
  const v0 = 1 - (row + 1) / ATLAS + EPS;
  return [u0 + (u1 - u0) * u, v0 + (v1 - v0) * v];
}

class MeshBuilder {
  private pos: number[] = [];
  private uv: number[] = [];
  private col: number[] = [];
  private ind: number[] = [];

  face(
    x: number,
    y: number,
    z: number,
    f: number,
    tile: number,
    solidAt: (dx: number, dy: number, dz: number) => boolean,
  ) {
    const face = FACES[f];
    const start = this.pos.length / 3;
    const [nx, ny, nz] = face.dir;
    for (const c of face.corners) {
      this.pos.push(x + c.pos[0], y + c.pos[1], z + c.pos[2]);
      const [u, v] = tileUV(tile, c.uv[0], c.uv[1]);
      this.uv.push(u, v);
      // per-vertex ambient occlusion from the two edge neighbours and the corner
      const axes: [number, number, number][] = [];
      for (let a = 0; a < 3; a++) {
        if (face.dir[a] !== 0) continue;
        const d: [number, number, number] = [0, 0, 0];
        d[a] = c.pos[a] === 1 ? 1 : -1;
        axes.push(d);
      }
      const s1 = solidAt(nx + axes[0][0], ny + axes[0][1], nz + axes[0][2]) ? 1 : 0;
      const s2 = solidAt(nx + axes[1][0], ny + axes[1][1], nz + axes[1][2]) ? 1 : 0;
      const cc = solidAt(
        nx + axes[0][0] + axes[1][0],
        ny + axes[0][1] + axes[1][1],
        nz + axes[0][2] + axes[1][2],
      )
        ? 1
        : 0;
      const ao = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
      const k = face.shade * AO_CURVE[ao];
      this.col.push(k, k, k);
    }
    this.ind.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
  }

  cross(x: number, y: number, z: number, tile: number) {
    const quads: [number, number, number, number][] = [
      [0.15, 0.15, 0.85, 0.85],
      [0.15, 0.85, 0.85, 0.15],
    ];
    for (const [ax, az, bx, bz] of quads) {
      const start = this.pos.length / 3;
      const pts: [number, number, number, number, number][] = [
        [ax, 0, az, 0, 0],
        [bx, 0, bz, 1, 0],
        [ax, 1, az, 0, 1],
        [bx, 1, bz, 1, 1],
      ];
      for (const [px, py, pz, u, v] of pts) {
        this.pos.push(x + px, y + py, z + pz);
        const [tu, tv] = tileUV(tile, u, v);
        this.uv.push(tu, tv);
        this.col.push(0.95, 0.95, 0.95);
      }
      this.ind.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
    }
  }

  waterTop(x: number, y: number, z: number) {
    const start = this.pos.length / 3;
    const h = y + 0.875;
    const pts: [number, number, number, number][] = [
      [0, 1, 1, 1],
      [1, 1, 0, 1],
      [0, 0, 1, 0],
      [1, 0, 0, 0],
    ];
    for (const [px, pz, u, v] of pts) {
      this.pos.push(x + px, h, z + pz);
      const [tu, tv] = tileUV(TILE.water, u, v);
      this.uv.push(tu, tv);
      this.col.push(1, 1, 1);
    }
    this.ind.push(start, start + 1, start + 2, start + 2, start + 1, start + 3);
  }

  build(): MeshData {
    return {
      positions: new Float32Array(this.pos),
      uvs: new Float32Array(this.uv),
      colors: new Float32Array(this.col),
      indices: new Uint32Array(this.ind),
    };
  }
}

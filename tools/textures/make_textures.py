"""Generate the original 16x16 pixel textures used by the portfolio.

Run:  python tools/textures/make_textures.py public/textures
Standard library only. Output:
  terrain.png  64x64 atlas (4x4 tiles) for the 3D title-screen panorama
  dirt.png     16x16 menu background tile
  button.png   16x16 stone face for GUI buttons
"""
import random
import struct
import sys
import zlib


def png(path, w, h, pixels):
    raw = b"".join(b"\x00" + bytes(c for px in pixels[y * w:(y + 1) * w] for c in px) for y in range(h))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 9)))
        f.write(chunk(b"IEND", b""))
    print("wrote", path)


def clamp(v):
    return max(0, min(255, int(v)))


def shade(rgb, k):
    return tuple(clamp(c * k) for c in rgb)


def noise_tile(rng, base, spread, specks=None, speck_rate=0.0):
    tile = []
    for _ in range(256):
        k = 1 + (rng.random() * 2 - 1) * spread
        c = shade(base, k)
        if specks and rng.random() < speck_rate:
            c = rng.choice(specks)
        tile.append(c + (255,))
    return tile


def tiles(seed=1):
    rng = random.Random(seed)
    T = {}
    grass = (112, 168, 74)
    dirt = (134, 96, 67)
    stone = (125, 125, 125)

    T["grass_top"] = noise_tile(rng, grass, 0.14, [(96, 150, 62), (128, 184, 86)], 0.18)
    T["dirt"] = noise_tile(rng, dirt, 0.12, [(108, 76, 52), (150, 110, 78), (96, 70, 50)], 0.2)

    side = list(T["dirt"])
    for x in range(16):
        depth = 3 + (1 if rng.random() < 0.45 else 0) + (1 if rng.random() < 0.2 else 0)
        for y in range(depth):
            side[y * 16 + x] = shade(grass, 0.92 + rng.random() * 0.16) + (255,)
    T["grass_side"] = side

    st = noise_tile(rng, stone, 0.1, [(104, 104, 104), (140, 140, 140)], 0.16)
    T["stone"] = st
    T["sand"] = noise_tile(rng, (219, 207, 163), 0.05, [(204, 191, 146)], 0.15)

    log = []
    for y in range(16):
        for x in range(16):
            stripe = 0.8 if x % 4 == 0 else (1.05 if x % 4 == 2 else 0.95)
            log.append(shade((104, 82, 50), stripe * (0.94 + rng.random() * 0.1)) + (255,))
    T["log_side"] = log

    top = []
    for y in range(16):
        for x in range(16):
            d = max(abs(x - 7.5), abs(y - 7.5))
            if d > 6.5:
                c = shade((104, 82, 50), 0.9 + rng.random() * 0.1)
            else:
                ring = 0.88 if int(d) % 2 == 0 else 1.0
                c = shade((176, 144, 92), ring * (0.95 + rng.random() * 0.08))
            top.append(c + (255,))
    T["log_top"] = top

    leaves = []
    for _ in range(256):
        if rng.random() < 0.16:
            leaves.append((0, 0, 0, 0))
        else:
            leaves.append(shade((72, 128, 48), 0.75 + rng.random() * 0.45) + (255,))
    T["leaves"] = leaves

    water = []
    for y in range(16):
        for x in range(16):
            wave = 1.0 + 0.08 * (1 if (x + y * 2) % 7 == 0 else 0)
            water.append(shade((58, 98, 196), wave * (0.95 + rng.random() * 0.08)) + (255,))
    T["water"] = water

    T["snow"] = noise_tile(rng, (240, 246, 250), 0.03, [(222, 232, 240)], 0.12)
    T["gravel"] = noise_tile(rng, (132, 126, 122), 0.18, [(98, 92, 90), (170, 164, 160)], 0.3)

    planks = []
    for y in range(16):
        for x in range(16):
            k = 0.95 + rng.random() * 0.08
            if y % 4 == 3 or (x == (5 if (y // 4) % 2 else 12) and y % 4 != 3):
                k *= 0.72
            planks.append(shade((162, 130, 78), k) + (255,))
    T["planks"] = planks

    flower = [(0, 0, 0, 0)] * 256
    flower = list(flower)
    for y in range(8, 16):
        flower[y * 16 + 8] = (60, 120, 40, 255)
    for (x, y) in [(7, 5), (8, 5), (9, 5), (7, 6), (9, 6), (7, 7), (8, 7), (9, 7), (8, 4), (6, 6), (10, 6)]:
        flower[y * 16 + x] = (230, 60, 50, 255)
    flower[6 * 16 + 8] = (250, 220, 70, 255)
    T["flower"] = flower

    T["cobble"] = noise_tile(rng, (110, 110, 110), 0.22, [(80, 80, 80), (150, 150, 150)], 0.3)
    T["dark_leaves"] = [shade(p[:3], 0.7) + (p[3],) if p[3] else p for p in T["leaves"]]
    return T


ORDER = [
    "grass_top", "grass_side", "dirt", "stone",
    "sand", "log_side", "log_top", "leaves",
    "water", "snow", "gravel", "planks",
    "flower", "cobble", "dark_leaves", "stone",
]


def main(dest):
    T = tiles()
    atlas = [(0, 0, 0, 0)] * (64 * 64)
    atlas = list(atlas)
    for i, name in enumerate(ORDER):
        ox, oy = (i % 4) * 16, (i // 4) * 16
        for y in range(16):
            for x in range(16):
                atlas[(oy + y) * 64 + ox + x] = T[name][y * 16 + x]
    png(f"{dest}/terrain.png", 64, 64, atlas)
    png(f"{dest}/dirt.png", 16, 16, T["dirt"])

    rng = random.Random(42)
    button = [shade((111, 111, 111), 1 + (rng.random() * 2 - 1) * 0.07) + (255,) for _ in range(256)]
    png(f"{dest}/button.png", 16, 16, button)
    nine_slices(dest)


NINE = {
    # 10x10 container panel, sliced 4px: black outline with stepped corners,
    # 2px white highlight top/left, 2px grey shadow bottom/right.
    "panel": (
        {"K": (0, 0, 0, 255), "W": (255, 255, 255, 255), "C": (198, 198, 198, 255), "S": (85, 85, 85, 255)},
        ["..KKKKKK..", ".KWWWWWWK.", "KWWWWWWCSK", "KWWCCCCSSK", "KWWCCCCSSK",
         "KWWCCCCSSK", "KWWCCCCSSK", "KWCSSSSSSK", ".KSSSSSSK.", "..KKKKKK.."],
    ),
    # Advancement / toast frame: dark face with a light inner rim.
    "toast": (
        {"K": (0, 0, 0, 255), "L": (110, 110, 110, 255), "D": (33, 33, 33, 255), "F": (24, 24, 24, 255)},
        ["..KKKKKK..", ".KLLLLLLK.", "KLDDDDDDLK", "KLDFFFFDLK", "KLDFFFFDLK",
         "KLDFFFFDLK", "KLDFFFFDLK", "KLDDDDDDLK", ".KLLLLLLK.", "..KKKKKK.."],
    ),
}


def nine_slices(dest):
    for name, (pal, rows) in NINE.items():
        px = [pal.get(c, (0, 0, 0, 0)) for row in rows for c in row]
        png(f"{dest}/{name}.png", 10, 10, px)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/textures")

"""Synthesize the portfolio's original UI sound effects as small mono WAV files.

Run:  python tools/audio/make_sounds.py public/audio
Pure standard library; every sound here is generated from scratch.
"""
import math
import random
import struct
import sys
import wave

RATE = 22050
random.seed(7)


def env(t, attack, decay):
    if t < attack:
        return t / attack
    return math.exp(-(t - attack) / decay)


def write(path, samples, gain=0.8):
    peak = max(1e-9, max(abs(s) for s in samples))
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b"".join(
            struct.pack("<h", int(max(-1, min(1, s / peak * gain)) * 32767)) for s in samples
        )
        w.writeframes(frames)
    print("wrote", path, len(samples) / RATE, "s")


def lowpass(samples, alpha):
    out, y = [], 0.0
    for s in samples:
        y += alpha * (s - y)
        out.append(y)
    return out


def click(freq=1250, dur=0.07, noise=0.35):
    """Wooden 'tock': a fast-dropping sine with a noisy transient."""
    out, phase = [], 0.0
    for i in range(int(RATE * dur)):
        t = i / RATE
        f = freq * (1 + 1.6 * math.exp(-t * 90))
        phase += 2 * math.pi * f / RATE
        body = math.sin(phase) * env(t, 0.0008, 0.012)
        hit = (random.random() * 2 - 1) * env(t, 0.0003, 0.003) * noise
        out.append(body + hit)
    return lowpass(out, 0.55)


def hover():
    out, phase = [], 0.0
    for i in range(int(RATE * 0.03)):
        t = i / RATE
        phase += 2 * math.pi * 2100 / RATE
        out.append(math.sin(phase) * env(t, 0.001, 0.005))
    return out


def pop(f0=420, f1=980, dur=0.09):
    out, phase = [], 0.0
    for i in range(int(RATE * dur)):
        t = i / RATE
        f = f0 + (f1 - f0) * min(1, t / (dur * 0.6))
        phase += 2 * math.pi * f / RATE
        out.append(math.sin(phase) * env(t, 0.002, 0.025))
    return out


def bell(notes, step=0.09, tail=0.5, partials=((1, 1), (2.01, 0.35), (3.02, 0.12))):
    total = int(RATE * (step * len(notes) + tail))
    out = [0.0] * total
    for n, f in enumerate(notes):
        start = int(n * step * RATE)
        for i in range(total - start):
            t = i / RATE
            e = env(t, 0.003, 0.18)
            s = sum(a * math.sin(2 * math.pi * f * m * t) for m, a in partials)
            out[start + i] += s * e
    return out


def whoosh(dur=0.22, rise=True):
    out = []
    alpha_lo, alpha_hi = 0.04, 0.35
    y = 0.0
    for i in range(int(RATE * dur)):
        t = i / RATE
        p = t / dur
        a = alpha_lo + (alpha_hi - alpha_lo) * (p if rise else 1 - p)
        y += a * ((random.random() * 2 - 1) - y)
        out.append(y * math.sin(math.pi * p) ** 1.5)
    return out


def portal(dur=0.9):
    """Rising shimmer used when entering a world."""
    out = []
    phases = [0.0, 0.0, 0.0]
    for i in range(int(RATE * dur)):
        t = i / RATE
        p = t / dur
        base = 180 + 520 * p * p
        s = 0.0
        for k, mult in enumerate((1, 1.5, 2.02)):
            phases[k] += 2 * math.pi * base * mult / RATE
            s += math.sin(phases[k]) / (k + 1)
        trem = 0.6 + 0.4 * math.sin(2 * math.pi * 11 * t)
        out.append(s * trem * math.sin(math.pi * p) ** 0.8)
    noise = whoosh(dur, True)
    return [a + b * 0.6 for a, b in zip(out, noise)]


def error():
    out, phase = [], 0.0
    for i in range(int(RATE * 0.24)):
        t = i / RATE
        f = 196 if t < 0.1 else 147
        phase += 2 * math.pi * f / RATE
        sq = 1.0 if math.sin(phase) > 0 else -1.0
        out.append(sq * env(t % 0.12, 0.002, 0.04))
    return lowpass(out, 0.25)


def main(dest):
    C5, E5, G5, C6, D5, A5 = 523.25, 659.25, 783.99, 1046.5, 587.33, 880.0
    write(f"{dest}/click.wav", click())
    write(f"{dest}/back.wav", click(freq=860, dur=0.08), gain=0.7)
    write(f"{dest}/hover.wav", hover(), gain=0.35)
    write(f"{dest}/select.wav", pop(), gain=0.6)
    write(f"{dest}/navigate.wav", whoosh(), gain=0.45)
    write(f"{dest}/enter.wav", portal(), gain=0.6)
    write(f"{dest}/success.wav", bell([C5, E5, G5, C6]), gain=0.6)
    write(f"{dest}/achievement.wav", bell([G5, D5 * 2], step=0.12, tail=0.7), gain=0.55)
    write(f"{dest}/error.wav", error(), gain=0.45)
    write(f"{dest}/type.wav", click(freq=2400, dur=0.025, noise=0.6), gain=0.25)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "public/audio")

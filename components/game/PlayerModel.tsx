"use client";

import { useEffect, useMemo, useRef } from "react";
import { buildSkin, type BoxFaces } from "@/lib/icons/skin";
import type { AvatarPalette } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

interface PlayerModelProps {
  palette: AvatarPalette;
  /** Size of one skin pixel in GUI pixels. */
  scale?: number;
  name?: string;
  className?: string;
}

const u = (n: number) => `calc(var(--px) * ${n})`;

function Box({
  faces,
  w,
  h,
  d,
  x,
  y,
  className,
  style,
}: {
  faces: BoxFaces;
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const face = (bg: string, fw: number, fh: number, transform: string, shade = 1) => (
    <div
      className="absolute"
      style={{
        width: u(fw),
        height: u(fh),
        left: u((w - fw) / 2),
        top: u((h - fh) / 2),
        backgroundImage: bg,
        backgroundSize: "100% 100%",
        transform,
        backfaceVisibility: "hidden",
        filter: shade < 1 ? `brightness(${shade})` : undefined,
      }}
    />
  );
  return (
    <div
      className={cn("absolute", className)}
      style={{ width: u(w), height: u(h), left: u(x), top: u(y), transformStyle: "preserve-3d", ...style }}
    >
      {face(faces.front, w, h, `translateZ(${u(d / 2)})`)}
      {face(faces.back, w, h, `rotateY(180deg) translateZ(${u(d / 2)})`, 0.7)}
      {face(faces.right, d, h, `rotateY(90deg) translateZ(${u(w / 2)})`, 0.8)}
      {face(faces.left, d, h, `rotateY(-90deg) translateZ(${u(w / 2)})`, 0.8)}
      {face(faces.top, w, d, `rotateX(90deg) translateZ(${u(h / 2)})`, 1.06)}
      {face(faces.bottom, w, d, `rotateX(-90deg) translateZ(${u(h / 2)})`, 0.6)}
    </div>
  );
}

/**
 * Blocky player built from CSS 3D boxes. Like the game's inventory preview,
 * the head and body turn to follow the pointer.
 */
export function PlayerModel({ palette, scale = 3, name, className }: PlayerModelProps) {
  const skin = useMemo(() => buildSkin(palette), [palette]);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.18;
        const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
        el.style.setProperty("--body-y", `${dx * 22}deg`);
        el.style.setProperty("--head-y", `${dx * 24}deg`);
        el.style.setProperty("--head-x", `${-dy * 22}deg`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      className={cn("relative flex flex-col items-center", className)}
      style={{ ["--px" as string]: `calc(var(--gui) * ${scale})`, perspective: "calc(var(--gui) * 600)" }}
      aria-hidden
    >
      {name && (
        <div className="mb-3 bg-black/40 px-2 pt-1 text-shadow-mc whitespace-nowrap" style={{ lineHeight: 1.25 }}>
          {name}
        </div>
      )}
      <div
        className="relative"
        style={{
          width: u(16),
          height: u(32),
          transformStyle: "preserve-3d",
          transform: "rotateX(-8deg) rotateY(calc(var(--body-y, 0deg) - 18deg))",
          transition: "transform 90ms linear",
        }}
      >
        <Box
          faces={skin.head}
          w={8}
          h={8}
          d={8}
          x={4}
          y={0}
          style={{
            transformOrigin: "50% 100%",
            transform: "rotateY(calc(var(--head-y, 0deg) - var(--body-y, 0deg) * 0.4)) rotateX(var(--head-x, 0deg))",
            transition: "transform 90ms linear",
          }}
        />
        <Box faces={skin.body} w={8} h={12} d={4} x={4} y={8} />
        <Box faces={skin.armR} w={4} h={12} d={4} x={0} y={8} style={{ transformOrigin: "50% 8%", transform: "rotateZ(4deg)" }} />
        <Box faces={skin.armL} w={4} h={12} d={4} x={12} y={8} style={{ transformOrigin: "50% 8%", transform: "rotateZ(-4deg)" }} />
        <Box faces={skin.legR} w={4} h={12} d={4} x={4} y={20} />
        <Box faces={skin.legL} w={4} h={12} d={4} x={8} y={20} />
      </div>
    </div>
  );
}

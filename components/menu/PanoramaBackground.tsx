"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { completeBootTask } from "@/lib/boot";
import type { PanoramaEngine, PanoramaOptions } from "@/lib/panorama/engine";
import { useSettings } from "@/lib/settings/store";
import { useGame } from "@/components/game/GameProviders";

/**
 * Persistent world behind every screen (lives in the root layout so it is
 * never re-created on navigation). Sharp on the title screen, blurred and
 * dimmed behind other menus – the modern game's menu treatment.
 */
export function PanoramaBackground() {
  const pathname = usePathname();
  const settings = useSettings();
  const { reducedMotion } = useGame();
  const holder = useRef<HTMLDivElement>(null);
  const engine = useRef<PanoramaEngine | null>(null);
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);

  const dimmed = pathname !== "/";
  const options: PanoramaOptions = { animate: !reducedMotion, quality: settings.graphics, dimmed };
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    let cancelled = false;
    const container = holder.current;
    if (!container) return;
    import("@/lib/panorama/engine")
      .then(({ createPanorama }) =>
        createPanorama(
          container,
          optionsRef.current,
          () => !cancelled && setShown(true),
          () => !cancelled && setFailed(true),
        ),
      )
      .then((e) => {
        if (cancelled) e.dispose();
        else engine.current = e;
      })
      .catch(() => {
        completeBootTask("textures");
        completeBootTask("terrain");
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    engine.current?.configure({ animate: !reducedMotion, quality: settings.graphics, dimmed });
  }, [reducedMotion, settings.graphics, dimmed, shown]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: "var(--z-panorama)" }} aria-hidden>
      <FallbackLandscape />
      <div
        ref={holder}
        className="absolute inset-0 transition-[opacity,filter] duration-500"
        style={{
          opacity: shown && !failed ? 1 : 0,
          filter: dimmed ? "blur(calc(var(--gui) * 2.5))" : "none",
          transform: dimmed ? "scale(1.04)" : undefined,
        }}
      />
      {/* contrast scrim: light on the title screen, heavier behind menus */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: dimmed
            ? "rgb(0 0 0 / 0.42)"
            : "linear-gradient(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0) 40%, rgb(0 0 0 / 0.22))",
        }}
      />
    </div>
  );
}

/** Static pixel hills shown before WebGL is ready, or if it is unavailable. */
function FallbackLandscape() {
  const far = "M0 70 L0 52 L8 52 L8 48 L16 48 L16 44 L28 44 L28 50 L40 50 L40 40 L52 40 L52 46 L64 46 L64 38 L74 38 L74 44 L86 44 L86 48 L100 48 L100 70 Z";
  const near = "M0 70 L0 58 L10 58 L10 56 L22 56 L22 60 L34 60 L34 54 L46 54 L46 58 L60 58 L60 55 L72 55 L72 59 L84 59 L84 56 L100 56 L100 70 Z";
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 70" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
      <defs>
        <linearGradient id="fallback-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f9ff5" />
          <stop offset="0.7" stopColor="#c6dcff" />
        </linearGradient>
      </defs>
      <rect width="100" height="70" fill="url(#fallback-sky)" />
      <path d={far} fill="#9fb7c9" />
      <path d={near} fill="#5f8f45" />
      <rect y="62" width="100" height="8" fill="#6b4a31" />
    </svg>
  );
}

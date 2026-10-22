"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { EASE, registerGsap } from "@/lib/animation/gsap-utils";
import type { LoadingCopy } from "@/lib/animation/transitions";
import { PixelProgressBar } from "@/components/game/PixelProgressBar";

interface GameLoadingOverlayProps {
  copy: LoadingCopy;
  phase: "in" | "out";
  reducedMotion: boolean;
  onCovered: () => void;
  onHidden: () => void;
}

/**
 * Dirt-background loading screen shown between menus. It is decorative (the
 * route swap itself is instant), so the bar is an indeterminate sweep.
 */
export function GameLoadingOverlay({ copy, phase, reducedMotion, onCovered, onHidden }: GameLoadingOverlayProps) {
  const root = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onCovered, onHidden });
  useLayoutEffect(() => {
    callbacks.current = { onCovered, onHidden };
  });

  useLayoutEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    if (phase === "in") {
      const tl = gsap.timeline({ onComplete: () => callbacks.current.onCovered() });
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: reducedMotion ? 0.06 : 0.1, ease: "none" });
      if (!reducedMotion && text.current) {
        tl.fromTo(text.current, { y: 4 }, { y: 0, duration: 0.2, ease: EASE.out }, 0);
      }
      return () => {
        tl.kill();
      };
    }
    const tween = gsap.to(el, {
      autoAlpha: 0,
      duration: reducedMotion ? 0.1 : 0.18,
      ease: "none",
      onComplete: () => callbacks.current.onHidden(),
    });
    return () => {
      tween.kill();
    };
  }, [phase, reducedMotion]);

  return (
    <div
      ref={root}
      className="mc-dirt fixed inset-0 grid place-items-center"
      style={{ zIndex: "var(--z-overlay)", visibility: "hidden" }}
      role="status"
      aria-live="polite"
    >
      <div ref={text} className="flex w-[min(calc(var(--gui)*200),80vw)] flex-col items-center gap-4">
        <p className="mc-title">{copy.title}</p>
        {copy.detail && <p className="mc-title mc-muted">{copy.detail}</p>}
        <PixelProgressBar label={copy.title} className="mt-2 w-full" />
      </div>
    </div>
  );
}

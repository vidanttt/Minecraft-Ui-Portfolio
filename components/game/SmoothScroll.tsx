"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { cn } from "@/lib/utils/cn";
import { useGame } from "@/components/game/GameProviders";

interface SmoothScrollProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  label: string;
}

/**
 * Scroll area for long screens (project details, profile). Lenis smooths the
 * wheel only; keyboard, touch and scrollbar scrolling stay native. Driven by
 * the shared gsap.ticker so there is a single animation loop.
 */
export function SmoothScroll({ children, className, contentClassName, label }: SmoothScrollProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useGame();

  useEffect(() => {
    if (reducedMotion || !wrapper.current || !content.current) return;
    const lenis = new Lenis({
      wrapper: wrapper.current,
      content: content.current,
      autoRaf: false,
      lerp: 0.14,
      smoothWheel: true,
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return (
    <div
      ref={wrapper}
      className={cn("mc-scroll min-h-0 overflow-y-auto overscroll-contain", className)}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      <div ref={content} className={contentClassName}>
        {children}
      </div>
    </div>
  );
}

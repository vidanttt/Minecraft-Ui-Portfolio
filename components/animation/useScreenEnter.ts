"use client";

import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { registerGsap, screenEnter } from "@/lib/animation/gsap-utils";
import { useGame } from "@/components/game/GameProviders";

/**
 * Plays the staggered `[data-enter]` entrance for a screen once the boot
 * screen / loading overlay is out of the way. Re-runs when Next.js reveals a
 * preserved (Activity-hidden) route again, and reverts cleanly on hide.
 */
export function useScreenEnter(ref: RefObject<HTMLElement | null>) {
  const { bootDone, revealDelay } = useGame();
  useLayoutEffect(() => {
    const el = ref.current;
    if (!bootDone || !el) return;
    registerGsap();
    const ctx = gsap.context(() => {
      screenEnter(el, { delay: revealDelay() });
    }, el);
    return () => ctx.revert();
  }, [bootDone, revealDelay, ref]);
}

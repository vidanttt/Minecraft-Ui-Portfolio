"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

/** Motion tokens shared by GSAP and CSS (see --ease-* / --dur-* in globals.css). */
export const EASE = {
  /** Strong ease-out for entrances and UI responses. */
  out: "ui-out",
  /** Strong ease-in-out for things moving on screen. */
  inOut: "ui-in-out",
} as const;

export const DUR = {
  fast: 0.12,
  ui: 0.22,
  screen: 0.32,
  stagger: 0.04,
} as const;

export function registerGsap() {
  if (registered || typeof window === "undefined") return gsap;
  gsap.registerPlugin(CustomEase);
  CustomEase.create(EASE.out, "0.23, 1, 0.32, 1");
  CustomEase.create(EASE.inOut, "0.77, 0, 0.175, 1");
  // Lenis and the panorama render on gsap.ticker; keep it steady after tab switches.
  gsap.ticker.lagSmoothing(500, 33);
  registered = true;
  return gsap;
}

/** Reads the resolved motion preference that <GameProviders/> writes to <html>. */
export function prefersReducedMotion(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.motion === "reduced";
}

/**
 * Staggered entrance for every `[data-enter]` element inside `scope`.
 * Reduced motion keeps a short opacity fade and drops the movement.
 */
export function screenEnter(scope: Element, opts: { delay?: number } = {}) {
  registerGsap();
  const targets = Array.from(scope.querySelectorAll<HTMLElement>("[data-enter]"));
  if (!targets.length) return null;
  const reduced = prefersReducedMotion();
  return gsap.fromTo(
    targets,
    // data-enter="fade" skips the lift (e.g. footers pinned to the bottom edge)
    { autoAlpha: 0, y: (_: number, el: HTMLElement) => (reduced || el.dataset.enter === "fade" ? 0 : 6) },
    {
      autoAlpha: 1,
      y: 0,
      duration: reduced ? 0.15 : DUR.ui,
      ease: EASE.out,
      stagger: reduced ? 0 : DUR.stagger,
      delay: opts.delay ?? 0,
      clearProps: "transform,visibility,opacity",
    },
  );
}

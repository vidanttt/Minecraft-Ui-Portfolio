"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { BOOT_TASKS, bootProgress, subscribeBoot, type BootTask } from "@/lib/boot";
import { registerGsap } from "@/lib/animation/gsap-utils";
import { site } from "@/lib/data/site";
import { PixelProgressBar } from "@/components/game/PixelProgressBar";

const MAX_BOOT_MS = 3500;

const TASK_LABEL: Record<BootTask, string> = {
  fonts: "Loading fonts",
  sounds: "Loading sounds",
  textures: "Loading textures",
  terrain: "Building terrain",
};

/**
 * Launch screen shown on a hard load. Progress = finished start-up tasks
 * (fonts, sounds, textures, terrain). Hidden after all finish or a cap.
 */
export function BootScreen({
  onReveal,
  onHidden,
  reducedMotion,
}: {
  onReveal: () => void;
  onHidden: () => void;
  reducedMotion: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const progress = useSyncExternalStore(subscribeBoot, bootProgress, () => 0);
  const [leaving, setLeaving] = useState(false);
  const callbacks = useRef({ onReveal, onHidden });
  useLayoutEffect(() => {
    callbacks.current = { onReveal, onHidden };
  });

  useEffect(() => {
    if (progress >= 1) {
      // let the full bar register for a beat before fading
      const t = window.setTimeout(() => setLeaving(true), 150);
      return () => window.clearTimeout(t);
    }
  }, [progress]);

  useEffect(() => {
    const t = window.setTimeout(() => setLeaving(true), MAX_BOOT_MS);
    return () => window.clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    if (!leaving || !root.current) return;
    registerGsap();
    callbacks.current.onReveal();
    const tween = gsap.to(root.current, {
      autoAlpha: 0,
      duration: reducedMotion ? 0.12 : 0.35,
      ease: "none",
      onComplete: () => callbacks.current.onHidden(),
    });
    return () => {
      tween.kill();
    };
  }, [leaving, reducedMotion]);

  const current = BOOT_TASKS[Math.min(BOOT_TASKS.length - 1, Math.round(progress * BOOT_TASKS.length))];

  return (
    <div
      ref={root}
      className="boot-failsafe fixed inset-0 grid place-items-center bg-[#26262c]"
      style={{ zIndex: "var(--z-boot)" }}
      role="status"
      aria-label="Loading"
    >
      <div className="flex w-[min(calc(var(--gui)*220),84vw)] flex-col items-center gap-6">
        <p className="w-max max-w-[94vw] text-center text-gui-2x font-bold tracking-[0.06em] text-white">{site.edition}</p>
        <PixelProgressBar value={progress} label="Loading resources" className="w-full" />
        <p className="mc-title mc-muted" aria-live="polite">
          {progress >= 1 ? "Done" : `${TASK_LABEL[current]}...`}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { EASE, registerGsap } from "@/lib/animation/gsap-utils";
import type { Advancement } from "@/lib/data/advancements";
import { PixelIcon } from "@/components/game/PixelIcon";

const HOLD_S = 3;

/** Top-right "Advancement Made!" toasts, shown one at a time. */
export function AdvancementToasts({
  queue,
  onDone,
  reducedMotion,
}: {
  queue: Advancement[];
  onDone: () => void;
  reducedMotion: boolean;
}) {
  const current = queue[0];
  const ref = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useLayoutEffect(() => {
    done.current = onDone;
  });

  useLayoutEffect(() => {
    if (!current || !ref.current) return;
    registerGsap();
    const el = ref.current;
    const tl = gsap.timeline({ onComplete: () => done.current() });
    if (reducedMotion) {
      tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.15 })
        .to(el, { autoAlpha: 0, duration: 0.15 }, `+=${HOLD_S}`);
    } else {
      tl.fromTo(el, { xPercent: 110, autoAlpha: 1 }, { xPercent: 0, duration: 0.28, ease: EASE.out })
        .to(el, { xPercent: 110, duration: 0.22, ease: EASE.inOut }, `+=${HOLD_S}`);
    }
    return () => {
      tl.kill();
    };
  }, [current, reducedMotion]);

  return (
    <div
      className="pointer-events-none fixed top-2 right-2 overflow-hidden p-1"
      style={{ zIndex: "var(--z-toast)" }}
      aria-live="polite"
    >
      {current && (
        <div
          ref={ref}
          key={current.id}
          className="flex w-[calc(var(--gui)*160)] items-center gap-3 px-2 py-2"
          style={{
            visibility: "hidden",
            border: "calc(var(--gui) * 4) solid transparent",
            borderImage: "url(/textures/toast.png) 4 fill / calc(var(--gui) * 4) / 0 stretch",
            background: "#181818",
            backgroundClip: "padding-box",
          }}
        >
          <PixelIcon name={current.icon} className="size-16 shrink-0" />
          <div className="min-w-0">
            <p className="text-shadow-mc text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
              Advancement Made!
            </p>
            <p className="truncate text-shadow-mc">{current.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}

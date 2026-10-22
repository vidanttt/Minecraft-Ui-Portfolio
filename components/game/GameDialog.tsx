"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { EASE, registerGsap } from "@/lib/animation/gsap-utils";
import { useGame } from "@/components/game/GameProviders";

interface GameDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions: React.ReactNode;
}

/**
 * Modal screen on the dirt background, built on <dialog> for focus trapping
 * and Escape-to-close.
 */
export function GameDialog({ open, onClose, title, children, actions }: GameDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const { reducedMotion, play } = useGame();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Reset if the route is hidden by Activity while the dialog is open.
  useLayoutEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || !inner.current || reducedMotion) return;
    registerGsap();
    const t = gsap.fromTo(inner.current, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.2, ease: EASE.out });
    return () => {
      t.kill();
    };
  }, [open, reducedMotion]);

  return (
    <dialog
      ref={ref}
      className="mc-dirt m-0 h-dvh max-h-none w-screen max-w-none border-0 p-0 text-white backdrop:bg-transparent"
      aria-labelledby="game-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        play("back");
        onClose();
      }}
      onClose={() => open && onClose()}
    >
      <div ref={inner} className="flex h-full flex-col items-center px-4">
        <h2 id="game-dialog-title" className="mc-title pt-5 pb-4">
          {title}
        </h2>
        <div className="mc-scroll flex w-full max-w-[calc(var(--gui)*300)] min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto text-center">
          {children}
        </div>
        <div className="flex flex-wrap justify-center gap-1 pt-3 pb-4">{actions}</div>
      </div>
    </dialog>
  );
}

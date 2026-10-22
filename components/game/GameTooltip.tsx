"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipLine {
  text: string;
  color?: string;
  shadow?: string;
}

export interface TooltipState {
  lines: TooltipLine[];
  /** Pointer position, or an element to anchor to (keyboard focus). */
  x: number;
  y: number;
}

/**
 * The game's purple-rimmed tooltip. Appears instantly (no animation – it is
 * hovered dozens of times), follows the cursor and flips at screen edges.
 */
export function GameTooltip({ state }: { state: TooltipState | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!state || !el) return;
    const r = el.getBoundingClientRect();
    const gap = 12;
    let left = state.x + gap;
    let top = state.y - gap;
    if (left + r.width > window.innerWidth - 4) left = state.x - gap - r.width;
    if (top + r.height > window.innerHeight - 4) top = window.innerHeight - 4 - r.height;
    el.style.left = `${Math.max(4, left)}px`;
    el.style.top = `${Math.max(4, top)}px`;
    el.style.visibility = "visible";
  }, [state]);

  if (!state || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className="mc-tooltip fixed max-w-[calc(var(--gui)*180)]"
      style={{ left: 0, top: 0, visibility: "hidden", zIndex: "var(--z-tooltip)" }}
    >
      {state.lines.map((l, i) => (
        <p
          key={i}
          className={i === 0 ? "mb-1" : undefined}
          style={{ color: l.color, ["--shadow" as string]: l.shadow }}
        >
          {l.text}
        </p>
      ))}
    </div>,
    document.body,
  );
}

/** Pointer + focus handlers that drive a GameTooltip. Touch input never shows it. */
export function useTooltip() {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const bind = useCallback(
    (lines: TooltipLine[]) => ({
      onPointerMove: (e: React.PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        setTip({ lines, x: e.clientX, y: e.clientY });
      },
      onPointerLeave: () => setTip(null),
      onFocus: (e: React.FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.matches(":focus-visible")) return;
        const r = e.currentTarget.getBoundingClientRect();
        setTip({ lines, x: r.right, y: r.top });
      },
      onBlur: () => setTip(null),
    }),
    [],
  );
  return { tip, bind, hide: () => setTip(null) };
}

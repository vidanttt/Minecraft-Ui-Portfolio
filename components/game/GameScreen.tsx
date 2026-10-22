"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useScreenEnter } from "@/components/animation/useScreenEnter";

interface GameScreenProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Standard secondary-screen layout: centred title at the top, content in the
 * middle, action buttons along the bottom – the game's own menu skeleton.
 */
export function GameScreen({ title, subtitle, children, footer, className, bodyClassName }: GameScreenProps) {
  const ref = useRef<HTMLElement>(null);
  useScreenEnter(ref);
  return (
    <main
      ref={ref}
      className={cn("relative flex h-dvh flex-col", className)}
      style={{ zIndex: "var(--z-screen)" }}
    >
      <header className="shrink-0 px-4 pt-5 pb-3 text-center" data-enter>
        <h1 className="mc-title">{title}</h1>
        {subtitle && <div className="mc-title mc-muted mt-1">{subtitle}</div>}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>{children}</div>
      {footer && (
        <footer className="flex shrink-0 flex-col items-center gap-1 px-4 pt-3 pb-4" data-enter="fade">
          {footer}
        </footer>
      )}
    </main>
  );
}

/** A centred row of footer buttons that wraps on narrow screens. */
export function ButtonRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex max-w-full flex-wrap justify-center gap-1", className)}>{children}</div>;
}

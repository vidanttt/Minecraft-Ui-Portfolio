"use client";

import { useEffect } from "react";
import { GameButton } from "@/components/game/GameButton";

export default function GameError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error && typeof error === "object" && "digest" in error ? String((error as { digest?: unknown }).digest) : null;

  return (
    <main
      className="mc-dirt relative flex h-dvh flex-col items-center justify-center gap-3 px-4 text-center"
      style={{ zIndex: "var(--z-screen)" }}
    >
      <h1 className="mc-title">Oops! Something went wrong</h1>
      <p className="mc-muted text-shadow-mc mb-4">
        This screen crashed{digest ? ` (error ${digest})` : ""}. Your settings are safe.
      </p>
      <GameButton size="wide" onClick={() => retry()}>
        Try Again
      </GameButton>
      <GameButton href="/" size="wide" transition="back">
        Back to Title Screen
      </GameButton>
    </main>
  );
}

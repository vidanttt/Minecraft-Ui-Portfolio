import type { Metadata } from "next";
import { GameButton } from "@/components/game/GameButton";

export const metadata: Metadata = {
  title: "Connection Lost",
};

export default function NotFound() {
  return (
    <main
      className="mc-dirt relative flex h-dvh flex-col items-center justify-center gap-3 px-4 text-center"
      style={{ zIndex: "var(--z-screen)" }}
    >
      <h1 className="mc-title mc-muted">Connection Lost</h1>
      <p className="text-shadow-mc">This world doesn&apos;t exist (404).</p>
      <p className="mc-muted text-shadow-mc mb-4">The chunk you were looking for was never generated.</p>
      <GameButton href="/" size="wide" transition="menu">
        Back to Title Screen
      </GameButton>
    </main>
  );
}

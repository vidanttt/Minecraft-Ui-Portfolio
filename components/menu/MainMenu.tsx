"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/data/site";
import { updateSettings, useSettings } from "@/lib/settings/store";
import { gameAudio } from "@/lib/audio/game-audio";
import { useScreenEnter } from "@/components/animation/useScreenEnter";
import { GameButton } from "@/components/game/GameButton";
import { GameDialog } from "@/components/game/GameDialog";
import { PixelIcon } from "@/components/game/PixelIcon";
import { useGame } from "@/components/game/GameProviders";
import { Wordmark } from "@/components/menu/Wordmark";

const MENU = [
  { label: "About Me", href: "/about" },
  { label: "My Projects", href: "/projects" },
  { label: "Skills & Inventory", href: "/skills" },
  { label: "Socials", href: "/socials" },
  { label: "Contact", href: "/contact" },
] as const;

const SECRET_SPLASH = "You found the secret splash!";

export function MainMenu() {
  const ref = useRef<HTMLElement>(null);
  const nav = useRef<HTMLDivElement>(null);
  const settings = useSettings();
  const { unlock, play } = useGame();
  const [credits, setCredits] = useState(false);
  const [splash, setSplash] = useState<string | null>(null);
  const splashClicks = useRef(0);
  useScreenEnter(ref);

  // Picked on the client only, so server and client markup always match.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setSplash(site.splashes[Math.floor(Math.random() * site.splashes.length)]);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(nav.current?.querySelectorAll<HTMLElement>("a,button:not(:disabled)") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[i === -1 ? 0 : next]?.focus();
    e.preventDefault();
  };

  const toggleSound = () => {
    const next = !settings.sound;
    updateSettings({ sound: next });
    if (next) {
      gameAudio.setEnabled(true);
      gameAudio.play("click");
      unlock("sound-on");
    }
  };

  const onSplash = () => {
    splashClicks.current += 1;
    play("select", { pitch: 1 + splashClicks.current * 0.08 });
    if (splashClicks.current >= 5) {
      setSplash(SECRET_SPLASH);
      unlock("secret");
      splashClicks.current = 0;
    } else {
      setSplash(site.splashes[Math.floor(Math.random() * site.splashes.length)]);
    }
  };

  return (
    <main
      ref={ref}
      className="relative flex h-dvh flex-col overflow-x-hidden overflow-y-auto"
      style={{ zIndex: "var(--z-screen)" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-4">
        {/* title */}
        <div className="relative z-10 mb-9 w-[min(calc(var(--gui)*256),94vw)]" data-enter>
          <h1 className="sr-only">
            {site.wordmark}: {site.edition}
          </h1>
          <Wordmark text={site.wordmark} className="block h-auto w-full drop-shadow-[0_calc(var(--gui)*2)_0_rgb(0_0_0/0.25)]" />
          <p
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 font-bold whitespace-nowrap text-white"
            aria-hidden
            style={{
              textShadow:
                "var(--gui) 0 0 #000, calc(var(--gui) * -1) 0 0 #000, 0 var(--gui) 0 #000, 0 calc(var(--gui) * -1) 0 #000, calc(var(--gui) * 2) calc(var(--gui) * 2) 0 rgb(0 0 0 / 0.5)",
              letterSpacing: "0.12em",
            }}
          >
            {site.edition}
          </p>
          {splash && (
            <button
              type="button"
              tabIndex={-1}
              onClick={onSplash}
              className="mc-splash absolute top-[72%] left-[68%] w-max sm:left-[84%] -translate-x-1/2 cursor-default overflow-visible"
              aria-label="Splash text"
            >
              <span>{splash}</span>
            </button>
          )}
        </div>

        {/* menu */}
        <div
          ref={nav}
          className="flex w-full flex-col items-center"
          onKeyDown={onMenuKey}
          onClickCapture={() => unlock("title-screen")}
        >
          <nav aria-label="Main menu" className="flex w-full flex-col items-center gap-1">
            {MENU.map((item) => (
              <div key={item.href} data-enter className="flex w-full justify-center">
                <GameButton href={item.href} size="wide">
                  {item.label}
                </GameButton>
              </div>
            ))}
          </nav>
          <div className="mt-3 flex max-w-full items-center justify-center gap-1" data-enter>
            <GameButton
              size="icon"
              onClick={toggleSound}
              sound={null}
              aria-label={settings.sound ? "Mute sounds" : "Unmute sounds"}
              aria-pressed={settings.sound}
              title={settings.sound ? "Sounds: ON" : "Sounds: OFF"}
            >
              <PixelIcon name={settings.sound ? "speaker" : "speakerOff"} />
            </GameButton>
            <GameButton href="/settings" size="half">
              Options...
            </GameButton>
            <GameButton size="half" onClick={() => setCredits(true)}>
              Credits
            </GameButton>
            <GameButton href="/settings#accessibility" size="icon" aria-label="Accessibility settings" title="Accessibility">
              <PixelIcon name="person" />
            </GameButton>
          </div>
        </div>
      </div>

      <footer
        className="flex shrink-0 flex-wrap items-end justify-between gap-x-4 gap-y-1 px-1 pb-1 text-shadow-mc"
        data-enter="fade"
      >
        <p>{site.version}</p>
        <p className="text-right">{site.disclaimer}</p>
      </footer>

      <GameDialog
        open={credits}
        onClose={() => setCredits(false)}
        title="Credits"
        actions={
          <GameButton size="mid" onClick={() => setCredits(false)}>
            Done
          </GameButton>
        }
      >
        <Credits />
      </GameDialog>
    </main>
  );
}

function Credits() {
  const rows: [string, string][] = [
    ["Built with", "Next.js, React, TypeScript, Tailwind CSS"],
    ["Motion", "GSAP and Lenis"],
    ["Panorama", "Three.js, procedurally generated terrain"],
    ["Font", "Blockfolio, an original pixel font made for this site"],
    ["Sounds", "Original effects synthesised for this site"],
    ["Music", "Generated live with the Web Audio API"],
    ["Textures", "Original 16x16 pixel art"],
  ];
  return (
    <>
      {rows.map(([k, v]) => (
        <div key={k} className="mb-2">
          <p className="text-shadow-mc text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
            {k}
          </p>
          <p className="text-shadow-mc">{v}</p>
        </div>
      ))}
      <p className="mc-muted text-shadow-mc mt-3 max-w-[calc(var(--gui)*260)]">{site.disclaimer}</p>
    </>
  );
}

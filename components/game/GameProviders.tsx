"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gameAudio, type SoundName } from "@/lib/audio/game-audio";
import { loadingCopyFor, parentRoute, type LoadingCopy, type TransitionKind } from "@/lib/animation/transitions";
import { registerGsap } from "@/lib/animation/gsap-utils";
import { completeBootTask } from "@/lib/boot";
import { advancements, type Advancement, type AdvancementId } from "@/lib/data/advancements";
import { grantAdvancement, useSettings } from "@/lib/settings/store";
import { GameLoadingOverlay } from "@/components/game/GameLoadingOverlay";
import { BootScreen } from "@/components/game/BootScreen";
import { AdvancementToasts } from "@/components/game/AdvancementToasts";

/** How long a decorative screen transition stays up (fade-in included). */
const MIN_OVERLAY_MS = 420;
const OVERLAY_FAILSAFE_MS = 8000;

export interface NavigateOptions {
  kind?: TransitionKind;
  /** Override the default sound; `null` for silence. */
  sound?: SoundName | null;
}

interface GameContextValue {
  navigate: (href: string, opts?: NavigateOptions) => void;
  play: (name: SoundName, opts?: { pitch?: number }) => void;
  unlock: (id: AdvancementId) => void;
  /** Seconds until the current loading overlay starts revealing the next screen. */
  revealDelay: () => number;
  bootDone: boolean;
  reducedMotion: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProviders>");
  return ctx;
}

interface OverlayState {
  id: number;
  copy: LoadingCopy;
  phase: "in" | "out";
}

function useResolvedMotion(pref: "system" | "reduced" | "full"): boolean {
  const [systemReduced, setSystemReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return pref === "reduced" || (pref === "system" && systemReduced);
}

export function GameProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const settings = useSettings();
  const reducedMotion = useResolvedMotion(settings.motion);

  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [bootPhase, setBootPhase] = useState<"boot" | "revealing" | "done">("boot");
  const bootDone = bootPhase !== "boot";
  const [toasts, setToasts] = useState<Advancement[]>([]);

  const pathnameRef = useRef(pathname);
  const busyRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);
  const startRef = useRef(0);
  const overlayIdRef = useRef(0);
  const failsafeRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  // ---- environment sync ---------------------------------------------------
  useEffect(() => {
    registerGsap();
    gameAudio.bindUnlock();
    void gameAudio.preload().then(() => completeBootTask("sounds"));
    if ("fonts" in document) {
      void document.fonts.ready.then(() => completeBootTask("fonts"));
    } else {
      completeBootTask("fonts");
    }
  }, []);

  useEffect(() => {
    gameAudio.setEnabled(settings.sound);
    gameAudio.setVolume(settings.masterVolume);
    gameAudio.setMusic(settings.music, settings.musicVolume);
  }, [settings.sound, settings.masterVolume, settings.music, settings.musicVolume]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.motion = reducedMotion ? "reduced" : "full";
    if (settings.guiScale === "auto") delete root.dataset.gui;
    else root.dataset.gui = String(settings.guiScale);
  }, [reducedMotion, settings.guiScale]);

  // ---- sound & advancements ----------------------------------------------
  const play = useCallback((name: SoundName, opts?: { pitch?: number }) => {
    gameAudio.play(name, opts);
  }, []);

  const unlock = useCallback((id: AdvancementId) => {
    if (!grantAdvancement(id)) return;
    const adv = advancements.find((a) => a.id === id);
    if (!adv) return;
    setToasts((t) => [...t, adv]);
    gameAudio.play("achievement");
  }, []);

  // ---- screen transitions -------------------------------------------------
  const clearTimers = () => {
    if (failsafeRef.current !== null) window.clearTimeout(failsafeRef.current);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    failsafeRef.current = null;
    hideTimerRef.current = null;
  };

  const beginHide = useCallback(() => {
    clearTimers();
    setOverlay((o) => (o ? { ...o, phase: "out" } : o));
  }, []);

  const navigate = useCallback(
    (href: string, opts: NavigateOptions = {}) => {
      const kind = opts.kind ?? "menu";
      const target = href.split(/[?#]/)[0] || "/";
      const sound =
        opts.sound === undefined ? (kind === "back" ? "back" : kind === "world" ? "enter" : "click") : opts.sound;
      if (sound) gameAudio.play(sound);
      if (busyRef.current) return;
      if (target === pathnameRef.current) {
        if (href.includes("#")) router.push(href);
        return;
      }
      if (kind === "back") {
        router.push(href);
        return;
      }
      busyRef.current = true;
      pendingHrefRef.current = href;
      startRef.current = performance.now();
      overlayIdRef.current += 1;
      setOverlay({ id: overlayIdRef.current, copy: loadingCopyFor(target, pathnameRef.current), phase: "in" });
      failsafeRef.current = window.setTimeout(beginHide, OVERLAY_FAILSAFE_MS);
      if (kind === "world") gameAudio.play("navigate");
    },
    [router, beginHide],
  );

  /** Overlay is fully opaque: swap the route underneath it. */
  const handleCovered = useCallback(() => {
    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) router.push(href);
  }, [router]);

  const handleHidden = useCallback(() => {
    clearTimers();
    busyRef.current = false;
    setOverlay(null);
  }, []);

  // When the route has changed (our push, or browser back/forward), reveal it.
  useEffect(() => {
    const changed = pathnameRef.current !== pathname;
    pathnameRef.current = pathname;
    if (!changed || !busyRef.current) return;
    // Browser back/forward while covering: never push the stale destination.
    pendingHrefRef.current = null;
    const wait = Math.max(0, startRef.current + MIN_OVERLAY_MS - performance.now());
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(beginHide, wait);
  }, [pathname, beginHide]);

  useEffect(() => clearTimers, []);

  const revealDelay = useCallback(() => {
    if (!busyRef.current) return 0;
    return Math.max(0, startRef.current + MIN_OVERLAY_MS - performance.now()) / 1000;
  }, []);

  // ---- Escape returns to the parent screen, like the game ------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.repeat) return;
      if (document.querySelector("dialog[open]")) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        el.blur();
        return;
      }
      const parent = parentRoute(pathnameRef.current);
      if (parent) navigate(parent, { kind: "back" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const value = useMemo<GameContextValue>(
    () => ({ navigate, play, unlock, revealDelay, bootDone, reducedMotion }),
    [navigate, play, unlock, revealDelay, bootDone, reducedMotion],
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <AdvancementToasts
        queue={toasts}
        onDone={() => setToasts((t) => t.slice(1))}
        reducedMotion={reducedMotion}
      />
      {overlay && (
        <GameLoadingOverlay
          key={overlay.id}
          copy={overlay.copy}
          phase={overlay.phase}
          reducedMotion={reducedMotion}
          onCovered={handleCovered}
          onHidden={handleHidden}
        />
      )}
      {bootPhase !== "done" && (
        <BootScreen
          onReveal={() => setBootPhase("revealing")}
          onHidden={() => setBootPhase("done")}
          reducedMotion={reducedMotion}
        />
      )}
    </GameContext.Provider>
  );
}

"use client";

import { useSyncExternalStore } from "react";
import type { AdvancementId } from "@/lib/data/advancements";

export type MotionPreference = "system" | "reduced" | "full";
export type GraphicsMode = "fancy" | "fast";
export type GuiScale = "auto" | 2 | 3 | 4;

export interface GameSettings {
  sound: boolean;
  masterVolume: number;
  music: boolean;
  musicVolume: number;
  motion: MotionPreference;
  graphics: GraphicsMode;
  guiScale: GuiScale;
}

export interface GameProgress {
  advancements: Partial<Record<AdvancementId, number>>;
  visitedWorlds: string[];
}

export interface GameState {
  settings: GameSettings;
  progress: GameProgress;
}

export const DEFAULT_SETTINGS: GameSettings = {
  sound: true,
  masterVolume: 0.7,
  music: false,
  musicVolume: 0.5,
  motion: "system",
  graphics: "fancy",
  guiScale: "auto",
};

const DEFAULT_STATE: GameState = {
  settings: DEFAULT_SETTINGS,
  progress: { advancements: {}, visitedWorlds: [] },
};

const STORAGE_KEY = "portfolio-edition:v1";

let state: GameState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function clamp01(n: unknown, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

function sanitize(raw: unknown): GameState {
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const r = raw as Partial<GameState>;
  const s = (r.settings ?? {}) as Partial<GameSettings>;
  const p = (r.progress ?? {}) as Partial<GameProgress>;
  return {
    settings: {
      sound: typeof s.sound === "boolean" ? s.sound : DEFAULT_SETTINGS.sound,
      masterVolume: clamp01(s.masterVolume, DEFAULT_SETTINGS.masterVolume),
      music: typeof s.music === "boolean" ? s.music : DEFAULT_SETTINGS.music,
      musicVolume: clamp01(s.musicVolume, DEFAULT_SETTINGS.musicVolume),
      motion: s.motion === "reduced" || s.motion === "full" ? s.motion : "system",
      graphics: s.graphics === "fast" ? "fast" : "fancy",
      guiScale: s.guiScale === 2 || s.guiScale === 3 || s.guiScale === 4 ? s.guiScale : "auto",
    },
    progress: {
      advancements:
        p.advancements && typeof p.advancements === "object" ? { ...p.advancements } : {},
      visitedWorlds: Array.isArray(p.visitedWorlds)
        ? p.visitedWorlds.filter((w): w is string => typeof w === "string")
        : [],
    },
  };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = sanitize(JSON.parse(raw));
  } catch {
    // storage unavailable (private mode, blocked) – keep defaults
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    try {
      state = sanitize(JSON.parse(e.newValue));
      emit();
    } catch {
      /* ignore malformed */
    }
  });
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy errors */
  }
}

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGameState(): GameState {
  load();
  return state;
}

const getServerSnapshot = () => DEFAULT_STATE;

export function useGameState<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getGameState()),
    () => selector(getServerSnapshot()),
  );
}

export function useSettings(): GameSettings {
  return useGameState((s) => s.settings);
}

export function updateSettings(patch: Partial<GameSettings>) {
  load();
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist();
  emit();
}

/** Returns true when the advancement was newly granted. */
export function grantAdvancement(id: AdvancementId): boolean {
  load();
  if (state.progress.advancements[id]) return false;
  state = {
    ...state,
    progress: {
      ...state.progress,
      advancements: { ...state.progress.advancements, [id]: Date.now() },
    },
  };
  persist();
  emit();
  return true;
}

export function markWorldVisited(slug: string): string[] {
  load();
  if (!state.progress.visitedWorlds.includes(slug)) {
    state = {
      ...state,
      progress: { ...state.progress, visitedWorlds: [...state.progress.visitedWorlds, slug] },
    };
    persist();
    emit();
  }
  return state.progress.visitedWorlds;
}

export function resetProgress() {
  load();
  state = { ...state, progress: { advancements: {}, visitedWorlds: [] } };
  persist();
  emit();
}

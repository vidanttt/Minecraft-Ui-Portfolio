"use client";

/**
 * Real start-up work tracked by the boot screen. The progress bar shows
 * completed tasks / known total; nothing here is simulated.
 */
export type BootTask = "fonts" | "sounds" | "textures" | "terrain";

export const BOOT_TASKS: readonly BootTask[] = ["fonts", "sounds", "textures", "terrain"];

const done = new Set<BootTask>();
const listeners = new Set<() => void>();

export function completeBootTask(task: BootTask) {
  if (done.has(task)) return;
  done.add(task);
  for (const l of listeners) l();
}

export function bootProgress(): number {
  return done.size / BOOT_TASKS.length;
}

export function subscribeBoot(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

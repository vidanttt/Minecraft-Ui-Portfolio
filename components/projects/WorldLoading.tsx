import { PixelProgressBar } from "@/components/game/PixelProgressBar";

/** Streaming fallback while a world's data resolves (real wait, so it uses an indeterminate bar). */
export function WorldLoading({ title = "Loading world", detail = "Generating terrain" }: { title?: string; detail?: string }) {
  return (
    <main className="mc-dirt relative grid h-dvh place-items-center" style={{ zIndex: "var(--z-screen)" }}>
      <div className="flex w-[min(calc(var(--gui)*200),80vw)] flex-col items-center gap-4" role="status">
        <p className="mc-title">{title}</p>
        <p className="mc-title mc-muted">{detail}</p>
        <PixelProgressBar label={title} className="mt-2 w-full" />
      </div>
    </main>
  );
}

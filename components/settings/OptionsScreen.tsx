"use client";

import { useEffect, useState } from "react";
import { gameAudio } from "@/lib/audio/game-audio";
import {
  DEFAULT_SETTINGS,
  resetProgress,
  updateSettings,
  useSettings,
  type GraphicsMode,
  type GuiScale,
  type MotionPreference,
} from "@/lib/settings/store";
import { GameButton } from "@/components/game/GameButton";
import { GameDialog } from "@/components/game/GameDialog";
import { GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";

function cycle<T>(values: readonly T[], current: T): T {
  return values[(values.indexOf(current) + 1) % values.length];
}

const MOTION: readonly MotionPreference[] = ["system", "reduced", "full"];
const MOTION_LABEL: Record<MotionPreference, string> = { system: "System", reduced: "Reduced", full: "Full" };
const GRAPHICS: readonly GraphicsMode[] = ["fancy", "fast"];
const GUI: readonly GuiScale[] = ["auto", 2, 3, 4];

/** Labelled slider in the game's style: the value is printed on the track. */
function GameSlider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const pct = Math.round(value * 100);
  const text = `${label}: ${pct === 0 ? "OFF" : `${pct}%`}`;
  return (
    <label className="mc-slider mc-btn-mid max-w-full">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        disabled={disabled}
        aria-label={label}
        aria-valuetext={pct === 0 ? "Off" : `${pct}%`}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
      <span className="mc-slider-label">{text}</span>
    </label>
  );
}

export function OptionsScreen() {
  const s = useSettings();
  const { unlock } = useGame();
  const [confirmReset, setConfirmReset] = useState(false);

  // Deep link from the title screen's accessibility button: /settings#accessibility
  useEffect(() => {
    if (window.location.hash !== "#accessibility") return;
    const t = window.setTimeout(() => {
      document.getElementById("accessibility")?.querySelector<HTMLElement>("button,input")?.focus();
    }, 450);
    return () => window.clearTimeout(t);
  }, []);

  const setSound = (on: boolean) => {
    updateSettings({ sound: on });
    if (on) {
      gameAudio.setEnabled(true);
      gameAudio.play("click");
      unlock("sound-on");
    }
  };

  return (
    <GameScreen
      title="Options"
      bodyClassName="overflow-y-auto mc-scroll"
      footer={
        <GameButton size="wide" href="/" transition="back">
          Done
        </GameButton>
      }
    >
      <div className="flex flex-col items-center gap-5 px-4 pb-2">
        <OptionGroup title="Music & Sounds">
          <GameSlider label="Master Volume" value={s.masterVolume} onChange={(v) => updateSettings({ masterVolume: v })} />
          <GameButton size="mid" sound={null} onClick={() => setSound(!s.sound)} aria-pressed={s.sound}>
            Sounds: {s.sound ? "ON" : "OFF"}
          </GameButton>
          <GameButton size="mid" onClick={() => updateSettings({ music: !s.music })} aria-pressed={s.music}>
            Music: {s.music ? "ON" : "OFF"}
          </GameButton>
          <GameSlider
            label="Music"
            value={s.musicVolume}
            onChange={(v) => updateSettings({ musicVolume: v })}
            disabled={!s.music}
          />
        </OptionGroup>

        <OptionGroup title="Video Settings">
          <GameButton size="mid" onClick={() => updateSettings({ graphics: cycle(GRAPHICS, s.graphics) })}>
            Graphics: {s.graphics === "fancy" ? "Fancy" : "Fast"}
          </GameButton>
          <GameButton size="mid" onClick={() => updateSettings({ guiScale: cycle(GUI, s.guiScale) })}>
            GUI Scale: {s.guiScale === "auto" ? "Auto" : s.guiScale}
          </GameButton>
        </OptionGroup>

        <OptionGroup title="Accessibility" id="accessibility">
          <GameButton size="mid" onClick={() => updateSettings({ motion: cycle(MOTION, s.motion) })}>
            Animations: {MOTION_LABEL[s.motion]}
          </GameButton>
          <GameButton
            size="mid"
            onClick={() =>
              updateSettings({
                motion: DEFAULT_SETTINGS.motion,
                guiScale: DEFAULT_SETTINGS.guiScale,
                graphics: DEFAULT_SETTINGS.graphics,
              })
            }
          >
            Reset Video & Motion
          </GameButton>
        </OptionGroup>

        <OptionGroup title="Progress">
          <GameButton size="mid" onClick={() => setConfirmReset(true)}>
            Reset Advancements...
          </GameButton>
        </OptionGroup>

        <div className="mc-muted text-shadow-mc max-w-[calc(var(--gui)*304)] text-center" data-enter>
          <p>Keys: Esc goes back · Arrow keys move through lists · Enter selects</p>
        </div>
      </div>

      <GameDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset advancements?"
        actions={
          <>
            <GameButton
              size="mid"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Reset
            </GameButton>
            <GameButton size="mid" onClick={() => setConfirmReset(false)} sound="back">
              Cancel
            </GameButton>
          </>
        }
      >
        <p className="text-shadow-mc">All advancements you earned here will be cleared.</p>
        <p className="mc-muted text-shadow-mc">This only affects this browser.</p>
      </GameDialog>
    </GameScreen>
  );
}

function OptionGroup({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="flex flex-col items-center" data-enter>
      <h2 id={id ? `${id}-title` : undefined} className="mc-title mb-2">
        {title}
      </h2>
      <div className="grid max-w-full grid-cols-1 gap-1 sm:grid-cols-2">{children}</div>
    </section>
  );
}

"use client";

import { advancements } from "@/lib/data/advancements";
import { useGameState } from "@/lib/settings/store";
import type { PlayerProfile as Profile, PixelIconName } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { GameButton } from "@/components/game/GameButton";
import { ButtonRow, GameScreen } from "@/components/game/GameScreen";
import { GameTooltip, useTooltip, type TooltipLine } from "@/components/game/GameTooltip";
import { PixelIcon } from "@/components/game/PixelIcon";
import { PlayerModel } from "@/components/game/PlayerModel";
import { SmoothScroll } from "@/components/game/SmoothScroll";

const yellow = { color: "#ffff55", ["--shadow" as string]: "#3f3f15" } as React.CSSProperties;

export function PlayerProfile({ profile }: { profile: Profile }) {
  const earned = useGameState((s) => s.progress.advancements);
  const { tip, bind } = useTooltip();
  const earnedCount = advancements.filter((a) => earned[a.id]).length;

  const stats: [string, string][] = [
    ["Player Name", profile.displayName],
    ["Class", profile.identity],
    ["Current Quest", profile.currentQuest],
    ["Play Style", profile.playStyle],
    ...(profile.location ? ([["Spawn Point", profile.location]] as [string, string][]) : []),
  ];

  return (
    <GameScreen
      title="Player Profile"
      subtitle={profile.identity}
      footer={
        <ButtonRow>
          <GameButton size="mid" href="/projects">
            View Worlds
          </GameButton>
          <GameButton size="mid" href="/" transition="back">
            Done
          </GameButton>
        </ButtonRow>
      }
    >
      <SmoothScroll label="Player profile" className="mc-list flex-1" contentClassName="px-4 py-4">
        <div className="mx-auto flex w-full max-w-[calc(var(--gui)*340)] flex-col gap-5">
          <div className="flex flex-wrap items-stretch justify-center gap-4">
            {/* player preview */}
            <div
              className="relative grid w-[calc(var(--gui)*96)] shrink-0 place-items-end justify-center bg-black/60 pt-3 pb-4 shadow-[inset_var(--gui)_var(--gui)_0_#373737,inset_calc(var(--gui)*-1)_calc(var(--gui)*-1)_0_#8b8b8b]"
              data-enter
            >
              <PlayerModel palette={profile.avatar} scale={3} name={profile.playerName} />
            </div>

            {/* statistics */}
            <section className="mc-panel min-w-0 flex-1 basis-[calc(var(--gui)*200)] px-3 py-2" aria-label="Statistics" data-enter>
              <h2 className="mc-label mb-2">Statistics</h2>
              <dl className="flex flex-col">
                {stats.map(([k, v], i) => (
                  <div
                    key={k}
                    className={cn("grid grid-cols-[calc(var(--gui)*64)_1fr] gap-x-3 px-1 py-1", i % 2 === 0 && "bg-black/[0.06]")}
                  >
                    <dt className="mc-label">{k}</dt>
                    <dd className="text-[#202020]">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section data-enter>
            <h2 className="text-shadow-mc mb-1" style={yellow}>
              About
            </h2>
            <p className="text-shadow-mc max-w-[70ch]">{profile.intro}</p>
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <ItemList title="Special Abilities" items={profile.specialAbilities} icon="star" bind={bind} />
            <ItemList title="Interests" items={profile.interests} icon="compass" bind={bind} />
          </div>

          <section data-enter>
            <h2 className="text-shadow-mc mb-1" style={yellow}>
              How I Build
            </h2>
            <p className="text-shadow-mc max-w-[70ch]">{profile.approach}</p>
          </section>

          <section data-enter aria-label="Milestones">
            <h2 className="text-shadow-mc mb-2" style={yellow}>
              Milestones
            </h2>
            <ul className="flex flex-col gap-2">
              {profile.milestones.map((m) => (
                <li key={m.title} className="flex items-center gap-3 bg-black/40 p-2">
                  <Frame done icon={m.icon} />
                  <div className="min-w-0 text-shadow-mc">
                    <p>
                      {m.title}
                      {m.when && <span className="mc-muted"> · {m.when}</span>}
                    </p>
                    <p className="mc-muted">{m.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section data-enter aria-label="Your advancements">
            <h2 className="text-shadow-mc mb-1" style={yellow}>
              Your Advancements ({earnedCount}/{advancements.length})
            </h2>
            <p className="mc-muted text-shadow-mc mb-2">Earned by exploring this portfolio. Saved in your browser only.</p>
            <ul className="flex flex-wrap gap-2">
              {advancements.map((a) => {
                const done = Boolean(earned[a.id]);
                const secret = a.hidden && !done;
                const lines: TooltipLine[] = [
                  { text: secret ? "???" : a.title, color: done ? "#55ff55" : "#ffffff", shadow: done ? "#153f15" : "#3f3f3f" },
                  { text: secret ? "Keep exploring..." : a.description, color: "#aaaaaa", shadow: "#2a2a2a" },
                ];
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className="block"
                      aria-label={`${secret ? "Hidden advancement" : a.title}: ${done ? "earned" : "not earned yet"}`}
                      {...bind(lines)}
                    >
                      <Frame done={done} icon={secret ? "lock" : a.icon} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </SmoothScroll>
      <GameTooltip state={tip} />
    </GameScreen>
  );
}

function Frame({ done, icon }: { done: boolean; icon: PixelIconName }) {
  return (
    <span
      className="grid size-[calc(var(--gui)*26)] shrink-0 place-items-center"
      style={{
        background: done ? "#c99a2e" : "#5d5d5d",
        boxShadow: done
          ? "0 0 0 var(--gui) #000, inset var(--gui) var(--gui) 0 #ffe27a, inset calc(var(--gui) * -1) calc(var(--gui) * -1) 0 #7a5a14"
          : "0 0 0 var(--gui) #000, inset var(--gui) var(--gui) 0 #8f8f8f, inset calc(var(--gui) * -1) calc(var(--gui) * -1) 0 #333",
      }}
    >
      <PixelIcon name={icon} className={cn("size-16", !done && "opacity-50 grayscale")} />
    </span>
  );
}

function ItemList({
  title,
  items,
  icon,
  bind,
}: {
  title: string;
  items: string[];
  icon: PixelIconName;
  bind: ReturnType<typeof useTooltip>["bind"];
}) {
  return (
    <section data-enter>
      <h2 className="text-shadow-mc mb-2" style={yellow}>
        {title}
      </h2>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2" {...bind([{ text: item }, { text: title, color: "#5555ff", shadow: "#15153f" }])}>
            <span className="mc-slot shrink-0">
              <PixelIcon name={icon} />
            </span>
            <span className="text-shadow-mc">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

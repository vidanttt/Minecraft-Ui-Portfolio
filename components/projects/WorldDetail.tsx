"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { statusLabel } from "@/lib/data/projects";
import { skills } from "@/lib/data/skills";
import { markWorldVisited } from "@/lib/settings/store";
import type { Project } from "@/lib/types";
import { GameButton } from "@/components/game/GameButton";
import { ButtonRow, GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";
import { PixelIcon } from "@/components/game/PixelIcon";
import { SmoothScroll } from "@/components/game/SmoothScroll";
import { WorldIcon } from "@/components/projects/WorldIcon";

export function WorldDetail({ project: p, totalWorlds }: { project: Project; totalWorlds: number }) {
  const { unlock, play } = useGame();
  const [shot, setShot] = useState(0);

  useEffect(() => {
    const visited = markWorldVisited(p.slug);
    unlock("first-world");
    if (visited.length >= totalWorlds) unlock("world-hopper");
  }, [p.slug, totalWorlds, unlock]);

  const info: [string, string][] = [
    ["Category", p.category],
    ["Game Mode", p.mode],
    ...(p.year ? ([["Created", p.year]] as [string, string][]) : []),
    ["Status", statusLabel[p.status]],
  ];
  const current = p.gallery[shot];

  return (
    <GameScreen
      title={p.title}
      subtitle={`${p.mode} Mode · ${p.category}`}
      footer={
        <>
          <ButtonRow>
            <GameButton
              size="mid"
              href={p.liveUrl ?? ""}
              external
              disabled={!p.liveUrl}
              title={p.liveUrl ? undefined : "No live demo for this world"}
            >
              Open Live Demo
            </GameButton>
            <GameButton
              size="mid"
              href={p.sourceUrl ?? ""}
              external
              disabled={!p.sourceUrl}
              title={p.sourceUrl ? undefined : "No public source for this world"}
            >
              View Source
            </GameButton>
          </ButtonRow>
          <ButtonRow>
            <GameButton size="mid" href="/projects" transition="back">
              Back to Worlds
            </GameButton>
            <GameButton size="mid" href="/" transition="menu">
              Title Screen
            </GameButton>
          </ButtonRow>
        </>
      }
    >
      <SmoothScroll label={`${p.title} details`} className="mc-list flex-1" contentClassName="px-4 py-4">
        <article className="mx-auto flex w-full max-w-[calc(var(--gui)*320)] flex-col gap-4">
          <figure className="mc-panel p-1" data-enter>
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-black">
              {p.cover ? (
                <Image
                  src={p.cover.src}
                  alt={p.cover.alt}
                  fill
                  sizes="(min-width: 1200px) 960px, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <WorldIcon slug={p.slug} detail={48} className="size-full" />
              )}
            </div>
          </figure>

          {p.placeholder && (
            <p className="text-shadow-mc text-center text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }} data-enter>
              This save slot is empty. Add your project in lib/data/projects.ts.
            </p>
          )}

          <section className="mc-panel px-3 py-2" aria-label="World info" data-enter>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              {info.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="mc-label">{k}</dt>
                  <dd className="text-[#202020]">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Section title="About this world">{p.description}</Section>
          {p.objective && <Section title="Objective">{p.objective}</Section>}

          {p.tech.length > 0 && (
            <section data-enter>
              <h2 className="text-shadow-mc mb-2 text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
                Built with
              </h2>
              <ul className="flex flex-wrap gap-2">
                {p.tech.map((t) => {
                  const skill = skills.find((s) => s.name.toLowerCase() === t.toLowerCase());
                  return (
                    <li key={t} className="flex items-center gap-2 bg-black/40 py-1 pr-3 pl-1">
                      <span className="mc-slot">
                        <PixelIcon name={skill?.icon ?? "chest"} />
                      </span>
                      <span className="text-shadow-mc">{t}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {p.gallery.length > 0 && current && (
            <section data-enter aria-label="Screenshots">
              <h2 className="text-shadow-mc mb-2 text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
                Maps
              </h2>
              <figure className="mc-panel p-1">
                <Image
                  src={current.src}
                  alt={current.alt}
                  width={current.width}
                  height={current.height}
                  sizes="(min-width: 1200px) 960px, 100vw"
                  className="h-auto w-full"
                />
                {current.caption && <figcaption className="mc-label px-1 pt-1">{current.caption}</figcaption>}
              </figure>
              {p.gallery.length > 1 && (
                <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Choose screenshot">
                  {p.gallery.map((m, i) => (
                    <button
                      key={m.src}
                      type="button"
                      onClick={() => {
                        play("select");
                        setShot(i);
                      }}
                      aria-pressed={i === shot}
                      aria-label={`Show screenshot ${i + 1}: ${m.alt}`}
                      className={`mc-slot overflow-hidden ${i === shot ? "outline-[length:var(--gui)] outline-white outline-solid" : ""}`}
                    >
                      <Image src={m.src} alt="" width={32} height={32} className="size-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </article>
      </SmoothScroll>
    </GameScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-enter>
      <h2 className="text-shadow-mc mb-1 text-mc-yellow" style={{ ["--shadow" as string]: "#3f3f15" }}>
        {title}
      </h2>
      <p className="text-shadow-mc max-w-[70ch]">{children}</p>
    </section>
  );
}

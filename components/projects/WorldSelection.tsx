"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { statusLabel } from "@/lib/data/projects";
import type { Project } from "@/lib/types";
import { GameButton } from "@/components/game/GameButton";
import { ButtonRow, GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";
import { WorldIcon } from "@/components/projects/WorldIcon";

/**
 * "Select World": a listbox of saves. Click selects, double-click / Enter /
 * Play enters. Arrow keys move the selection.
 */
export function WorldSelection({ projects }: { projects: Project[] }) {
  const { navigate, play } = useGame();
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(projects[0]?.slug ?? null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.summary, p.category, ...p.tech].some((v) => v.toLowerCase().includes(q)),
    );
  }, [projects, query]);

  const selected = filtered.find((p) => p.slug === selectedSlug) ?? null;

  const select = (slug: string) => {
    if (slug !== selectedSlug) play("select");
    setSelectedSlug(slug);
    document.getElementById(`world-${slug}`)?.scrollIntoView({ block: "nearest" });
  };

  const enter = (p: Project | null) => {
    if (!p) return;
    navigate(`/projects/${p.slug}`, { kind: "world" });
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (!filtered.length) return;
    const i = filtered.findIndex((p) => p.slug === selectedSlug);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1);
      select(filtered[i === -1 ? 0 : next].slug);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      select(filtered[e.key === "Home" ? 0 : filtered.length - 1].slug);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enter(selected);
    }
  };

  return (
    <GameScreen
      title="Select World"
      footer={
        <>
          <ButtonRow>
            <GameButton size="mid" onClick={() => enter(selected)} sound={null} disabled={!selected}>
              Play Selected World
            </GameButton>
            <GameButton
              size="mid"
              href={selected?.liveUrl ?? ""}
              external
              disabled={!selected?.liveUrl}
              title={selected?.liveUrl ? undefined : "No live demo for this world"}
            >
              Open Live Demo
            </GameButton>
          </ButtonRow>
          <ButtonRow>
            <GameButton
              size="mid"
              href={selected?.sourceUrl ?? ""}
              external
              disabled={!selected?.sourceUrl}
              title={selected?.sourceUrl ? undefined : "No public source for this world"}
            >
              View Source
            </GameButton>
            <GameButton size="mid" href="/" transition="back">
              Back
            </GameButton>
          </ButtonRow>
        </>
      }
    >
      <div className="flex justify-center px-4 pb-2" data-enter>
        <label className="w-[min(calc(var(--gui)*200),100%)]">
          <span className="sr-only">Search worlds</span>
          <input
            type="search"
            className="mc-input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                listRef.current?.focus();
              }
            }}
          />
        </label>
      </div>

      <div className="mc-list mc-scroll min-h-0 flex-1 overflow-y-auto py-1" data-enter>
        {filtered.length === 0 ? (
          <p className="mc-title mc-muted pt-8">No worlds match &ldquo;{query}&rdquo;</p>
        ) : (
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Worlds"
            aria-activedescendant={selected ? `world-${selected.slug}` : undefined}
            tabIndex={0}
            onKeyDown={onListKey}
            className="mc-listbox mx-auto flex w-[min(calc(var(--gui)*270),calc(100%-var(--gui)*8))] flex-col gap-1 py-1"
          >
            {filtered.map((p) => (
              <WorldRow
                key={p.slug}
                project={p}
                selected={p.slug === selected?.slug}
                onSelect={() => {
                  select(p.slug);
                  listRef.current?.focus({ preventScroll: true });
                }}
                onEnter={() => enter(p)}
              />
            ))}
          </ul>
        )}
      </div>
    </GameScreen>
  );
}

function WorldRow({
  project: p,
  selected,
  onSelect,
  onEnter,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
  onEnter: () => void;
}) {
  const meta = [p.mode + " Mode", p.year, statusLabel[p.status]].filter(Boolean).join(", ");
  return (
    <li
      id={`world-${p.slug}`}
      role="option"
      aria-selected={selected}
      className="mc-entry group"
      onClick={onSelect}
      onDoubleClick={onEnter}
    >
      <div className="relative size-32 shrink-0 overflow-hidden bg-black">
        {p.cover ? (
          <Image src={p.cover.src} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <WorldIcon slug={p.slug} className="size-full" />
        )}
        {/* the game's play arrow when a world is selected or hovered */}
        <span
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
          className={`absolute inset-0 grid cursor-pointer place-items-center bg-[rgb(160_160_160/0.55)] ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          <svg viewBox="0 0 14 14" className="size-14" shapeRendering="crispEdges" aria-hidden>
            <path d="M3 1h2v1h2v1h2v1h2v1h2v2h-2v1h-2v1h-2v1h-2v1h-2v1h-2z" fill="#fff" />
          </svg>
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-1 text-shadow-mc">
        <p className="truncate">{p.title}</p>
        <p className="mc-muted truncate">{p.summary}</p>
        <p className="mc-muted truncate">{meta}</p>
      </div>
    </li>
  );
}

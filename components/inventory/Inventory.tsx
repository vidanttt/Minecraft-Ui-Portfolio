"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "@/lib/data/profile";
import type { Skill, SkillCategory, SkillCategoryId } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { GameButton } from "@/components/game/GameButton";
import { GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";
import { GameTooltip, useTooltip, type TooltipLine } from "@/components/game/GameTooltip";
import { PixelIcon } from "@/components/game/PixelIcon";
import { PlayerModel } from "@/components/game/PlayerModel";

const COLS = 9;
const MIN_ROWS = 3;

type Tab = "all" | SkillCategoryId;

function tooltipLines(skill: Skill, categories: SkillCategory[]): TooltipLine[] {
  const cat = categories.find((c) => c.id === skill.category);
  const lines: TooltipLine[] = [
    { text: skill.name, color: skill.equipped ? "#55ffff" : "#ffffff", shadow: skill.equipped ? "#153f3f" : "#3f3f3f" },
    { text: cat?.label ?? "", color: "#5555ff", shadow: "#15153f" },
    { text: skill.description, color: "#aaaaaa", shadow: "#2a2a2a" },
  ];
  if (skill.level) lines.push({ text: `Proficiency: ${skill.level}/5`, color: "#ffaa00", shadow: "#3f2a00" });
  if (skill.related?.length)
    lines.push({ text: `Pairs with: ${skill.related.join(", ")}`, color: "#8a8a8a", shadow: "#222222" });
  return lines;
}

export function Inventory({ skills, categories }: { skills: Skill[]; categories: SkillCategory[] }) {
  const { play, unlock } = useGame();
  const [tab, setTab] = useState<Tab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(skills[0]?.id ?? null);
  const { tip, bind, hide } = useTooltip();
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    unlock("inventory");
  }, [unlock]);

  const items = useMemo(() => (tab === "all" ? skills : skills.filter((s) => s.category === tab)), [skills, tab]);
  const equipped = skills.filter((s) => s.equipped).slice(0, 4);
  const rows = Math.max(MIN_ROWS, Math.ceil(items.length / COLS));
  const selected = skills.find((s) => s.id === selectedId) ?? null;
  const tabs: { id: Tab; label: string; icon: SkillCategory["icon"] }[] = [
    { id: "all", label: "All Items", icon: "chest" },
    ...categories.map((c) => ({ id: c.id as Tab, label: c.label, icon: c.icon })),
  ];

  const choose = (skill: Skill) => {
    if (skill.id !== selectedId) play("select");
    setSelectedId(skill.id);
  };

  const onGridKey = (e: React.KeyboardEvent) => {
    const total = items.length;
    if (!total) return;
    let next = focusIndex;
    if (e.key === "ArrowRight") next = Math.min(total - 1, focusIndex + 1);
    else if (e.key === "ArrowLeft") next = Math.max(0, focusIndex - 1);
    else if (e.key === "ArrowDown") next = Math.min(total - 1, focusIndex + COLS);
    else if (e.key === "ArrowUp") next = Math.max(0, focusIndex - COLS);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = total - 1;
    else return;
    e.preventDefault();
    setFocusIndex(next);
    gridRef.current?.querySelectorAll<HTMLButtonElement>("[data-slot]")[next]?.focus();
  };

  return (
    <GameScreen
      title="Inventory"
      subtitle="Skills & tools"
      footer={
        <GameButton size="mid" href="/" transition="back">
          Done
        </GameButton>
      }
      bodyClassName="overflow-y-auto mc-scroll"
    >
      <div className="flex flex-wrap items-start justify-center gap-4 px-4 pb-2">
        <div className="flex flex-col" data-enter>
          {/* creative-style category tabs */}
          <div role="tablist" aria-label="Item categories" className="flex gap-1 pl-1">
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls="inventory-grid"
                  title={t.label}
                  onClick={() => {
                    if (!active) play("click");
                    hide();
                    setTab(t.id);
                    setFocusIndex(0);
                  }}
                  {...bind([{ text: t.label }])}
                  className={cn(
                    "relative grid w-[calc(var(--gui)*26)] place-items-center bg-[#c6c6c6]",
                    active ? "z-10 -mb-1 h-[calc(var(--gui)*30)] pb-1" : "mt-1 h-[calc(var(--gui)*26)] bg-[#a5a5a5]",
                  )}
                  style={{
                    boxShadow: active
                      ? "0 calc(var(--gui) * -1) 0 #000, var(--gui) 0 0 #000, calc(var(--gui) * -1) 0 0 #000, inset var(--gui) var(--gui) 0 #fff"
                      : "0 calc(var(--gui) * -1) 0 #000, var(--gui) 0 0 #000, calc(var(--gui) * -1) 0 0 #000, inset calc(var(--gui) * -1) 0 0 #555",
                  }}
                >
                  <PixelIcon name={t.icon} className="size-16" />
                  <span className="sr-only">{t.label}</span>
                </button>
              );
            })}
          </div>

          <section className="mc-panel w-[calc(var(--gui)*176)] max-w-[calc(100vw-var(--gui)*8)] p-[calc(var(--gui)*3)]">
            {/* equipment + player preview */}
            <div className="mb-2 flex gap-1">
              <div className="flex flex-col" aria-label="Equipped" role="group">
                {Array.from({ length: 4 }, (_, i) => {
                  const s = equipped[i];
                  return s ? (
                    <button
                      key={s.id}
                      type="button"
                      className={cn("mc-slot", selectedId === s.id && "ring-[length:var(--gui)] ring-white ring-inset")}
                      aria-label={`${s.name} (equipped)`}
                      aria-pressed={selectedId === s.id}
                      onClick={() => choose(s)}
                      {...bind(tooltipLines(s, categories))}
                    >
                      <PixelIcon name={s.icon} />
                    </button>
                  ) : (
                    <div key={`e${i}`} className="mc-slot" aria-hidden />
                  );
                })}
              </div>
              <div className="relative grid h-[calc(var(--gui)*72)] flex-1 place-items-end justify-center overflow-hidden bg-black pb-1 shadow-[inset_var(--gui)_var(--gui)_0_#373737,inset_calc(var(--gui)*-1)_calc(var(--gui)*-1)_0_#fff]">
                <PlayerModel palette={profile.avatar} scale={2} />
              </div>
            </div>

            <p className="mc-label mb-1">{tabs.find((t) => t.id === tab)?.label}</p>
            <div
              id="inventory-grid"
              ref={gridRef}
              role="grid"
              aria-label="Items"
              aria-rowcount={rows}
              aria-colcount={COLS}
              onKeyDown={onGridKey}
              className="grid grid-cols-9"
            >
              {Array.from({ length: rows * COLS }, (_, i) => {
                const s = items[i];
                if (!s) return <div key={`empty-${i}`} className="mc-slot" role="gridcell" aria-label="Empty slot" />;
                const isSel = selectedId === s.id;
                return (
                  <div key={s.id} role="gridcell">
                    <button
                      type="button"
                      data-slot
                      tabIndex={i === focusIndex ? 0 : -1}
                      aria-label={s.name}
                      aria-pressed={isSel}
                      onClick={() => {
                        setFocusIndex(i);
                        choose(s);
                      }}
                      {...bind(tooltipLines(s, categories))}
                      className={cn(
                        "mc-slot group outline-none focus-visible:z-10 focus-visible:outline-[length:var(--gui)] focus-visible:outline-white focus-visible:outline-solid",
                        isSel && "ring-[length:var(--gui)] ring-white ring-inset",
                      )}
                    >
                      <PixelIcon name={s.icon} />
                      <span className="pointer-events-none absolute inset-[var(--gui)] bg-white/0 group-hover:bg-white/45" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* selected item details */}
        <aside
          className="mc-tooltip pointer-events-auto relative w-[min(calc(var(--gui)*176),calc(100vw-var(--gui)*8))] self-start sm:mt-[calc(var(--gui)*30)] sm:w-[calc(var(--gui)*150)]"
          aria-live="polite"
          aria-label="Selected item"
          data-enter
        >
          {selected ? (
            <div className="relative flex flex-col gap-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="mc-slot shrink-0">
                  <PixelIcon name={selected.icon} />
                </span>
                <h2 style={{ color: selected.equipped ? "#55ffff" : "#fff" }}>{selected.name}</h2>
              </div>
              {tooltipLines(selected, categories)
                .slice(1)
                .map((l, i) => (
                  <p key={i} style={{ color: l.color, ["--shadow" as string]: l.shadow }}>
                    {l.text}
                  </p>
                ))}
              {selected.equipped && (
                <p style={{ color: "#55ff55", ["--shadow" as string]: "#153f15" }}>Equipped: part of the main stack</p>
              )}
            </div>
          ) : (
            <p className="relative text-mc-gray">Select an item</p>
          )}
        </aside>
      </div>
      <GameTooltip state={tip} />
    </GameScreen>
  );
}

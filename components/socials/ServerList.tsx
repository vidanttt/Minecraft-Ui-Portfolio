"use client";

import { useEffect, useRef, useState } from "react";
import type { SocialLink } from "@/lib/types";
import { GameButton } from "@/components/game/GameButton";
import { ButtonRow, GameScreen } from "@/components/game/GameScreen";
import { useGame } from "@/components/game/GameProviders";
import { PixelIcon } from "@/components/game/PixelIcon";

/** Signal bars: green when a real link is configured, a red cross when not. */
function Signal({ online }: { online: boolean }) {
  if (!online) {
    return (
      <svg viewBox="0 0 10 8" className="h-8 w-10" shapeRendering="crispEdges" aria-hidden>
        <path d="M2 0h2v1h1v1h1V1h1V0h2v1H8v1H7v1H6v2h1v1h1v1h1v1H7V7H6V6H5v1H4v1H2V7h1V6h1V5h1V3H4V2H3V1H2z" fill="#ff5555" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 10 8" className="h-8 w-10" shapeRendering="crispEdges" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 2} y={6 - i * 1.5} width={1} height={2 + i * 1.5} fill="#55ff55" />
      ))}
    </svg>
  );
}

export function ServerList({ socials }: { socials: SocialLink[] }) {
  const { play, unlock } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(socials[0]?.id ?? null);
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = socials.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    unlock("multiplayer");
  }, [unlock]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const select = (id: string) => {
    if (id !== selectedId) play("select");
    setSelectedId(id);
    setCopied(null);
  };

  const join = (s: SocialLink | null) => {
    if (!s?.url) {
      play("error");
      return;
    }
    play("enter");
    window.open(s.url, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    if (!selected?.url) return;
    try {
      await navigator.clipboard.writeText(selected.url);
      setCopied("ok");
    } catch {
      setCopied("fail");
      play("error");
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    const i = socials.findIndex((s) => s.id === selectedId);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = e.key === "ArrowDown" ? Math.min(socials.length - 1, i + 1) : Math.max(0, i - 1);
      select(socials[i === -1 ? 0 : next].id);
    } else if (e.key === "Enter") {
      e.preventDefault();
      join(selected);
    }
  };

  const onlineCount = socials.filter((s) => s.url).length;

  return (
    <GameScreen
      title="Play Multiplayer"
      subtitle={`${onlineCount} of ${socials.length} servers reachable`}
      footer={
        <>
          <ButtonRow>
            <GameButton
              size="mid"
              onClick={() => join(selected)}
              sound={null}
              disabled={!selected?.url}
              title={selected?.url ? undefined : "This server has no address yet"}
            >
              Join Server
            </GameButton>
            <GameButton size="mid" onClick={copy} disabled={!selected?.url}>
              {copied === "ok" ? "Copied!" : copied === "fail" ? "Copy failed" : "Copy Address"}
            </GameButton>
          </ButtonRow>
          <ButtonRow>
            <GameButton size="mid" href="/contact">
              Direct Message
            </GameButton>
            <GameButton size="mid" href="/" transition="back">
              Back
            </GameButton>
          </ButtonRow>
        </>
      }
    >
      <div className="mc-list mc-scroll min-h-0 flex-1 overflow-y-auto py-2" data-enter>
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Servers"
          aria-activedescendant={selected ? `server-${selected.id}` : undefined}
          tabIndex={0}
          onKeyDown={onKey}
          className="mc-listbox mx-auto flex w-[min(calc(var(--gui)*305),calc(100%-var(--gui)*8))] flex-col gap-1"
        >
          {socials.map((s) => {
            const isSel = s.id === selectedId;
            return (
              <li
                key={s.id}
                id={`server-${s.id}`}
                role="option"
                aria-selected={isSel}
                className="mc-entry"
                onClick={() => {
                  select(s.id);
                  listRef.current?.focus({ preventScroll: true });
                }}
                onDoubleClick={() => join(s)}
              >
                <span className="grid size-32 shrink-0 place-items-center bg-black/40">
                  <PixelIcon name={s.icon} className="size-32" />
                </span>
                <span className="min-w-0 flex-1 pt-1 text-shadow-mc">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate">{s.platform}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="sr-only">{s.url ? "Reachable" : "Not configured"}</span>
                      <Signal online={Boolean(s.url)} />
                    </span>
                  </span>
                  {s.url ? (
                    <>
                      <span className="mc-muted block truncate">{s.username ?? s.url.replace(/^https?:\/\//, "")}</span>
                      <span className="mc-muted block truncate">{s.description}</span>
                    </>
                  ) : (
                    <>
                      <span className="block truncate text-mc-red" style={{ ["--shadow" as string]: "#3f1515" }}>
                        Can&apos;t connect to server
                      </span>
                      <span className="block truncate text-[#555]" style={{ ["--shadow" as string]: "#151515" }}>
                        Link not configured yet
                      </span>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </GameScreen>
  );
}

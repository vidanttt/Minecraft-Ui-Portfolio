"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { SoundName } from "@/lib/audio/game-audio";
import type { TransitionKind } from "@/lib/animation/transitions";
import { cn } from "@/lib/utils/cn";
import { useGame } from "@/components/game/GameProviders";

type Size = "wide" | "mid" | "half" | "icon" | "auto";

const SIZE_CLASS: Record<Size, string> = {
  wide: "mc-btn-wide",
  mid: "mc-btn-mid",
  half: "mc-btn-half",
  icon: "mc-btn-icon",
  auto: "",
};

interface BaseProps {
  children: React.ReactNode;
  size?: Size;
  className?: string;
  disabled?: boolean;
  /** Tooltip / accessible description for disabled or icon-only buttons. */
  title?: string;
  "aria-label"?: string;
  "aria-pressed"?: boolean;
  "aria-describedby"?: string;
}

interface ActionProps extends BaseProps {
  href?: undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  /** Associates a submit button with a form elsewhere in the screen. */
  form?: string;
  /** Sound on press; null for silent. Defaults to "click". */
  sound?: SoundName | null;
}

interface LinkProps extends BaseProps {
  href: string;
  /** Internal links run through the loading-screen transition. */
  transition?: TransitionKind;
  sound?: SoundName | null;
  external?: boolean;
  prefetch?: boolean;
  onNavigate?: () => void;
}

export type GameButtonProps = ActionProps | LinkProps;

function useHoverSound(disabled?: boolean) {
  const { play } = useGame();
  return (e: React.PointerEvent) => {
    if (!disabled && e.pointerType === "mouse") play("hover");
  };
}

/** The one Minecraft-style button used everywhere. Links for navigation, buttons for actions. */
export const GameButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, GameButtonProps>(
  function GameButton(props, ref) {
    const { navigate, play } = useGame();
    const onPointerEnter = useHoverSound(props.disabled);
    const size = props.size ?? "wide";
    const className = cn("mc-btn", SIZE_CLASS[size], props.className);
    const content = <span className="mc-btn-label">{props.children}</span>;

    if (props.href !== undefined && !props.disabled) {
      const { href, transition = "menu", sound, external, prefetch, onNavigate } = props;
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
            title={props.title}
            aria-label={props["aria-label"]}
            onPointerEnter={onPointerEnter}
            onClick={() => {
              if (sound !== null) play(sound ?? "click");
              onNavigate?.();
            }}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          prefetch={prefetch}
          className={className}
          title={props.title}
          aria-label={props["aria-label"]}
          onPointerEnter={onPointerEnter}
          onClick={(e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            onNavigate?.();
            navigate(href, { kind: transition, sound });
          }}
        >
          {content}
        </Link>
      );
    }

    const action = props as ActionProps;
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={action.type ?? "button"}
        form={action.form}
        className={className}
        disabled={props.disabled}
        title={props.title}
        aria-label={props["aria-label"]}
        aria-pressed={props["aria-pressed"]}
        aria-describedby={props["aria-describedby"]}
        onPointerEnter={onPointerEnter}
        onClick={(e) => {
          if (action.sound !== null && action.href === undefined) play(action.sound ?? "click");
          action.onClick?.(e);
        }}
      >
        {content}
      </button>
    );
  },
);

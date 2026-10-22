import { cn } from "@/lib/utils/cn";

interface PixelProgressBarProps {
  /** 0..1 for real, measurable work. Omit for an indeterminate sweep. */
  value?: number;
  label: string;
  className?: string;
}

export function PixelProgressBar({ value, label, className }: PixelProgressBarProps) {
  const indeterminate = value === undefined;
  return (
    <div
      className={cn("mc-progress", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : Math.round(value * 100)}
      data-indeterminate={indeterminate ? "true" : undefined}
    >
      <div
        className="mc-progress-fill"
        style={
          indeterminate
            ? undefined
            : { transform: `scaleX(${Math.min(1, Math.max(0, value))})`, transition: "transform 160ms linear" }
        }
      />
    </div>
  );
}

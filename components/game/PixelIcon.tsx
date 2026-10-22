import { pixelIcons } from "@/lib/icons/pixel-icons";
import type { PixelIconName } from "@/lib/types";

interface PixelIconProps {
  name: PixelIconName;
  className?: string;
  /** Accessible label; omit for decorative icons. */
  label?: string;
}

/** Crisp 16x16 pixel icon rendered as merged SVG runs. */
export function PixelIcon({ name, className, label }: PixelIconProps) {
  const icon = pixelIcons[name];
  const rects: React.ReactElement[] = [];
  icon.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = icon.palette[ch];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      x = end;
    }
  });
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {rects}
    </svg>
  );
}

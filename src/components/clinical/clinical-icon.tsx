import type { CSSProperties } from "react";

export interface ClinicalIconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ClinicalIcon({
  name,
  size = 24,
  fill = false,
  className = "",
  style,
}: ClinicalIconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none inline-flex items-center justify-center shrink-0 leading-none ${className}`}
      style={{
        fontSize: size ? `${size}px` : undefined,
        fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0",
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

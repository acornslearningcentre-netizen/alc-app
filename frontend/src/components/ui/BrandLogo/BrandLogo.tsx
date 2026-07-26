import type { CSSProperties } from 'react';

/**
 * Acorns brand lockup. Use on sidebars, auth screens, and marketing surfaces.
 * Preserves the logo's native 573:174 aspect ratio and scales by height.
 *
 * The source PNG is near-white on transparent — `tone="dark"` (default) uses a
 * CSS filter to render it as ink-dark for use on cream/light surfaces.
 * Use `tone="light"` on dark backgrounds (e.g. ink or photographic surfaces).
 */
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type BrandLogoTone = 'dark' | 'light';

const HEIGHTS: Record<BrandLogoSize, number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 72,
};

// brightness(0) collapses all channels to 0 → pure black; invert(14%) lifts to ink tone.
const DARK_FILTER = 'brightness(0) saturate(100%) invert(9%) sepia(5%) saturate(880%) hue-rotate(70deg)';

export interface BrandLogoProps {
  size?: BrandLogoSize;
  tone?: BrandLogoTone;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function BrandLogo({
  size = 'md',
  tone = 'dark',
  className,
  style,
  title = 'Acorns Learning Centre',
}: BrandLogoProps) {
  const height = HEIGHTS[size];
  return (
    <img
      src="/acorns-logo.png"
      alt={title}
      height={height}
      style={{
        height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        filter: tone === 'dark' ? DARK_FILTER : undefined,
        ...style,
      }}
      className={className}
      draggable={false}
    />
  );
}

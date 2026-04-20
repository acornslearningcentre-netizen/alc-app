import React from 'react';

interface SparklineProps {
  /** Data values to chart */
  values: number[];
  /** Stroke colour */
  color?: string;
  /** Fill area under the line */
  fill?: boolean;
  /** SVG height in px (default 32) */
  height?: number;
  className?: string;
}

/**
 * Minimal inline sparkline SVG. Scales to container width.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  values, color = 'currentColor', fill = false, height: hProp, className,
}) => {
  const w = 80, h = hProp ?? 32, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max - min) || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as [number, number];
  });
  const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = d + ` L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <svg className={`spark${className ? ` ${className}` : ''}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: hProp ? hProp : undefined }}>
      {fill && <path d={area} fill={color} opacity="0.15"/>}
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export default Sparkline;

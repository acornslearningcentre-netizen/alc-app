import React from 'react';

/** All icon names available in the Acorns design system */
export type IconName =
  | 'home' | 'users' | 'mic' | 'sparkle' | 'chart' | 'book' | 'message'
  | 'settings' | 'search' | 'bell' | 'plus' | 'arrow-right' | 'arrow-up'
  | 'arrow-down' | 'arrow-flat' | 'camera' | 'image' | 'tag' | 'heart'
  | 'flag' | 'star' | 'leaf' | 'check' | 'play' | 'pause' | 'clock'
  | 'send' | 'shield' | 'sun' | 'calendar';

export interface IconProps {
  /** Icon name from the Acorns icon set */
  name: IconName;
  /** Size in px, defaults to 18 */
  size?: number;
  /** Stroke colour, defaults to currentColor */
  stroke?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Hand-crafted stroke icon set for the Acorns App.
 * All icons are 24×24 SVG paths, scaled via the size prop.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 18, stroke = 'currentColor', className, style }) => {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, className, style,
  };
  switch (name) {
    case 'home': return <svg {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/></svg>;
    case 'users': return <svg {...p}><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.2"/><path d="M21 19c0-2.5-1.8-4.5-4-5"/></svg>;
    case 'mic': return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>;
    case 'sparkle': return <svg {...p}><path d="M12 3l1.8 4.8L18 9.5l-4.2 1.7L12 16l-1.8-4.8L6 9.5l4.2-1.7L12 3z"/><path d="M19 16l.7 1.8L21 18.5l-1.3.7L19 21l-.7-1.8L17 18.5l1.3-.7L19 16z"/></svg>;
    case 'chart': return <svg {...p}><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>;
    case 'book': return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13"/></svg>;
    case 'message': return <svg {...p}><path d="M4 5h16v11H8l-4 4V5z"/></svg>;
    case 'settings': return <svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>;
    case 'bell': return <svg {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0"/></svg>;
    case 'plus': return <svg {...p}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-right': return <svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-up': return <svg {...p}><path d="M7 14l5-5 5 5"/></svg>;
    case 'arrow-down': return <svg {...p}><path d="M7 10l5 5 5-5"/></svg>;
    case 'arrow-flat': return <svg {...p}><path d="M5 12h14"/></svg>;
    case 'camera': return <svg {...p}><path d="M4 7h4l2-2h4l2 2h4v12H4V7z"/><circle cx="12" cy="13" r="3.5"/></svg>;
    case 'image': return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>;
    case 'tag': return <svg {...p}><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="8" cy="8" r="1.5"/></svg>;
    case 'heart': return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>;
    case 'flag': return <svg {...p}><path d="M5 21V4h13l-3 4 3 4H5"/></svg>;
    case 'star': return <svg {...p}><path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14l-5-4.5 6.5-.5L12 3z"/></svg>;
    case 'leaf': return <svg {...p}><path d="M4 20c0-8 6-14 16-14 0 10-6 16-14 16-2 0-2-2-2-2z"/><path d="M4 20c4-4 8-6 14-8"/></svg>;
    case 'check': return <svg {...p}><path d="M5 13l4 4 10-10"/></svg>;
    case 'play': return <svg {...p}><path d="M7 5v14l12-7L7 5z"/></svg>;
    case 'pause': return <svg {...p}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'send': return <svg {...p}><path d="M4 12l16-8-6 18-3-7-7-3z"/></svg>;
    case 'shield': return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>;
    case 'sun': return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4 12H1M23 12h-3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>;
    case 'calendar': return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="4"/></svg>;
  }
};

export default Icon;

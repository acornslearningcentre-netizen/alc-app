import React from 'react';
import { Icon } from '../Icon/Icon';
import type { TrendDir } from '../../../data/types';

interface TrendProps {
  /** Direction of the trend arrow */
  dir: TrendDir;
  className?: string;
}

/**
 * Inline trend indicator with directional arrow and colour coding.
 */
export const Trend: React.FC<TrendProps> = ({ dir, className }) => {
  const color = dir === 'up' ? 'var(--sage-ink)' : dir === 'down' ? 'var(--danger)' : 'var(--ink-3)';
  const icon = dir === 'up' ? 'arrow-up' : dir === 'down' ? 'arrow-down' : 'arrow-flat';
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontWeight: 700, fontSize: 12 }}
    >
      <Icon name={icon} size={12}/>
    </span>
  );
};

export default Trend;

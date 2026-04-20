import React from 'react';
import { Icon } from '../Icon/Icon';

interface AIBadgeProps {
  label?: string;
  className?: string;
}

/**
 * Small pill badge indicating AI-generated content.
 */
export const AIBadge: React.FC<AIBadgeProps> = ({ label = 'AI', className }) => (
  <span className={`ai-badge${className ? ` ${className}` : ''}`}>
    <Icon name="sparkle" size={11}/> {label}
  </span>
);

export default AIBadge;

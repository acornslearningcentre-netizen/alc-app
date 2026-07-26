import type { CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';

/**
 * Explicit sign-out action. Renders as a full-width pill button by default
 * so it reads clearly in any sidebar. Pass `variant="compact"` for a smaller
 * inline version (e.g. inside an existing user pill).
 */
export type SignOutVariant = 'primary' | 'subtle' | 'compact';

export interface SignOutButtonProps {
  onClick: () => void;
  label?: string;
  variant?: SignOutVariant;
  className?: string;
  style?: CSSProperties;
}

export function SignOutButton({
  onClick,
  label = 'Sign out',
  variant = 'subtle',
  className,
  style,
}: SignOutButtonProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        title={label}
        aria-label={label}
        className={className}
        style={{
          padding: 6,
          borderRadius: 8,
          color: 'var(--ink-3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          ...style,
        }}
      >
        <Icon name="arrow-right" size={14} />
      </button>
    );
  }

  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        padding: '10px 14px',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13.5,
        border: isPrimary ? '1px solid var(--ink)' : '1px solid var(--line-2)',
        background: isPrimary ? 'var(--ink)' : 'var(--paper)',
        color: isPrimary ? 'var(--cream)' : 'var(--ink)',
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!isPrimary) (e.currentTarget as HTMLButtonElement).style.background = 'var(--cream-2)';
      }}
      onMouseLeave={(e) => {
        if (!isPrimary) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)';
      }}
    >
      <Icon name="arrow-right" size={15} />
      <span>{label}</span>
    </button>
  );
}

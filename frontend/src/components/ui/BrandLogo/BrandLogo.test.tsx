import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('renders an image with the default alt text', () => {
    render(<BrandLogo />);
    expect(screen.getByAltText('Acorns Learning Centre')).toBeInTheDocument();
  });

  it('accepts a custom title as alt text', () => {
    render(<BrandLogo title="Acorns Reviewer Guide" />);
    expect(screen.getByAltText('Acorns Reviewer Guide')).toBeInTheDocument();
  });

  it('sizes the logo by height per the size prop', () => {
    render(<BrandLogo size="xl" />);
    const img = screen.getByAltText('Acorns Learning Centre');
    expect(img).toHaveAttribute('height', '72');
  });

  it('applies the dark-tone filter by default, none for light tone', () => {
    const { rerender } = render(<BrandLogo />);
    const img = screen.getByAltText('Acorns Learning Centre');
    expect(img.style.filter).not.toBe('');

    rerender(<BrandLogo tone="light" />);
    expect(img.style.filter).toBe('');
  });
});

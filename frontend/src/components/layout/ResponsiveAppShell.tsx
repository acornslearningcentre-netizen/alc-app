import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrandLogo } from '../ui';

interface ResponsiveAppShellProps {
  /** The full sidebar content (brand logo, nav, role pill, sign out) */
  sidebar: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Avatar/initials node shown in the mobile top bar right slot */
  userBadge?: React.ReactNode;
}

/**
 * Responsive app shell.
 *
 * Desktop (>960px): 220px sidebar + main content in a CSS grid (handled by .app class).
 * Tablet/Mobile (≤960px): sticky top bar with hamburger + brand + user badge.
 *   The sidebar renders as a slide-in drawer from the left.
 *   A dimmed scrim closes the drawer on tap. ESC also closes it.
 */
export const ResponsiveAppShell: React.FC<ResponsiveAppShellProps> = ({
  sidebar,
  children,
  userBadge,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Body scroll lock
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => document.body.classList.remove('drawer-open');
  }, [drawerOpen]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) {
        closeDrawer();
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  // Focus trap: when drawer opens, focus first focusable child inside it
  useEffect(() => {
    if (drawerOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
  }, [drawerOpen]);

  return (
    <>
      {/* Desktop layout — .app grid applies on >960px via CSS */}
      <div className="app">
        {/* Desktop sidebar — hidden on mobile via CSS */}
        <aside className="sidebar" aria-label="Primary navigation">
          {sidebar}
        </aside>

        {/* Mobile: single column — top bar + main stacked */}
        <div style={{ display: 'contents' }}>
          {/* Mobile top bar */}
          <header className="mobile-topbar" aria-label="Mobile navigation">
            <button
              ref={hamburgerRef}
              className="mobile-topbar-hamburger"
              onClick={openDrawer}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="2" y="4.5" width="16" height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/>
                <rect x="2" y="13.5" width="16" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>

            <BrandLogo size="sm" />

            <div className="mobile-topbar-right" aria-hidden="true">
              {userBadge}
            </div>
          </header>

          {/* Main content */}
          <main className="main" id="main-content">
            {children}
          </main>
        </div>
      </div>

      {/* Drawer scrim (mobile only) */}
      <button
        className={`drawer-scrim${drawerOpen ? ' open' : ''}`}
        onClick={closeDrawer}
        aria-label="Close navigation menu"
        tabIndex={drawerOpen ? 0 : -1}
      />

      {/* Slide-in drawer */}
      <nav
        id="mobile-drawer"
        ref={drawerRef}
        className={`drawer${drawerOpen ? ' open' : ''}`}
        aria-label="Primary navigation drawer"
        aria-hidden={!drawerOpen}
      >
        {/* Wrap sidebar children; nav item clicks close drawer */}
        <DrawerContent onClose={closeDrawer}>
          {sidebar}
        </DrawerContent>
      </nav>
    </>
  );
};

/**
 * Intercepts clicks on nav buttons inside the drawer so any nav-item tap
 * automatically closes the drawer. Uses event delegation — no need to thread
 * a callback through every layout's nav item.
 */
const DrawerContent: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
  children,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const navItem = target.closest('.nav-item');
      if (navItem) {
        // Let the click propagate first so the nav state updates, then close
        setTimeout(onClose, 50);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [onClose]);

  return <div ref={ref} style={{ display: 'contents' }}>{children}</div>;
};

export default ResponsiveAppShell;

// Build-time feature flags. Values are read from Vite's `import.meta.env` so
// they are inlined at `vite build` time — change the value on Railway and run
// `railway up --service alc-app -c` to redeploy with the new flags.
//
// All flags default to a sensible production value (v1 hidden, demo controls
// off) so an unset env var doesn't accidentally expose dev surfaces.

const truthy = (v: unknown): boolean =>
  /^(1|true|yes|on)$/i.test(String(v ?? '').trim());

export const featureFlags = {
  /** When true, exposes the legacy v1 surface alongside v2:
   *    - the floating variant-switch pill is rendered
   *    - the path-based v1/v2 toggle (`/` vs `/v2`) is honoured
   *  When false (the default), the app is v2-only:
   *    - `body.v2` is forced on for every page
   *    - the variant pill is hidden
   *    - new feature work skips v1 entirely (project memory feedback_v2_only)
   *  Set on Railway: `VITE_SHOW_V1=true` to re-enable for designer reviews. */
  showV1: truthy(import.meta.env.VITE_SHOW_V1),
};

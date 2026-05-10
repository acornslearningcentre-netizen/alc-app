/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build-time flag (see src/lib/feature-flags.ts). When 'true', the legacy
   *  v1 surface and the variant-switch pill are reachable; otherwise the app
   *  is v2-only. */
  readonly VITE_SHOW_V1?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_ENABLE_MOCKS?: string;

  readonly VITE_AUTH_PROVIDER?: string;
  readonly VITE_AUTH_DOMAIN?: string;
  readonly VITE_AUTH_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DECRYPT_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
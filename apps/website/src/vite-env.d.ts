/// <reference types="vite/client" />

// oxlint-disable-next-line consistent-type-definitions -- vite/client déclare ImportMetaEnv en interface, seule une interface fusionne avec elle
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
}

// oxlint-disable-next-line consistent-type-definitions -- même fusion de déclaration, imposée par vite/client
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.po' {
  import type { Messages } from '@lingui/core'

  export const messages: Messages
}

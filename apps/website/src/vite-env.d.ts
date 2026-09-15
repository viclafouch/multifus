/// <reference types="vite/client" />

// oxlint-disable-next-line consistent-type-definitions -- vite/client declares ImportMetaEnv as an interface, only an interface merges with it
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
}

// oxlint-disable-next-line consistent-type-definitions -- same declaration merging, imposed by vite/client
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __RELEASE_LINKS__: import('@/helpers/release').ReleaseLinks | null

declare module '*.po' {
  import type { Messages } from '@lingui/core'

  export const messages: Messages
}

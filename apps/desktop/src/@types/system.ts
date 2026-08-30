export type KeyLabels = Readonly<Record<string, string | undefined>>

export type Authorization = {
  readonly granted: boolean
  readonly listening: boolean
}

export type ConfigProblem =
  | {
      readonly kind: 'malformed'
      readonly detail: string
      readonly quarantined: string | null
    }
  | { readonly kind: 'notSaved'; readonly detail: string }
  | { readonly kind: 'notSetAside'; readonly detail: string }
  | { readonly kind: 'unreadable'; readonly detail: string }

export type ConfigStatus = {
  readonly path: string
  readonly problem: ConfigProblem | null
}

export type UpdateStatus =
  | { readonly kind: 'available'; readonly version: string }
  | { readonly kind: 'checking' }
  | { readonly kind: 'failed'; readonly detail: string }
  | { readonly kind: 'installing' }
  | { readonly kind: 'upToDate' }

export type ScreenSaver =
  | { readonly kind: 'after'; readonly seconds: number }
  | { readonly kind: 'never' }
  | { readonly kind: 'unknown' }

export type Launch = 'byHand' | 'session'

export type Surface = 'shortcut' | 'tray' | 'window'

export type Work =
  | 'banner'
  | 'runeTable'
  | 'scan'
  | 'shortcuts'
  | 'tray'
  | 'walk'
  | 'wheel'

/** What multifus knows about the machine it runs on, and about itself. */

export type Authorization = {
  /** Accessibility on macOS, notification access on Windows. */
  readonly granted: boolean
  /** The notification listening is running right now. */
  readonly listening: boolean
}

/**
 * Why the configuration on screen is not the one on disk. `notSetAside` is the
 * only one where doing nothing loses something: the file is still in place.
 */
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

/**
 * What multifus knows about the version that is published. No idle state: the
 * check starts with the process, so the first snapshot is already `checking`.
 */
export type UpdateStatus =
  | { readonly kind: 'available'; readonly version: string }
  | { readonly kind: 'checking' }
  | { readonly kind: 'failed'; readonly detail: string }
  | { readonly kind: 'installing' }
  | { readonly kind: 'upToDate' }

/**
 * What the screen saver of this machine is set to. Read once at startup and not
 * at each activation, see `docs/macos.md`.
 */
export type ScreenSaver =
  | { readonly kind: 'after'; readonly seconds: number }
  | { readonly kind: 'never' }
  | { readonly kind: 'unknown' }

/** How multifus was started. A session start does not show the window. */
export type Launch = 'byHand' | 'session'

/** Which of the two surfaces the user acted on. */
export type Surface = 'tray' | 'window'

/**
 * One of the three things multifus does on a thread of its own, and what
 * `panicked` names. Each of them going quiet used to look like a quiet user.
 */
export type Work = 'scan' | 'shortcuts' | 'tray'

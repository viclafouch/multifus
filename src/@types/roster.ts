/** The roster as it crosses the bridge. The vocabulary is in CONTEXT.md. */

/** Assigned by hand, kept indefinitely. */
export type Gender = 'female' | 'male'

/** One line of the roster. */
export type Character = {
  readonly nickname: string
  /** `null` until the user assigns one. */
  readonly gender: Gender | null
  /** Out of the cycle. AutoFocus still applies. */
  readonly asleep: boolean
  /** A window bears this nickname right now. */
  readonly online: boolean
  /** The relay carries this character's private messages. Unrelated to the
   * veille, which only takes a character out of the cycle. See ADR 0011. */
  readonly relayed: boolean
}

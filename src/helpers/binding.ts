/** What a combination fires, compared. The words it is worth are in `wording.ts`. */

import type { Binding } from '@/@types/shortcuts'

/**
 * Whether two bindings name the same thing, the family included. One capture at
 * a time for the whole screen hangs on this, whichever family is capturing.
 */
export const matchIsSameBinding = (binding: Binding | null, other: Binding) => {
  if (binding === null) {
    return false
  }

  if (binding.kind === 'action' && other.kind === 'action') {
    return binding.action === other.action
  }

  if (binding.kind === 'quickReply' && other.kind === 'quickReply') {
    return binding.id === other.id
  }

  return false
}

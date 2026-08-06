/**
 * Each union of the domain, and the French phrase it is worth. Five more of them
 * still sit in the screens, see le lot C de l'étape 12.
 */

import type { UpdateStatus } from '@/@types/system'
import { strings } from '@/constants/strings'

/**
 * Where the update got to. A sentence and not a badge: every other state of this
 * window is said in French.
 */
export const updateLine = (update: UpdateStatus) => {
  switch (update.kind) {
    case 'checking': {
      return strings.about.updateChecking
    }
    case 'upToDate': {
      return strings.about.updateUpToDate
    }
    case 'available': {
      return strings.about.updateAvailable(update.version)
    }
    case 'installing': {
      return strings.about.updateInstalling
    }
    case 'failed': {
      return strings.about.updateFailed(update.detail)
    }
    default: {
      return ''
    }
  }
}

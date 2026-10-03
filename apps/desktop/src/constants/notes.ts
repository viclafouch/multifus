import { msg } from '@lingui/core/macro'
import { IS_APPLE } from '@/constants/keyboard'

export const NOTES_NAME = msg({
  message: 'Notes',
  comment:
    'Name of the notepad Multifus lays over the game: Notes in English, Notas in Spanish'
})

export const BOLD_KEYS = IS_APPLE ? 'Super+KeyB' : 'Control+KeyB'

import type { Character } from '@/@types/roster'
import { CLASS_PORTRAITS } from '@/constants/classes'

type PortraitOf = Pick<Character, 'class' | 'gender'>

export const portraitFor = ({ class: characterClass, gender }: PortraitOf) => {
  if (characterClass === null || gender === null) {
    return null
  }

  return CLASS_PORTRAITS[characterClass][gender]
}

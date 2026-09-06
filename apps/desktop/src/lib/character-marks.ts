import type { Class, Color, Gender, Portrait } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { setClass, setColor, setGender } from '@/lib/multifus'

type CharacterMarksParams = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const characterMarks = ({ run }: CharacterMarksParams) => {
  return {
    handleSetGender: (nickname: string, gender: Gender | null) => {
      run(setGender(nickname, gender))
    },
    handleSetClass: (nickname: string, characterClass: Class | null) => {
      run(setClass(nickname, characterClass))
    },
    handleSetColor: (nickname: string, color: Color | null) => {
      run(setColor(nickname, color))
    },
    handleSetPortrait: (nickname: string, portrait: Portrait) => {
      run(
        setClass(nickname, portrait.class).then(() => {
          return setGender(nickname, portrait.gender)
        })
      )
    }
  }
}

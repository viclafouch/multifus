import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { Binding } from '@/@types/shortcuts'
import { CharacterLine } from '@/components/character-line'
import { MainStar } from '@/components/main-star'
import { ShortcutField } from '@/components/shortcut-field'
import { matchIsSameBinding } from '@/helpers/binding'
import type { TonedLine } from '@/helpers/wording'

export type CharacterShortcutActions = Readonly<{
  handleShortcut: (nickname: string, accelerator: string | null) => void
  handleOpen: (nickname: string) => void
  handleClose: () => void
}>

type CharacterShortcutRowProps = Readonly<{
  character: Character
  statusLine: TonedLine | null
  editing: Binding | null
  actions: CharacterShortcutActions
}>

export const CharacterShortcutRow = ({
  character,
  statusLine,
  editing,
  actions
}: CharacterShortcutRowProps) => {
  const { nickname } = character

  return (
    <CharacterLine
      character={character}
      mark={character.main ? <MainStar isMain /> : null}
    >
      <ShortcutField
        accelerator={character.shortcut}
        statusLine={statusLine}
        editLabel={t`Modifier le raccourci de ${nickname}`}
        undo={null}
        editing={{
          isActive: matchIsSameBinding(editing, {
            kind: 'character',
            nickname
          }),
          handleOpen: () => {
            actions.handleOpen(nickname)
          },
          handleClose: actions.handleClose,
          handleCapture: (accelerator) => {
            actions.handleShortcut(nickname, accelerator)
          }
        }}
      />
    </CharacterLine>
  )
}

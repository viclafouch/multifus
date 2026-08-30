import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { IS_APPLE } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import { useShortcutEditing } from '@/hooks/use-shortcut-editing'
import { useShortcutUndo } from '@/hooks/use-shortcut-undo'
import {
  resetShortcuts,
  setCharacterShortcut,
  setShortcut
} from '@/lib/multifus'
import { ActionsPanel } from '@/screens/shortcuts/actions-panel'
import { CharactersPanel } from '@/screens/shortcuts/characters-panel'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  characters: readonly Character[]
  quickReplies: readonly QuickReply[]
  run: (action: Promise<Snapshot>) => void
}>

export const ShortcutsScreen = ({
  shortcuts,
  characters,
  quickReplies,
  run
}: ShortcutsScreenProps) => {
  const editing = useShortcutEditing()

  const undo = useShortcutUndo((action, accelerator) => {
    run(setShortcut(action, accelerator))
  })

  return (
    <Screen
      title={strings.shortcuts.title}
      subtitle={strings.shortcuts.subtitle}
    >
      <ActionsPanel
        shortcuts={shortcuts}
        quickReplies={quickReplies}
        editing={editing.binding}
        undoFor={undo.undoFor}
        actions={{
          handleCapture: (shortcut, accelerator) => {
            editing.close()
            undo.remember([shortcut])
            run(setShortcut(shortcut.action, accelerator))
          },
          handleDefaults: () => {
            undo.forgetAll()
            run(resetShortcuts())
          },
          handleOpen: (action) => {
            editing.open({ kind: 'action', action })
          },
          handleClose: editing.close
        }}
      />
      <CharactersPanel
        characters={characters}
        quickReplies={quickReplies}
        editing={editing.binding}
        actions={{
          handleShortcut: (nickname, accelerator) => {
            editing.close()
            run(setCharacterShortcut(nickname, accelerator))
          },
          handleOpen: (nickname) => {
            editing.open({ kind: 'character', nickname })
          },
          handleClose: editing.close
        }}
      />
      <Note className="mt-4">{strings.shortcuts.silent}</Note>
      {IS_APPLE ? null : <Note className="mt-2">{strings.shortcuts.lone}</Note>}
    </Screen>
  )
}

import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import type { QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { IS_APPLE } from '@/constants/keyboard'
import { MAP_NAMES } from '@/constants/world'
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
      title={i18n._(MAP_NAMES.shortcuts)}
      subtitle={t`Changez de personnage sans lâcher la souris. Ces touches ne marchent que dans le jeu.`}
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
      <div className="flex flex-col gap-2">
        <Note>{t`Un autre logiciel peut déjà prendre ces touches. Multifus les accepte, mais rien ne bougera dans le jeu : essayez, et regardez le journal en bas.`}</Note>
        {IS_APPLE ? null : (
          <Note>{t`Une touche de fonction se pose seule. Prise ici, elle ne redescend plus dans le jeu.`}</Note>
        )}
      </div>
    </Screen>
  )
}

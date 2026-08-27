import React from 'react'
import type { Character } from '@/@types/roster'
import type { Binding, QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { strings } from '@/constants/strings'
import { mainShortcutHint } from '@/helpers/wording'
import { useShortcutUndo } from '@/hooks/use-shortcut-undo'
import {
  addQuickReply,
  removeQuickReply,
  resetShortcuts,
  setQuickReplyShortcut,
  setQuickReplyText,
  setShortcut
} from '@/lib/multifus'
import { ActionsPanel } from '@/screens/shortcuts/actions-panel'
import { QuickRepliesPanel } from '@/screens/shortcuts/quick-replies-panel'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  quickReplies: readonly QuickReply[]
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

export const ShortcutsScreen = ({
  shortcuts,
  quickReplies,
  characters,
  run
}: ShortcutsScreenProps) => {
  const [editing, setEditing] = React.useState<Binding | null>(null)

  const undo = useShortcutUndo((action, accelerator) => {
    run(setShortcut(action, accelerator))
  })

  const handleClose = () => {
    setEditing(null)
  }

  return (
    <Screen
      title={strings.shortcuts.title}
      subtitle={strings.shortcuts.subtitle}
    >
      <ActionsPanel
        shortcuts={shortcuts}
        quickReplies={quickReplies}
        mainHint={mainShortcutHint(characters)}
        editing={editing}
        undoFor={undo.undoFor}
        actions={{
          handleCapture: (shortcut, accelerator) => {
            setEditing(null)
            undo.remember([shortcut])
            run(setShortcut(shortcut.action, accelerator))
          },
          handleDefaults: () => {
            undo.forgetAll()
            run(resetShortcuts())
          },
          handleOpen: (action) => {
            setEditing({ kind: 'action', action })
          },
          handleClose
        }}
      />
      <Note className="mt-4">{strings.shortcuts.silent}</Note>
      <QuickRepliesPanel
        quickReplies={quickReplies}
        editing={editing}
        handleAdd={() => {
          run(addQuickReply())
        }}
        actions={{
          handleText: (id, text) => {
            run(setQuickReplyText(id, text))
          },
          handleShortcut: (id, accelerator) => {
            setEditing(null)
            run(setQuickReplyShortcut(id, accelerator))
          },
          handleRemove: (id) => {
            run(removeQuickReply(id))
          },
          handleOpen: (id) => {
            setEditing({ kind: 'quickReply', id })
          },
          handleClose
        }}
      />
    </Screen>
  )
}

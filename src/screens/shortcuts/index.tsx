import React from 'react'
import type { Binding, QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { Note } from '@/components/layout/note'
import { Screen } from '@/components/layout/screen'
import { strings } from '@/constants/strings'
import { useShortcutUndo } from '@/hooks/use-shortcut-undo'
import { resetShortcuts, setShortcut } from '@/lib/multifus'
import { ActionsPanel } from '@/screens/shortcuts/actions-panel'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  quickReplies: readonly QuickReply[]
  run: (action: Promise<Snapshot>) => void
}>

export const ShortcutsScreen = ({
  shortcuts,
  quickReplies,
  run
}: ShortcutsScreenProps) => {
  const [editing, setEditing] = React.useState<Binding | null>(null)

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
          handleClose: () => {
            setEditing(null)
          }
        }}
      />
      <Note className="mt-4">{strings.shortcuts.silent}</Note>
    </Screen>
  )
}

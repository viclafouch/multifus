import React from 'react'
import type { ShortcutAction, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { strings } from '@/constants/strings'
import { setShortcut } from '@/lib/multifus'
import { ShortcutField } from '@/screens/shortcuts/shortcut-field'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The four combinations of perimetre.md. This screen captures, then reports what
 * the Rust side got back from the system, action by action, and never guesses.
 */
export const ShortcutsScreen = ({ shortcuts, run }: ShortcutsScreenProps) => {
  const [editing, setEditing] = React.useState<ShortcutAction | null>(null)

  return (
    <Screen
      title={strings.shortcuts.title}
      subtitle={strings.shortcuts.subtitle}
    >
      <Panel>
        {shortcuts.map((shortcut) => {
          const { label, description } =
            strings.shortcuts.actions[shortcut.action]

          return (
            <FieldRow
              key={shortcut.action}
              label={label}
              description={description}
            >
              <ShortcutField
                shortcut={shortcut}
                editing={{
                  isActive: editing === shortcut.action,
                  handleOpen: () => {
                    setEditing(shortcut.action)
                  },
                  handleClose: () => {
                    setEditing(null)
                  },
                  handleCapture: (accelerator) => {
                    setEditing(null)
                    run(setShortcut(shortcut.action, accelerator))
                  }
                }}
              />
            </FieldRow>
          )
        })}
      </Panel>
      <Note>{strings.shortcuts.silent}</Note>
    </Screen>
  )
}

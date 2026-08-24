import React from 'react'
import type { Binding, QuickReply, ShortcutBinding } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { strings } from '@/constants/strings'
import { matchIsSameBinding } from '@/helpers/binding'
import { shortcutStatusLine } from '@/helpers/wording'
import {
  addQuickReply,
  removeQuickReply,
  setQuickReplyShortcut,
  setQuickReplyText,
  setShortcut
} from '@/lib/multifus'
import { QuickRepliesPanel } from '@/screens/shortcuts/quick-replies-panel'
import { ShortcutField } from '@/screens/shortcuts/shortcut-field'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  quickReplies: readonly QuickReply[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The four combinations of perimetre.md and the quick replies of ADR 0012, captured
 * here and reported as the system left them. One capture at a time for the whole
 * screen: two fields listening at once would both answer the same key press.
 */
export const ShortcutsScreen = ({
  shortcuts,
  quickReplies,
  run
}: ShortcutsScreenProps) => {
  const [editing, setEditing] = React.useState<Binding | null>(null)

  const handleClose = () => {
    setEditing(null)
  }

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
                accelerator={shortcut.accelerator}
                statusLine={shortcutStatusLine(shortcut.status, quickReplies)}
                editLabel={strings.shortcuts.edit(label)}
                editing={{
                  isActive: matchIsSameBinding(editing, {
                    kind: 'action',
                    action: shortcut.action
                  }),
                  handleOpen: () => {
                    setEditing({ kind: 'action', action: shortcut.action })
                  },
                  handleClose,
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

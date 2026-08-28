import { RotateCcw } from 'lucide-react'
import type {
  Binding,
  QuickReply,
  ShortcutAction,
  ShortcutBinding
} from '@/@types/shortcuts'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { ShortcutField } from '@/components/shortcut-field'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { matchIsSameBinding } from '@/helpers/binding'
import { shortcutStatusLine } from '@/helpers/wording'
import type { ShortcutUndo } from '@/hooks/use-shortcut-undo'

export type ActionsPanelActions = Readonly<{
  handleCapture: (shortcut: ShortcutBinding, accelerator: string | null) => void
  handleDefaults: () => void
  handleOpen: (action: ShortcutAction) => void
  handleClose: () => void
}>

type ActionsPanelProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  quickReplies: readonly QuickReply[]
  editing: Binding | null
  undoFor: (shortcut: ShortcutBinding) => ShortcutUndo | null
  actions: ActionsPanelActions
}>

export const ActionsPanel = ({
  shortcuts,
  quickReplies,
  editing,
  undoFor,
  actions
}: ActionsPanelProps) => {
  const words = strings.shortcuts

  const hasOwnKeys = shortcuts.some((shortcut) => {
    return !shortcut.isDefault
  })

  return (
    <>
      <Panel>
        {shortcuts.map((shortcut) => {
          const { label, description, mention } = words.actions[shortcut.action]

          return (
            <FieldRow
              key={shortcut.action}
              label={label}
              description={description}
              mention={mention ?? undefined}
            >
              <ShortcutField
                accelerator={shortcut.accelerator}
                statusLine={shortcutStatusLine(shortcut.status, quickReplies)}
                editLabel={words.edit(label)}
                undo={undoFor(shortcut)}
                editing={{
                  isActive: matchIsSameBinding(editing, {
                    kind: 'action',
                    action: shortcut.action
                  }),
                  handleOpen: () => {
                    actions.handleOpen(shortcut.action)
                  },
                  handleClose: actions.handleClose,
                  handleCapture: (accelerator) => {
                    actions.handleCapture(shortcut, accelerator)
                  }
                }}
              />
            </FieldRow>
          )
        })}
      </Panel>
      {hasOwnKeys ? (
        <div className="mt-2 mr-2 flex justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={actions.handleDefaults}
            className="rise text-mini font-normal text-muted-foreground/75 hover:text-foreground"
          >
            <RotateCcw aria-hidden />
            {words.defaults}
          </Button>
        </div>
      ) : null}
    </>
  )
}

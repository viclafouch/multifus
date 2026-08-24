import React from 'react'
import type { Binding, QuickReply, QuickReplyId } from '@/@types/shortcuts'
import { RemoveButton } from '@/components/remove-button'
import { Input } from '@/components/ui/input'
import { strings } from '@/constants/strings'
import { matchIsSameBinding } from '@/helpers/binding'
import type { TonedLine } from '@/helpers/wording'
import { useDraft } from '@/hooks/use-draft'
import { ShortcutField } from '@/screens/shortcuts/shortcut-field'

/** Everything a row can ask for, each one naming the quick reply it acts on. */
export type QuickReplyRowActions = Readonly<{
  handleText: (id: QuickReplyId, text: string) => void
  handleShortcut: (id: QuickReplyId, accelerator: string | null) => void
  handleRemove: (id: QuickReplyId) => void
  handleOpen: (id: QuickReplyId) => void
  handleClose: () => void
}>

type QuickReplyRowProps = Readonly<{
  quickReply: QuickReply
  statusLine: TonedLine
  /** The one capture in flight for the whole screen, of either family. */
  editing: Binding | null
  actions: QuickReplyRowActions
}>

/**
 * One quick reply: its line on the left, the keys that paste it on the right, and the
 * button that takes it away, which asks for no confirmation.
 */
export const QuickReplyRow = ({
  quickReply,
  statusLine,
  editing,
  actions
}: QuickReplyRowProps) => {
  const { draft, setDraft } = useDraft(quickReply.text)
  const words = strings.shortcuts.quickReplies

  const handleBlur = () => {
    // Trimmed here and not only on the Rust side: a text that comes back
    // trimmed leaves the stored value where it was, and the field would then
    // rewrite the configuration on every blur for ever.
    const text = draft.trim()

    setDraft(text)

    if (text !== quickReply.text) {
      actions.handleText(quickReply.id, text)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setDraft(quickReply.text)
    }
  }

  return (
    <li className="group flex items-start gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
      <Input
        value={draft}
        placeholder={words.placeholder}
        aria-label={words.textLabel}
        spellCheck={false}
        onChange={(event) => {
          setDraft(event.target.value)
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 text-note"
      />
      <ShortcutField
        accelerator={quickReply.accelerator}
        statusLine={statusLine}
        editLabel={words.edit}
        editing={{
          isActive: matchIsSameBinding(editing, {
            kind: 'quickReply',
            id: quickReply.id
          }),
          handleOpen: () => {
            actions.handleOpen(quickReply.id)
          },
          handleClose: actions.handleClose,
          handleCapture: (accelerator) => {
            actions.handleShortcut(quickReply.id, accelerator)
          }
        }}
      />
      <RemoveButton
        label={words.remove}
        onRemove={() => {
          actions.handleRemove(quickReply.id)
        }}
        className="mt-1"
      />
    </li>
  )
}

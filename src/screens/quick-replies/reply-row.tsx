import React from 'react'
import type { Binding, QuickReply, QuickReplyId } from '@/@types/shortcuts'
import { RemoveButton } from '@/components/remove-button'
import { ShortcutField } from '@/components/shortcut-field'
import { Input } from '@/components/ui/input'
import { strings } from '@/constants/strings'
import { matchIsSameBinding } from '@/helpers/binding'
import type { TonedLine } from '@/helpers/wording'
import { quickReplyEditLabel } from '@/helpers/wording'
import { useDraft } from '@/hooks/use-draft'

export type ReplyRowActions = Readonly<{
  handleText: (id: QuickReplyId, text: string) => void
  handleShortcut: (id: QuickReplyId, accelerator: string | null) => void
  handleRemove: (id: QuickReplyId) => void
  handleOpen: (id: QuickReplyId) => void
  handleClose: () => void
}>

type ReplyRowProps = Readonly<{
  quickReply: QuickReply
  statusLine: TonedLine | null
  editing: Binding | null
  actions: ReplyRowActions
}>

export const ReplyRow = ({
  quickReply,
  statusLine,
  editing,
  actions
}: ReplyRowProps) => {
  const { draft, setDraft } = useDraft(quickReply.text)
  const words = strings.quickReplies

  const handleBlur = () => {
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
      <div className="flex min-w-0 flex-1 flex-col gap-1">
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
          className="h-8 font-display text-row"
        />
        {draft.length === 0 ? (
          <p className="px-1 text-mini text-muted-foreground/75">
            {words.blank}
          </p>
        ) : null}
      </div>
      <RemoveButton
        label={words.remove}
        onRemove={() => {
          actions.handleRemove(quickReply.id)
        }}
        className="mt-1"
      />
      <ShortcutField
        accelerator={quickReply.accelerator}
        statusLine={statusLine}
        editLabel={quickReplyEditLabel(quickReply)}
        undo={null}
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
    </li>
  )
}

import React from 'react'
import { t } from '@lingui/core/macro'
import type { Binding, QuickText, QuickTextId } from '@/@types/shortcuts'
import { RemoveButton } from '@/components/remove-button'
import { ShortcutField } from '@/components/shortcut-field'
import { Input } from '@/components/ui/input'
import { matchIsSameBinding } from '@/helpers/binding'
import type { TonedLine } from '@/helpers/wording'
import { quickTextEditLabel } from '@/helpers/wording'
import { useDraft } from '@/hooks/use-draft'

export type TextRowActions = Readonly<{
  handleText: (id: QuickTextId, text: string) => void
  handleShortcut: (id: QuickTextId, accelerator: string | null) => void
  handleRemove: (id: QuickTextId) => void
  handleOpen: (id: QuickTextId) => void
  handleClose: () => void
}>

type TextRowProps = Readonly<{
  quickText: QuickText
  rank: number
  statusLine: TonedLine | null
  editing: Binding | null
  actions: TextRowActions
}>

export const TextRow = ({
  quickText,
  rank,
  statusLine,
  editing,
  actions
}: TextRowProps) => {
  const { draft, setDraft } = useDraft(quickText.text)

  const handleBlur = () => {
    const text = draft.trim()

    setDraft(text)

    if (text !== quickText.text) {
      actions.handleText(quickText.id, text)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      setDraft(quickText.text)
    }
  }

  return (
    <li className="group flex items-start gap-3 border-b border-band/25 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Input
          value={draft}
          placeholder={t`Bon jeu à toi !`}
          aria-label={t`Le texte à coller`}
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-9 text-tale"
        />
        {draft.length === 0 ? (
          <p className="px-1 text-aside text-khaki">
            {t`Sans texte, il n’y aura rien à coller.`}
          </p>
        ) : null}
      </div>
      <RemoveButton
        label={t`Retirer ce texte`}
        onRemove={() => {
          actions.handleRemove(quickText.id)
        }}
        className="mt-1"
      />
      <ShortcutField
        accelerator={quickText.accelerator}
        statusLine={statusLine}
        editLabel={quickTextEditLabel(quickText, rank)}
        undo={null}
        editing={{
          isActive: matchIsSameBinding(editing, {
            kind: 'quickText',
            id: quickText.id
          }),
          handleOpen: () => {
            actions.handleOpen(quickText.id)
          },
          handleClose: actions.handleClose,
          handleCapture: (accelerator) => {
            actions.handleShortcut(quickText.id, accelerator)
          }
        }}
      />
    </li>
  )
}

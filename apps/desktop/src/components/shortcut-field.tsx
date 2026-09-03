import React from 'react'
import { t } from '@lingui/core/macro'
import { KeyCap } from '@/components/key-cap'
import { ShortcutUndoButton } from '@/components/shortcut-undo-button'
import { Button } from '@/components/ui/button'
import type { CaptureRejection } from '@/constants/keyboard'
import { IS_APPLE } from '@/constants/keyboard'
import { acceleratorParts, capture, heldModifiers } from '@/helpers/accelerator'
import type { TonedLine } from '@/helpers/wording'
import type { ShortcutUndo } from '@/hooks/use-shortcut-undo'

type ShortcutFieldProps = Readonly<{
  accelerator: string | null
  statusLine: TonedLine | null
  editLabel: string
  undo: ShortcutUndo | null
  editing: Readonly<{
    isActive: boolean
    handleOpen: () => void
    handleClose: () => void
    handleCapture: (accelerator: string | null) => void
  }>
}>

export const ShortcutField = ({
  accelerator,
  statusLine,
  editLabel,
  undo,
  editing
}: ShortcutFieldProps) => {
  const [held, setHeld] = React.useState<readonly string[]>([])
  const [rejected, setRejected] = React.useState<CaptureRejection | null>(null)

  const stop = () => {
    setHeld([])
    setRejected(null)
    editing.handleClose()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault()

    if (event.key === 'Escape') {
      stop()

      return
    }

    if (event.key === 'Backspace' || event.key === 'Delete') {
      setHeld([])
      setRejected(null)
      editing.handleCapture(null)

      return
    }

    const result = capture(event)

    if (result.status === 'captured') {
      setHeld([])
      setRejected(null)
      editing.handleCapture(result.accelerator)

      return
    }

    setHeld(heldModifiers(event))
    setRejected(result.status === 'rejected' ? result.reason : null)
  }

  const parts = editing.isActive ? held : acceleratorParts(accelerator ?? '')

  const hint = fieldHint({
    isEditing: editing.isActive,
    statusLine,
    rejected
  })

  const offer = editing.isActive ? null : undo

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        aria-label={editLabel}
        data-editing={editing.isActive ? '' : undefined}
        data-error={hint?.tone === 'bad' ? '' : undefined}
        onClick={editing.handleOpen}
        onKeyDown={editing.isActive ? handleKeyDown : undefined}
        onBlur={editing.isActive ? stop : undefined}
        className="h-8 min-w-field justify-center gap-1 px-2 data-editing:border-primary/60 data-editing:bg-primary/8 data-editing:ring-2 data-editing:ring-ring data-error:border-destructive/45"
      >
        {parts.length === 0 ? (
          <span className="text-log font-normal text-muted-foreground">
            {editing.isActive ? t`Appuyez sur vos touches` : t`Aucune`}
          </span>
        ) : (
          parts.map((part) => {
            return <KeyCap key={part} token={part} />
          })
        )}
      </Button>
      {hint === null ? null : (
        <p
          data-tone={hint.tone}
          role={hint.tone === 'bad' ? 'alert' : undefined}
          className="max-w-60 text-right text-mini text-muted-foreground data-[tone=bad]:text-destructive"
        >
          {hint.text}
        </p>
      )}
      {offer === null ? null : <ShortcutUndoButton undo={offer} />}
    </div>
  )
}

const rejectionLine = (rejected: CaptureRejection) => {
  switch (rejected) {
    case 'noModifier': {
      return IS_APPLE
        ? t`Ajoutez Ctrl, Alt ou Maj. Seule, cette touche partirait dès que vous écrivez dans le jeu.`
        : t`Ajoutez Ctrl, Alt ou Maj, ou prenez une touche de fonction : F1, F2, F5… Seule, cette touche partirait dès que vous écrivez dans le jeu.`
    }
    case 'unsupportedKey': {
      return t`Cette touche ne peut pas servir de raccourci.`
    }
    case 'pasteCombination': {
      return t`C’est le raccourci pour coller sur votre ordinateur. Prenez-en un autre.`
    }
    default: {
      return rejected satisfies never
    }
  }
}

type FieldHintParams = {
  readonly isEditing: boolean
  readonly statusLine: TonedLine | null
  readonly rejected: CaptureRejection | null
}

const fieldHint = ({
  isEditing,
  statusLine,
  rejected
}: FieldHintParams): TonedLine | null => {
  if (rejected !== null) {
    return { tone: 'bad', text: rejectionLine(rejected) }
  }

  if (isEditing) {
    return {
      tone: 'calm',
      text: t`Échap pour annuler, Retour arrière pour effacer.`
    }
  }

  return statusLine
}

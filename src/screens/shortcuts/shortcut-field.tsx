import React from 'react'
import { Button } from '@/components/ui/button'
import type { CaptureRejection } from '@/constants/keyboard'
import { strings } from '@/constants/strings'
import { acceleratorParts, capture, heldModifiers } from '@/helpers/accelerator'
import type { TonedLine } from '@/helpers/wording'
import { KeyCap } from '@/screens/shortcuts/key-cap'

type ShortcutFieldProps = Readonly<{
  /** As the plugin reads it, `null` for a binding with no combination. */
  accelerator: string | null
  /** What the system answered, already in words: this field knows neither the
   * four actions nor the quick replies. */
  statusLine: TonedLine
  /** What a screen reader is told this button opens. */
  editLabel: string
  editing: Readonly<{
    isActive: boolean
    handleOpen: () => void
    handleClose: () => void
    handleCapture: (accelerator: string | null) => void
  }>
}>

/**
 * One key cap that turns into a capture field, for an action as for a quick reply.
 * Read off `keydown`, so the combination stored is the physical one.
 */
export const ShortcutField = ({
  accelerator,
  statusLine,
  editLabel,
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

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        aria-label={editLabel}
        data-editing={editing.isActive ? '' : undefined}
        data-error={hint.tone === 'bad' ? '' : undefined}
        onClick={editing.handleOpen}
        onKeyDown={editing.isActive ? handleKeyDown : undefined}
        onBlur={editing.isActive ? stop : undefined}
        className="h-8 min-w-field justify-center gap-1 px-2 data-editing:border-primary/60 data-editing:bg-primary/8 data-editing:ring-2 data-editing:ring-ring data-error:border-destructive/45"
      >
        {parts.length === 0 ? (
          <span className="text-log font-normal text-muted-foreground">
            {editing.isActive
              ? strings.shortcuts.capture
              : strings.shortcuts.empty}
          </span>
        ) : (
          parts.map((part) => {
            return <KeyCap key={part} token={part} />
          })
        )}
      </Button>
      <p
        data-tone={hint.tone}
        role={hint.tone === 'bad' ? 'alert' : undefined}
        className="max-w-60 text-right text-mini text-muted-foreground/75 data-[tone=bad]:text-destructive"
      >
        {hint.text}
      </p>
    </div>
  )
}

type FieldHintParams = {
  readonly isEditing: boolean
  readonly statusLine: TonedLine
  readonly rejected: CaptureRejection | null
}

/**
 * What the line under the field says, and it always says something. A field that
 * stays silent is a field one has to go and test in the game to trust.
 */
const fieldHint = ({
  isEditing,
  statusLine,
  rejected
}: FieldHintParams): TonedLine => {
  if (rejected !== null) {
    return { tone: 'bad', text: strings.shortcuts.rejected[rejected] }
  }

  if (isEditing) {
    return { tone: 'calm', text: strings.shortcuts.captureHint }
  }

  return statusLine
}

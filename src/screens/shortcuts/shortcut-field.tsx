import React from 'react'
import type { ShortcutBinding, ShortcutStatus } from '@/@types/shortcuts'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import type { CaptureRejection } from '@/lib/accelerator'
import { acceleratorParts, capture, heldModifiers } from '@/lib/accelerator'
import { KeyCap } from '@/screens/shortcuts/key-cap'

type ShortcutFieldProps = Readonly<{
  shortcut: ShortcutBinding
  editing: Readonly<{
    isActive: boolean
    handleOpen: () => void
    handleClose: () => void
    handleCapture: (accelerator: string | null) => void
  }>
}>

/**
 * One key cap that turns into a capture field. Everything is read off `keydown`,
 * so the combination stored is the physical one, whatever the keyboard layout.
 */
export const ShortcutField = ({ shortcut, editing }: ShortcutFieldProps) => {
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

  const parts = editing.isActive
    ? held
    : acceleratorParts(shortcut.accelerator ?? '')

  const hint = fieldHint({
    isEditing: editing.isActive,
    status: shortcut.status,
    rejected
  })

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        aria-label={strings.shortcuts.edit(
          strings.shortcuts.actions[shortcut.action].label
        )}
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
  readonly status: ShortcutStatus
  readonly rejected: CaptureRejection | null
}

type FieldHint = {
  readonly tone: 'bad' | 'calm'
  readonly text: string
}

/**
 * What the line under the field says, and it always says something. A field that
 * stays silent is a field one has to go and test in the game to trust.
 */
const fieldHint = ({
  isEditing,
  status,
  rejected
}: FieldHintParams): FieldHint => {
  if (rejected !== null) {
    return { tone: 'bad', text: strings.shortcuts.rejected[rejected] }
  }

  if (isEditing) {
    return { tone: 'calm', text: strings.shortcuts.captureHint }
  }

  return statusHint(status)
}

/** What the system answered about this combination, in French. */
const statusHint = (status: ShortcutStatus): FieldHint => {
  const answers = strings.shortcuts.status

  switch (status.kind) {
    case 'registered': {
      return { tone: 'calm', text: answers.registered }
    }
    case 'unbound': {
      return { tone: 'calm', text: answers.unbound }
    }
    case 'pending': {
      return { tone: 'calm', text: answers.pending }
    }
    case 'invalid': {
      return { tone: 'bad', text: answers.invalid }
    }
    case 'refused': {
      return { tone: 'bad', text: answers.refused }
    }
    case 'duplicate': {
      const { label } = strings.shortcuts.actions[status.action]

      return { tone: 'bad', text: answers.duplicate(label) }
    }
    default: {
      return { tone: 'calm', text: answers.pending }
    }
  }
}

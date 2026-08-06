import React from 'react'
import type {
  ShortcutAction,
  ShortcutBinding,
  ShortcutStatus
} from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow, Note, Panel, Screen } from '@/components/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { keyLabel } from '@/helpers/accelerator'
import type { CaptureRejection } from '@/lib/accelerator'
import { acceleratorParts, capture, heldModifiers } from '@/lib/accelerator'
import { setShortcut } from '@/lib/multifus'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The four combinations of perimetre.md.
 *
 * This screen captures, and then reports. What each combination is worth is not
 * guessed here: the Rust side lays it on the system and sends back what the
 * system answered, action by action. That is the trap of Dracoon shut, which
 * drops every shortcut and puts them back inside a swallowed try, leaving one
 * bad combination to cost the user all four and tell them nothing.
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
 * One key cap that turns into a capture field.
 *
 * Everything is read off `keydown` and nothing off `key`, so the combination
 * stored is the physical one and does not move with the keyboard layout. A press
 * that is only modifiers is shown as it is held rather than rejected: it is
 * somebody halfway through a combination, not a mistake.
 */
const ShortcutField = ({ shortcut, editing }: ShortcutFieldProps) => {
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

type KeyCapProps = Readonly<{
  token: string
}>

const KeyCap = ({ token }: KeyCapProps) => {
  return (
    <kbd className="keycap inline-flex h-cap min-w-cap items-center justify-center rounded-sm border border-border bg-card px-1.5 font-mono text-mini leading-none font-medium text-foreground/90">
      {keyLabel(token)}
    </kbd>
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
 * What the line under the field says.
 *
 * It always says something. A combination that works is the state the user came
 * here to confirm, and a field that stays silent about it is a field one has to
 * go and test in the game to trust.
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

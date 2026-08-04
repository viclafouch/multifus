import React from 'react'
import { FieldRow, Note, Panel, Screen } from '@/components/screen'
import { Button } from '@/components/ui/button'
import type { CaptureRejection } from '@/lib/accelerator'
import { acceleratorParts, capture, heldModifiers } from '@/lib/accelerator'
import type { ShortcutAction, ShortcutBinding, Snapshot } from '@/lib/multifus'
import { setShortcut } from '@/lib/multifus'
import { keyLabel, strings } from '@/lib/strings'

type ShortcutsScreenProps = Readonly<{
  shortcuts: readonly ShortcutBinding[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The four combinations of perimetre.md.
 *
 * This screen captures and stores, and stops there. Whether the system accepts a
 * combination is the plugin's answer at the next step, and the trap to avoid
 * then is Dracoon's: it unregisters everything and re-registers it inside a
 * swallowed try, so one bad combination leaves the user with no shortcuts at all
 * and no message.
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
                isConflicting={isConflicting(shortcuts, shortcut)}
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
      <Note>{strings.shortcuts.notWired}</Note>
    </Screen>
  )
}

type ShortcutFieldProps = Readonly<{
  shortcut: ShortcutBinding
  isConflicting: boolean
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
const ShortcutField = ({
  shortcut,
  isConflicting: hasConflict,
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

  const parts = editing.isActive
    ? held
    : acceleratorParts(shortcut.accelerator ?? '')

  const hint = fieldHint({
    isEditing: editing.isActive,
    hasConflict,
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
        data-conflict={hasConflict ? '' : undefined}
        onClick={editing.handleOpen}
        onKeyDown={editing.isActive ? handleKeyDown : undefined}
        onBlur={editing.isActive ? stop : undefined}
        className="h-8 min-w-field justify-center gap-1 px-2 data-conflict:border-destructive/45 data-editing:border-primary/60 data-editing:bg-primary/8 data-editing:ring-2 data-editing:ring-ring"
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
      {hint === null ? null : (
        <p
          data-tone={hint.tone}
          className="max-w-60 text-right text-mini text-muted-foreground/75 data-[tone=bad]:text-destructive"
        >
          {hint.text}
        </p>
      )}
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
  readonly hasConflict: boolean
  readonly rejected: CaptureRejection | null
}

/** What the line under the field says, or nothing when it has nothing to say. */
const fieldHint = ({ isEditing, hasConflict, rejected }: FieldHintParams) => {
  if (rejected !== null) {
    return { tone: 'bad', text: strings.shortcuts.rejected[rejected] }
  }

  if (isEditing) {
    return { tone: 'calm', text: strings.shortcuts.captureHint }
  }

  if (hasConflict) {
    return { tone: 'bad', text: strings.shortcuts.duplicate }
  }

  return null
}

/** Whether another action already answers to the same combination. */
const isConflicting = (
  shortcuts: readonly ShortcutBinding[],
  shortcut: ShortcutBinding
) => {
  if (shortcut.accelerator === null) {
    return false
  }

  const same = acceleratorParts(shortcut.accelerator).join('+')

  return shortcuts.some((other) => {
    return (
      other.action !== shortcut.action &&
      other.accelerator !== null &&
      acceleratorParts(other.accelerator).join('+') === same
    )
  })
}

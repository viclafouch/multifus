import React from 'react'
import type { ShortcutAction, ShortcutBinding } from '@/@types/shortcuts'
import { shortcutUndoLabel } from '@/helpers/wording'

export type ShortcutUndo = Readonly<{
  accelerator: string | null
  label: string
  handleUndo: () => void
}>

type ApplyUndo = (action: ShortcutAction, accelerator: string | null) => void

export const useShortcutUndo = (apply: ApplyUndo) => {
  const [before, setBefore] = React.useState<
    ReadonlyMap<ShortcutAction, string | null>
  >(new Map())

  const remember = (shortcuts: readonly ShortcutBinding[]) => {
    setBefore((memory) => {
      const changed = shortcuts.map(
        (shortcut): [ShortcutAction, string | null] => {
          return [shortcut.action, shortcut.accelerator]
        }
      )

      return new Map([...memory, ...changed])
    })
  }

  const forget = (action: ShortcutAction) => {
    setBefore((memory) => {
      const next = new Map(memory)

      next.delete(action)

      return next
    })
  }

  const forgetAll = () => {
    setBefore(new Map())
  }

  const undoFor = (shortcut: ShortcutBinding): ShortcutUndo | null => {
    if (!before.has(shortcut.action)) {
      return null
    }

    const accelerator = before.get(shortcut.action) ?? null

    if (accelerator === shortcut.accelerator) {
      return null
    }

    return {
      accelerator,
      label: shortcutUndoLabel(shortcut.action),
      handleUndo: () => {
        forget(shortcut.action)
        apply(shortcut.action, accelerator)
      }
    }
  }

  return { remember, forgetAll, undoFor }
}

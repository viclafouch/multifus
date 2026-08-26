import { Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { acceleratorParts } from '@/helpers/accelerator'
import type { ShortcutUndo } from '@/hooks/use-shortcut-undo'
import { KeyCap } from '@/screens/shortcuts/key-cap'

type ShortcutUndoButtonProps = Readonly<{
  undo: ShortcutUndo
}>

export const ShortcutUndoButton = ({ undo }: ShortcutUndoButtonProps) => {
  const parts = acceleratorParts(undo.accelerator ?? '')

  return (
    <Button
      variant="ghost"
      size="xs"
      aria-label={undo.label}
      onClick={undo.handleUndo}
      className="rise text-mini font-normal text-muted-foreground hover:text-foreground"
    >
      <Undo2 aria-hidden />
      {parts.length === 0 ? strings.shortcuts.undoNone : strings.shortcuts.undo}
      {parts.map((part) => {
        return <KeyCap key={part} token={part} />
      })}
    </Button>
  )
}

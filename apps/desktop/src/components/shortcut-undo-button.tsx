import { Undo2 } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { KeyCap } from '@/components/key-cap'
import { Button } from '@/components/ui/button'
import { acceleratorParts } from '@/helpers/accelerator'
import type { ShortcutUndo } from '@/hooks/use-shortcut-undo'

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
      {parts.length === 0 ? t`Remettre : aucune touche` : t`Remettre`}
      {parts.map((part) => {
        return <KeyCap key={part} token={part} />
      })}
    </Button>
  )
}

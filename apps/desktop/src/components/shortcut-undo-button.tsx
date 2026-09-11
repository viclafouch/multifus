import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import { KeyCap } from '@/components/key-cap'
import { acceleratorParts } from '@/helpers/accelerator'
import type { ShortcutUndo } from '@/hooks/use-shortcut-undo'

type ShortcutUndoButtonProps = Readonly<{
  undo: ShortcutUndo
}>

export const ShortcutUndoButton = ({ undo }: ShortcutUndoButtonProps) => {
  const parts = acceleratorParts(undo.accelerator ?? '')

  return (
    <Button
      variant="bare"
      size="tight"
      aria-label={undo.label}
      onClick={undo.handleUndo}
      className="rise text-aside font-normal text-muted-foreground hover:text-foreground"
    >
      {parts.length === 0 ? t`Remettre : aucune touche` : t`Remettre`}
      {parts.map((part) => {
        return <KeyCap key={part} token={part} />
      })}
    </Button>
  )
}

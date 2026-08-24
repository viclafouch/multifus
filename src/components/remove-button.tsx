import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RemoveButtonProps = Readonly<{
  /** What a screen reader is told this takes away, named. */
  label: string
  onRemove: () => void
  className?: string
}>

/**
 * Takes a row out of a list, and asks nothing first. It shows on the hover of
 * the row that owns it, which needs a `group` class on that row.
 */
export const RemoveButton = ({
  label,
  onRemove,
  className
}: RemoveButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      onClick={onRemove}
      className={cn(
        'text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100',
        className
      )}
    >
      <X strokeWidth={2.2} />
    </Button>
  )
}

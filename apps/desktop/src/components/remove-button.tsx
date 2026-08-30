import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RemoveButtonProps = Readonly<{
  label: string
  onRemove: () => void
  className?: string
}>

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

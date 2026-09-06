import { Button } from '@/components/retro/button'
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
      variant="bare"
      size="icon-tight"
      aria-label={label}
      onClick={onRemove}
      className={cn(
        'text-bar leading-none text-khaki/55 opacity-0 group-hover:opacity-100 hover:text-flame focus-visible:opacity-100',
        className
      )}
    >
      <span aria-hidden>×</span>
    </Button>
  )
}

import type { ButtonLook } from '@/components/retro/button'
import { Button } from '@/components/retro/button'
import { cn } from '@/lib/utils'

const CROSS_PATH = 'M6 6 L18 18 M18 6 L6 18'

type RemoveButtonProps = Readonly<{
  label: string
  onRemove: () => void
  variant?: Extract<ButtonLook['variant'], 'ember' | 'token'>
  size?: ButtonLook['size']
  className?: string
}>

export const RemoveButton = ({
  label,
  onRemove,
  variant = 'ember',
  size = 'icon-tight',
  className
}: RemoveButtonProps) => {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      onClick={onRemove}
      className={cn('relative', className)}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="cross absolute inset-0 m-auto size-2/3"
      >
        <path d={CROSS_PATH} />
      </svg>
    </Button>
  )
}

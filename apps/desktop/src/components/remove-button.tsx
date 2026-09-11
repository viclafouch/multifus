import { Button, type ButtonLook, Cross, cn } from '@multifus/retro'

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
      <Cross className="absolute inset-0 m-auto size-2/3" />
    </Button>
  )
}

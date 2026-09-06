import type { ButtonLook } from '@/components/retro/button'
import { Button } from '@/components/retro/button'
import { ignore } from '@/lib/utils'

type LinkButtonProps = Readonly<{
  label: string
  onOpen: () => Promise<null>
  variant?: ButtonLook['variant']
  size?: ButtonLook['size']
}>

export const LinkButton = ({
  label,
  onOpen,
  variant = 'slate',
  size = 'sm'
}: LinkButtonProps) => {
  const handleClick = () => {
    onOpen().catch(ignore)
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick}>
      {label}
    </Button>
  )
}

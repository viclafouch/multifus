import { ExternalLink } from 'lucide-react'
import type { ButtonLook } from '@/components/button-look'
import { Button } from '@/components/ui/button'
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
  variant = 'ghost',
  size = 'xs'
}: LinkButtonProps) => {
  const handleClick = () => {
    onOpen().catch(ignore)
  }

  return (
    <Button
      variant={variant}
      size={size}
      data-quiet={variant === 'ghost' ? '' : undefined}
      className="data-quiet:text-muted-foreground data-quiet:hover:text-primary"
      onClick={handleClick}
    >
      <ExternalLink aria-hidden />
      {label}
    </Button>
  )
}

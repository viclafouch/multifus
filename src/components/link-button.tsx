import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ignore } from '@/lib/utils'

type LinkButtonProps = Readonly<{
  label: string
  onOpen: () => Promise<null>
}>

export const LinkButton = ({ label, onOpen }: LinkButtonProps) => {
  const handleClick = () => {
    onOpen().catch(ignore)
  }

  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={handleClick}
      className="text-muted-foreground hover:text-primary"
    >
      <ExternalLink aria-hidden />
      {label}
    </Button>
  )
}

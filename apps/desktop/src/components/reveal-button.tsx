import { FolderOpen } from 'lucide-react'
import { Button } from '@multifus/retro'
import { ignore } from '@/lib/utils'

type RevealButtonProps = Readonly<{
  label: string
  onReveal: () => Promise<null>
}>

export const RevealButton = ({ label, onReveal }: RevealButtonProps) => {
  const handleClick = () => {
    onReveal().catch(ignore)
  }

  return (
    <Button
      variant="bare"
      size="icon-tight"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className="text-muted-foreground/55 hover:text-foreground"
    >
      <FolderOpen aria-hidden strokeWidth={2} />
    </Button>
  )
}

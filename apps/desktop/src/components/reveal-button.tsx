import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      variant="ghost"
      size="icon-xs"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className="text-muted-foreground/55 hover:text-foreground"
    >
      <FolderOpen aria-hidden strokeWidth={2} />
    </Button>
  )
}

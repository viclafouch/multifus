import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopy } from '@/hooks/use-copy'

type CopyButtonProps = Readonly<{
  text: string
  label: string
  copiedLabel: string
}>

/**
 * A quiet icon button that puts text on the clipboard.
 *
 * It confirms by becoming a tick in the one accent colour of this window, for a
 * couple of seconds, and by nothing else: a drawer that raises a banner every
 * time something is copied is a drawer one stops opening.
 */
export const CopyButton = ({ text, label, copiedLabel }: CopyButtonProps) => {
  const { hasCopied, copy } = useCopy()

  const handleClick = () => {
    copy(text)
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      data-copied={hasCopied ? '' : undefined}
      onClick={handleClick}
      title={hasCopied ? copiedLabel : label}
      aria-label={hasCopied ? copiedLabel : label}
      className="text-muted-foreground/55 hover:text-foreground data-copied:text-primary"
    >
      {hasCopied ? <Check strokeWidth={2.5} /> : <Copy strokeWidth={2} />}
    </Button>
  )
}

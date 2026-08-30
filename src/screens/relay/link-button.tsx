import { ExternalLink } from 'lucide-react'
import type { RelayLink } from '@/@types/relay'
import { Button } from '@/components/ui/button'
import { openRelayLink } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

type LinkButtonProps = Readonly<{
  link: RelayLink
  label: string
}>

export const LinkButton = ({ link, label }: LinkButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => {
        openRelayLink(link).catch(ignore)
      }}
      className="text-muted-foreground hover:text-primary"
    >
      <ExternalLink aria-hidden />
      {label}
    </Button>
  )
}

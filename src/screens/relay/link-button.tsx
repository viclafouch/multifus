import { ExternalLink } from 'lucide-react'
import type { RelayLink } from '@/@types/relay'
import { Button } from '@/components/ui/button'
import { openRelayLink } from '@/lib/multifus'

/** The Rust side journals what the system refused to open. Nothing to add. */
const ignoreOpenFailure = () => {}

type LinkButtonProps = Readonly<{
  link: RelayLink
  label: string
}>

/**
 * A page Multifus offers to open, named and never addressed. The URL lives in
 * `app::relay::links`, so nothing here can point the browser elsewhere.
 */
export const LinkButton = ({ link, label }: LinkButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => {
        openRelayLink(link).catch(ignoreOpenFailure)
      }}
      className="text-muted-foreground hover:text-primary"
    >
      <ExternalLink aria-hidden />
      {label}
    </Button>
  )
}

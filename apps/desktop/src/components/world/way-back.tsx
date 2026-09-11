import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'

type WayBackProps = Readonly<{
  onGo: () => void
}>

export const WayBack = ({ onGo }: WayBackProps) => {
  return (
    <Button variant="slate" size="sm" onClick={onGo}>
      <span aria-hidden>‹</span>
      {t`Retour`}
    </Button>
  )
}

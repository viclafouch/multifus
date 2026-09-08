import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Loop } from '@/@types/loop'
import type { Snapshot } from '@/@types/snapshot'
import { LoopDialog } from '@/components/loop-dialog'
import { Button } from '@/components/retro/button'
import { useLoopOnce } from '@/hooks/use-loop-once'

type MapLoopProps = Readonly<{
  loop: Loop
  isSeen: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const MapLoop = ({ loop, isSeen, run }: MapLoopProps) => {
  const once = useLoopOnce({ loop: loop.name, isSeen, run })

  return (
    <>
      <Button variant="slate" size="sm" onClick={once.handleOpen}>
        {t`Voir la vidéo`}
      </Button>
      <LoopDialog
        title={i18n._(loop.title)}
        description={i18n._(loop.description)}
        caption={i18n._(loop.caption)}
        source={loop.source}
        isOpen={once.isOpen}
        onOpenChange={once.handleOpenChange}
      />
    </>
  )
}

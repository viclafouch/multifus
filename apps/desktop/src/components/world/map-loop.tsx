import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import type { Loop } from '@/@types/loop'
import type { Snapshot } from '@/@types/snapshot'
import { LoopDialog } from '@/components/loop-dialog'
import { LoopPorthole } from '@/components/world/loop-porthole'
import { useLoopOnce } from '@/hooks/use-loop-once'

type MapLoopProps = Readonly<{
  loop: Loop
  isSeen: boolean
  run: (action: Promise<Snapshot>) => void
}>

export const MapLoop = ({ loop, isSeen, run }: MapLoopProps) => {
  const once = useLoopOnce({ loop: loop.name, isSeen, run })
  const caption = i18n._(loop.caption)

  return (
    <>
      <Button variant="slate" size="sm" onClick={once.handleOpen}>
        {t`Voir la vidéo`}
      </Button>
      {once.isPeeking ? (
        <LoopPorthole
          source={loop.source}
          caption={caption}
          onWatch={once.handleGrow}
          onDismiss={once.handleDismiss}
        />
      ) : null}
      <LoopDialog
        title={i18n._(loop.title)}
        description={i18n._(loop.description)}
        caption={caption}
        source={loop.source}
        from={once.from}
        isOpen={once.isOpen}
        onOpenChange={once.handleOpenChange}
      />
    </>
  )
}

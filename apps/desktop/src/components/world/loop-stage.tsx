import { usePlayer } from '@multifus/retro'
import { LoopCurtain } from '@/components/world/loop-curtain'
import { useStill } from '@/hooks/use-still'
import { FILM_MORPH } from '@/lib/morph'

type LoopStageProps = Readonly<{
  source: string | null
  caption: string
  from: number | null
  onReady: () => void
}>

export const LoopStage = ({
  source,
  caption,
  from,
  onReady
}: LoopStageProps) => {
  const isStill = useStill()
  const isCarriedOn = from !== null
  const { video, isPlaying, toggle } = usePlayer({
    isStill,
    isAuto: isCarriedOn
  })

  return (
    <div className="stage relative aspect-loop w-full">
      {source === null ? (
        <p className="reel-picture absolute inset-0 flex items-center justify-center px-10 text-center text-tale text-balance text-khaki">
          {caption}
        </p>
      ) : (
        <>
          <video
            ref={video}
            src={source}
            aria-label={caption}
            style={{ viewTransitionName: FILM_MORPH }}
            className="reel-picture absolute inset-0 size-full object-cover"
            controls={isStill}
            loop
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(event) => {
              if (from !== null) {
                event.currentTarget.currentTime = from
              }

              onReady()
            }}
            onError={onReady}
          />
          {isStill ? null : (
            <LoopCurtain isPlaying={isPlaying} onToggle={toggle} />
          )}
        </>
      )}
    </div>
  )
}

import { useLingui } from '@lingui/react'
import { usePlayer } from '@multifus/retro'
import type { LoopId } from '@/@types/page'
import { LoopCurtain } from '@/components/loop-curtain'
import { captionOf, LOOPS, posterSizesOf } from '@/constants/loops'
import { useMedia } from '@/hooks/use-media'
import { sourcesOf, STILL } from '@/lib/media'

type LoopPlateProps = Readonly<{
  loop: LoopId
  isAuto?: boolean
}>

export const LoopPlate = ({ loop, isAuto = false }: LoopPlateProps) => {
  const { i18n } = useLingui()
  const isStill = useMedia(STILL)
  const { video, isPlaying, toggle } = usePlayer({ isStill, isAuto })
  const { source, size, poster } = LOOPS[loop]

  return (
    <div
      className="stage carried relative aspect-loop w-full"
      data-auto={isAuto ? '' : undefined}
    >
      <img
        src={poster.full.src}
        srcSet={sourcesOf(poster)}
        sizes={posterSizesOf(loop)}
        alt=""
        width={poster.full.width}
        height={poster.full.height}
        className="absolute inset-0 size-full object-cover"
      />
      <video
        ref={video}
        src={source}
        width={size.width}
        height={size.height}
        aria-label={i18n._(captionOf(loop))}
        className="absolute inset-0 size-full object-cover"
        controls={isStill}
        loop
        muted
        playsInline
        preload="none"
      />
      {isStill ? null : <LoopCurtain isPlaying={isPlaying} onToggle={toggle} />}
    </div>
  )
}

import { useLingui } from '@lingui/react'
import { usePlayer } from '@multifus/retro'
import type { FeatureId } from '@/@types/page'
import { LoopCurtain } from '@/components/loop-curtain'
import { LOOPS } from '@/constants/loops'
import { PAGE_PROMISES } from '@/constants/wording'
import { useMedia } from '@/hooks/use-media'
import { sourcesOf, STAGE_SIZES, STILL } from '@/lib/media'

type LoopPlateProps = Readonly<{
  loop: FeatureId
}>

export const LoopPlate = ({ loop }: LoopPlateProps) => {
  const { i18n } = useLingui()
  const isStill = useMedia(STILL)
  const { video, isPlaying, toggle } = usePlayer({ isStill, isAuto: false })
  const { source, size, poster } = LOOPS[loop]

  return (
    <div className="stage carried relative aspect-loop w-full">
      <img
        src={poster.full.src}
        srcSet={sourcesOf(poster)}
        sizes={STAGE_SIZES}
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
        aria-label={i18n._(PAGE_PROMISES[loop])}
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

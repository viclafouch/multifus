import type { LoopId } from '@/@types/page'
import { LoopChip } from '@/components/loop-chip'
import { LoopCurtain } from '@/components/loop-curtain'
import { LOOPS } from '@/constants/loops'
import { useMedia } from '@/hooks/use-media'
import { usePlayer } from '@/hooks/use-player'
import { STILL } from '@/lib/media'

type LoopPlateProps = Readonly<{
  loop: LoopId
  caption: string
  isAmbient?: boolean
}>

export const LoopPlate = ({
  loop,
  caption,
  isAmbient = false
}: LoopPlateProps) => {
  const isStill = useMedia(STILL)
  const { video, isPlaying, toggle } = usePlayer({ isStill, isAuto: isAmbient })
  const { source, poster } = LOOPS[loop]
  const Toggle = isAmbient ? LoopChip : LoopCurtain

  return (
    <div className="stage carried relative aspect-loop w-full">
      <video
        ref={video}
        src={source}
        poster={poster}
        aria-label={caption}
        className="absolute inset-0 size-full object-cover"
        controls={isStill}
        loop
        muted
        playsInline
        preload="metadata"
      />
      {isStill ? null : <Toggle isPlaying={isPlaying} onToggle={toggle} />}
    </div>
  )
}

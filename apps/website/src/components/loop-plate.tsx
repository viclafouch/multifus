import type { LoopId } from '@/@types/page'
import { LoopCurtain } from '@/components/loop-curtain'
import { LOOPS } from '@/constants/loops'
import { useMedia } from '@/hooks/use-media'
import { usePlayer } from '@/hooks/use-player'
import { STILL } from '@/lib/media'

type LoopPlateProps = Readonly<{
  loop: LoopId
  caption: string
  isAuto?: boolean
}>

export const LoopPlate = ({
  loop,
  caption,
  isAuto = false
}: LoopPlateProps) => {
  const isStill = useMedia(STILL)
  const { video, isPlaying, toggle } = usePlayer({ isStill, isAuto })
  const { source, size, poster } = LOOPS[loop]

  return (
    <div className="stage carried relative aspect-loop w-full">
      <video
        ref={video}
        src={source}
        poster={poster}
        width={size.width}
        height={size.height}
        aria-label={caption}
        className="absolute inset-0 size-full object-cover"
        controls={isStill}
        loop
        muted
        playsInline
        preload="metadata"
      />
      {isStill ? null : <LoopCurtain isPlaying={isPlaying} onToggle={toggle} />}
    </div>
  )
}

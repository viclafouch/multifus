import type { LoopId } from '@/@types/page'
import { LoopSwitch } from '@/components/loop-switch'
import { LOOPS } from '@/constants/loops'
import { usePlayer } from '@/hooks/use-player'
import { useStill } from '@/hooks/use-still'

type LoopPlateProps = Readonly<{
  loop: LoopId
  caption: string
}>

export const LoopPlate = ({ loop, caption }: LoopPlateProps) => {
  const isStill = useStill()
  const { video, isPlaying, toggle } = usePlayer(isStill)
  const { source, poster } = LOOPS[loop]

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
      {isStill ? null : <LoopSwitch isPlaying={isPlaying} onToggle={toggle} />}
    </div>
  )
}

import type { LoopId } from '@/@types/page'
import { LOOPS } from '@/constants/loops'
import { useStill } from '@/hooks/use-still'

type LoopPlateProps = Readonly<{
  loop: LoopId
  caption: string
}>

export const LoopPlate = ({ loop, caption }: LoopPlateProps) => {
  const isStill = useStill()
  const { source, poster } = LOOPS[loop]

  return (
    <div className="stage relative aspect-loop w-full max-w-stage">
      <video
        src={source}
        poster={poster}
        aria-label={caption}
        className="absolute inset-0 size-full object-cover"
        autoPlay={!isStill}
        controls={isStill}
        loop
        muted
        playsInline
        preload="metadata"
      />
    </div>
  )
}

import { matchIsStill } from '@/lib/motion'

type LoopStageProps = Readonly<{
  source: string | null
  caption: string
}>

export const LoopStage = ({ source, caption }: LoopStageProps) => {
  const isStill = matchIsStill()

  return (
    <div className="stage relative aspect-loop w-full">
      {source === null ? (
        <p className="absolute inset-0 flex items-center justify-center px-10 text-center text-tale text-balance text-khaki">
          {caption}
        </p>
      ) : (
        <video
          src={source}
          aria-label={caption}
          className="size-full object-cover"
          autoPlay={!isStill}
          controls={isStill}
          loop
          muted
          playsInline
          preload="metadata"
        />
      )}
    </div>
  )
}

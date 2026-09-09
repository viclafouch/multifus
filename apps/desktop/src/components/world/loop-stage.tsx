import { useStill } from '@/hooks/use-still'

type LoopStageProps = Readonly<{
  source: string | null
  caption: string
  onReady: () => void
}>

export const LoopStage = ({ source, caption, onReady }: LoopStageProps) => {
  const isStill = useStill()

  return (
    <div className="stage relative aspect-loop w-full">
      {source === null ? (
        <p className="reel-picture absolute inset-0 flex items-center justify-center px-10 text-center text-tale text-balance text-khaki">
          {caption}
        </p>
      ) : (
        <video
          src={source}
          aria-label={caption}
          className="reel-picture absolute inset-0 size-full object-cover"
          autoPlay={!isStill}
          controls={isStill}
          loop
          muted
          playsInline
          preload="auto"
          onPlaying={onReady}
          onLoadedData={isStill ? onReady : undefined}
          onError={onReady}
        />
      )}
    </div>
  )
}

type LoopStageProps = Readonly<{
  source: string | null
  caption: string
}>

export const LoopStage = ({ source, caption }: LoopStageProps) => {
  return (
    <div className="stage relative aspect-loop w-full">
      {source === null ? (
        <p className="absolute inset-0 flex items-center justify-center px-10 text-center text-tale text-balance text-khaki">
          {caption}
        </p>
      ) : (
        <img src={source} alt={caption} className="size-full object-cover" />
      )}
    </div>
  )
}

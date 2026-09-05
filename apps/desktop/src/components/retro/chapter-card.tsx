type ChapterCardProps = Readonly<{
  legend: string
  title: string
}>

export const ChapterCard = ({ legend, title }: ChapterCardProps) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8">
      <div className="chapter rule flex flex-col items-center gap-2.5 border-y px-10 py-6">
        <p className="font-carve text-legend tracking-chapter text-khaki/75 uppercase">
          {legend}
        </p>
        <p className="limelight font-carve text-chapter tracking-wide text-balance text-cream uppercase">
          {title}
        </p>
      </div>
    </div>
  )
}

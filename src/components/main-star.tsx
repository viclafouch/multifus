import { Star } from 'lucide-react'
import { strings } from '@/constants/strings'

type MainStarProps = Readonly<{
  isMain: boolean
}>

export const MainStar = ({ isMain }: MainStarProps) => {
  return (
    <>
      <Star
        aria-hidden
        strokeWidth={1.75}
        data-main={isMain ? '' : undefined}
        className="size-3.5 shrink-0 text-muted-foreground/30 transition-colors duration-200 not-data-main:group-hover:text-muted-foreground/70 not-data-main:group-hover/button:text-muted-foreground/70 data-main:main-lit data-main:fill-current data-main:text-primary"
      />
      {isMain ? (
        <span className="sr-only">{strings.characters.mainMark}</span>
      ) : null}
    </>
  )
}

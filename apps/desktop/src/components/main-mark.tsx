import { t } from '@lingui/core/macro'
import { cn } from '@/lib/utils'

const STAR_PATH =
  'M12 2.4 L14.59 9.44 L22.08 9.72 L16.18 14.36 L18.23 21.58 L12 17.4 L5.77 21.58 L7.82 14.36 L1.92 9.72 L9.41 9.44 Z'

type MainMarkProps = Readonly<{
  isMain: boolean
  className?: string
}>

export const MainMark = ({ isMain, className }: MainMarkProps) => {
  return (
    <>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        data-main={isMain ? '' : undefined}
        className={cn(
          'star shrink-0 not-data-main:group-hover/button:stroke-khaki/70',
          className
        )}
      >
        <path d={STAR_PATH} />
      </svg>
      {isMain ? (
        <span className="sr-only">{t`Personnage principal`}</span>
      ) : null}
    </>
  )
}

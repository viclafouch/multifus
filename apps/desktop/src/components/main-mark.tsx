import { t } from '@lingui/core/macro'
import { cn } from '@/lib/utils'

type MainMarkProps = Readonly<{
  isMain: boolean
  className?: string
}>

export const MainMark = ({ isMain, className }: MainMarkProps) => {
  return (
    <>
      <span
        aria-hidden
        data-main={isMain ? '' : undefined}
        className={cn(
          'size-2.5 shrink-0 rotate-45 border border-khaki/35 transition-colors duration-200 not-data-main:group-hover/button:border-khaki/70 data-main:main-lit data-main:border-cream data-main:bg-cream',
          className
        )}
      />
      {isMain ? (
        <span className="sr-only">{t`Personnage principal`}</span>
      ) : null}
    </>
  )
}

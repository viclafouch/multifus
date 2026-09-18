import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { PageId } from '@/@types/page'
import { Glint } from '@/components/glint'
import { PAGE_PORTRAITS, PORTRAIT_SIDE } from '@/constants/portraits'
import { PAGE_TINTS } from '@/constants/tints'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type BlazonProps = Readonly<{
  page: PageId
}>

export const Blazon = ({ page }: BlazonProps) => {
  const { i18n } = useLingui()
  const portrait = PAGE_PORTRAITS[page]

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3.5 text-center',
        PAGE_TINTS[page]
      )}
    >
      {portrait === null ? null : (
        <img
          src={portrait}
          alt=""
          width={PORTRAIT_SIDE}
          height={PORTRAIT_SIDE}
          decoding="async"
          className="cameo surface-1 mb-1.5 size-18 sm:size-22"
        />
      )}
      <h1 className="carved limelight surface-2 text-blazon">
        {i18n._(PAGE_NAMES[page])}
      </h1>
      <Glint className="surface-3" />
      <p className="engraved surface-4 max-w-lead text-herald text-balance text-cream">
        {i18n._(PAGE_PROMISES[page])}
      </p>
    </div>
  )
}

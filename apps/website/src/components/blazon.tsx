import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { Glint } from '@/components/glint'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type BlazonProps = Readonly<{
  page: PageId
}>

export const Blazon = ({ page }: BlazonProps) => {
  const { i18n } = useLingui()

  return (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <h1 className="carved limelight surface-1 text-blazon">
        {i18n._(PAGE_NAMES[page])}
      </h1>
      <Glint className="surface-2" />
      <p className="engraved surface-3 max-w-lead text-herald text-balance text-cream">
        {i18n._(PAGE_PROMISES[page])}
      </p>
    </div>
  )
}

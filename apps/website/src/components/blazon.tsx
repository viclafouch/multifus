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
    <div className="scrim flex flex-col gap-3.5 p-6 sm:absolute sm:inset-x-0 sm:bottom-0 sm:p-10">
      <h1 className="carved limelight text-blazon">
        {i18n._(PAGE_NAMES[page])}
      </h1>
      <Glint />
      <p className="engraved max-w-lead text-herald text-cream">
        {i18n._(PAGE_PROMISES[page])}
      </p>
    </div>
  )
}

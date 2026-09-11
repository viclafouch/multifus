import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { Glint } from '@/components/glint'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type PageHeadProps = Readonly<{
  page: PageId
}>

export const PageHead = ({ page }: PageHeadProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <h1 className="surface-1 font-carve text-banner tracking-hero text-cream uppercase">
        {i18n._(PAGE_NAMES[page])}
      </h1>
      <p className="surface-2 engraved max-w-lead text-herald text-balance text-cream">
        {i18n._(PAGE_PROMISES[page])}
      </p>
      <Glint className="surface-3" />
    </>
  )
}

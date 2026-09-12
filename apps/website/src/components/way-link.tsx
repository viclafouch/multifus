import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'

type WayLinkProps = Readonly<{
  page: PageId
}>

export const WayLink = ({ page }: WayLinkProps) => {
  const { i18n } = useLingui()

  return (
    <PageLink
      page={page}
      isBare
      className="btn-way sighted flex flex-col gap-1 rounded-md py-4 pr-4 pl-8"
    >
      <span className="wayname block font-carve text-action tracking-wide uppercase">
        {i18n._(PAGE_NAMES[page])}
      </span>
      <span className="wayname block text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </PageLink>
  )
}

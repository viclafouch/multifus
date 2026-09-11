import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type WayLinkProps = Readonly<{
  page: PageId
}>

export const WayLink = ({ page }: WayLinkProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <a
      href={pathOf({ page, language })}
      className="btn-way sighted flex flex-col gap-1 rounded-md py-4 pr-4 pl-8"
    >
      <span className="wayname block font-carve text-action tracking-wide uppercase">
        {i18n._(PAGE_NAMES[page])}
      </span>
      <span className="wayname block text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </a>
  )
}

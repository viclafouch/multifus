import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type PageCardProps = Readonly<{
  page: PageId
}>

export const PageCard = ({ page }: PageCardProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <a
      href={pathOf({ page, language })}
      className="plate sighted flex h-full flex-col gap-2 p-5 transition-colors hover:border-khaki"
    >
      <span className="font-carve text-action tracking-wide text-cream uppercase">
        {i18n._(PAGE_NAMES[page])}
      </span>
      <span className="text-tale text-band">{i18n._(PAGE_PROMISES[page])}</span>
    </a>
  )
}

import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type MastLinkProps = Readonly<{
  page: PageId
  current: PageId
}>

export const MastLink = ({ page, current }: MastLinkProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <a
      href={pathOf({ page, language })}
      aria-current={page === current ? 'page' : undefined}
      className="tab sighted text-deed"
    >
      {i18n._(PAGE_NAMES[page])}
    </a>
  )
}

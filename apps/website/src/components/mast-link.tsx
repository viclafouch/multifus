import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

type MastLinkProps = Readonly<{
  page: PageId
}>

export const MastLink = ({ page }: MastLinkProps) => {
  const { i18n } = useLingui()

  return (
    <PageLink page={page} isBare className="tab sighted text-deed">
      {i18n._(PAGE_NAMES[page])}
    </PageLink>
  )
}

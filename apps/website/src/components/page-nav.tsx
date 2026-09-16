import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { NavGroup } from '@/components/nav-group'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

type PageNavProps = Readonly<{
  title: MessageDescriptor
  pages: readonly PageId[]
  onGo?: () => void
}>

export const PageNav = ({ title, pages, onGo }: PageNavProps) => {
  const { i18n } = useLingui()

  return (
    <NavGroup title={title}>
      {pages.map((page) => {
        return (
          <li key={page}>
            <PageLink
              page={page}
              isBare
              onClick={onGo}
              className="stud sighted"
            >
              {i18n._(PAGE_NAMES[page])}
            </PageLink>
          </li>
        )
      })}
    </NavGroup>
  )
}

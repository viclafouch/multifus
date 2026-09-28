import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import type { Signpost } from '@/@types/signpost'
import { NavGroup } from '@/components/nav-group'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

type PageNavProps = Readonly<{
  title: MessageDescriptor
  pages: readonly PageId[]
  links?: readonly Pick<Signpost, 'href' | 'name'>[]
  onGo?: () => void
}>

export const PageNav = ({ title, pages, links, onGo }: PageNavProps) => {
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
      {links?.map(({ href, name }) => {
        return (
          <li key={href}>
            <OutLink href={href} isBare onClick={onGo} className="stud sighted">
              {i18n._(name)}
            </OutLink>
          </li>
        )
      })}
    </NavGroup>
  )
}

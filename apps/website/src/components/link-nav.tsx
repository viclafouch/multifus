import { useLingui } from '@lingui/react'
import type { Signpost } from '@/@types/signpost'
import { NavGroup } from '@/components/nav-group'
import { OutLink } from '@/components/out-link'
import { ELSEWHERE_TITLE } from '@/constants/wording'

type LinkNavProps = Readonly<{
  links: readonly Signpost[]
  onGo?: () => void
}>

export const LinkNav = ({ links, onGo }: LinkNavProps) => {
  const { i18n } = useLingui()

  return (
    <NavGroup title={ELSEWHERE_TITLE}>
      {links.map(({ href, name, Mark }) => {
        return (
          <li key={href}>
            <OutLink href={href} isBare onClick={onGo} className="stud sighted">
              <Mark
                weight="fill"
                aria-hidden
                className="size-4 shrink-0 text-khaki"
              />
              {i18n._(name)}
            </OutLink>
          </li>
        )
      })}
    </NavGroup>
  )
}

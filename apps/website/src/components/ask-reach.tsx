import { useLingui } from '@lingui/react'
import { LifebuoyIcon } from '@phosphor-icons/react/dist/ssr/Lifebuoy'
import { MarkPlate } from '@/components/mark-plate'
import { OutLink } from '@/components/out-link'
import { HELP_LINKS } from '@/constants/elsewhere'
import { REACH_LEAD, REACH_TITLE } from '@/constants/wording'

export const AskReach = () => {
  const { i18n } = useLingui()

  return (
    <MarkPlate
      Mark={LifebuoyIcon}
      title={i18n._(REACH_TITLE)}
      lead={i18n._(REACH_LEAD)}
    >
      <ul className="flex flex-wrap gap-x-7 gap-y-2 pt-1">
        {HELP_LINKS.map(({ href, name, Mark }) => {
          return (
            <li key={href}>
              <OutLink href={href} className="text-deed">
                <Mark weight="fill" aria-hidden className="size-4 shrink-0" />
                {i18n._(name)}
              </OutLink>
            </li>
          )
        })}
      </ul>
    </MarkPlate>
  )
}

import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { Icon } from '@phosphor-icons/react'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { QuestionIcon } from '@phosphor-icons/react/dist/ssr/Question'
import { ScalesIcon } from '@phosphor-icons/react/dist/ssr/Scales'
import { WindowsLogoIcon } from '@phosphor-icons/react/dist/ssr/WindowsLogo'
import type { PageId } from '@/@types/page'
import {
  HINGE_ENTRY,
  HINGE_NAME,
  HINGE_PANEL,
  HingeTab
} from '@/components/mast-hinge'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { HELP_LINKS } from '@/constants/elsewhere'
import { HELP_PAGES } from '@/constants/pages'
import { HELP_TAB, PAGE_NAMES } from '@/constants/wording'
import { useHinge } from '@/hooks/use-hinge'

const HELP_MARKS = {
  faq: QuestionIcon,
  windows: WindowsLogoIcon,
  mac: AppleLogoIcon,
  ankama: ScalesIcon
} as const satisfies Record<(typeof HELP_PAGES)[number], Icon>

const ENTRY_LOOK = cn('sighted transition-colors', HINGE_ENTRY, HINGE_NAME)

const MARK_LOOK = 'size-5 shrink-0 text-khaki'

type HelpMenuProps = Readonly<{
  page: PageId
}>

export const HelpMenu = ({ page }: HelpMenuProps) => {
  const { i18n } = useLingui()
  const { hinge, close } = useHinge()
  const isHere = HELP_PAGES.some((entry) => {
    return entry === page
  })

  return (
    <details ref={hinge} className="hinge relative hidden flex-col lg:flex">
      <HingeTab label={HELP_TAB} isHere={isHere} />
      <ul className={cn(HINGE_PANEL, 'flex w-72 flex-col')}>
        {HELP_PAGES.map((entry) => {
          const Mark = HELP_MARKS[entry]

          return (
            <li key={entry}>
              <PageLink
                page={entry}
                isBare
                onClick={close}
                className={ENTRY_LOOK}
              >
                <Mark weight="fill" aria-hidden className={MARK_LOOK} />
                {i18n._(PAGE_NAMES[entry])}
              </PageLink>
            </li>
          )
        })}
        <li aria-hidden className="rule mx-3 my-1.5 border-t" />
        {HELP_LINKS.map(({ href, name, Mark }) => {
          return (
            <li key={href}>
              <OutLink
                href={href}
                isBare
                onClick={close}
                className={ENTRY_LOOK}
              >
                <Mark weight="fill" aria-hidden className={MARK_LOOK} />
                {i18n._(name)}
              </OutLink>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

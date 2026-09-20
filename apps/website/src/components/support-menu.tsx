import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { Icon } from '@phosphor-icons/react'
import { AppleLogoIcon } from '@phosphor-icons/react/dist/ssr/AppleLogo'
import { WindowsLogoIcon } from '@phosphor-icons/react/dist/ssr/WindowsLogo'
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr/XLogo'
import type { PageId } from '@/@types/page'
import {
  HINGE_ENTRY,
  HINGE_NAME,
  HINGE_PANEL,
  HingeTab
} from '@/components/mast-hinge'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { AUTHOR } from '@/constants/site'
import { CONTACT_AUTHOR, PAGE_NAMES, SUPPORT_TAB } from '@/constants/wording'
import { useHinge } from '@/hooks/use-hinge'

type SupportEntry = Readonly<{
  page: PageId
  Mark: Icon
}>

const SUPPORT_ENTRIES = [
  { page: 'windows', Mark: WindowsLogoIcon },
  { page: 'mac', Mark: AppleLogoIcon }
] as const satisfies readonly SupportEntry[]

const ENTRY_LOOK = cn('sighted transition-colors', HINGE_ENTRY, HINGE_NAME)

const MARK_LOOK = 'size-5 shrink-0 text-khaki'

type SupportMenuProps = Readonly<{
  page: PageId
}>

export const SupportMenu = ({ page }: SupportMenuProps) => {
  const { i18n } = useLingui()
  const { hinge, close } = useHinge()
  const isHere = SUPPORT_ENTRIES.some((entry) => {
    return entry.page === page
  })

  return (
    <details ref={hinge} className="hinge relative hidden flex-col lg:flex">
      <HingeTab label={SUPPORT_TAB} isHere={isHere} />
      <ul className={cn(HINGE_PANEL, 'flex w-64 flex-col')}>
        <li>
          <OutLink href={AUTHOR} isBare onClick={close} className={ENTRY_LOOK}>
            <XLogoIcon weight="fill" aria-hidden className={MARK_LOOK} />
            {i18n._(CONTACT_AUTHOR)}
          </OutLink>
        </li>
        {SUPPORT_ENTRIES.map(({ page: entry, Mark }) => {
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
      </ul>
    </details>
  )
}

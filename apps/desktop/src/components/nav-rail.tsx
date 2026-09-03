import { i18n } from '@lingui/core'
import { plural } from '@lingui/core/macro'
import type { Language } from '@/@types/language'
import type { Character } from '@/@types/roster'
import type { ScreenName } from '@/@types/snapshot'
import type { Authorization } from '@/@types/system'
import { Lamp } from '@/components/lamp'
import { LanguagePicker } from '@/components/language-picker'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/constants/navigation'
import { NAV_ITEMS } from '@/constants/navigation'
import { authorizationLine } from '@/helpers/wording'

type NavRailProps = Readonly<{
  current: ScreenName
  characters: readonly Character[]
  authorization: Authorization
  version: string
  language: Language
  onNavigate: (screen: ScreenName) => void
}>

export const NavRail = ({
  current,
  characters,
  authorization,
  version,
  language,
  onNavigate
}: NavRailProps) => {
  const connected = characters.filter((character) => {
    return character.online
  }).length

  return (
    <nav className="flex w-rail min-h-0 shrink-0 flex-col border-r border-border bg-sidebar/70">
      <div className="flex shrink-0 flex-col gap-2 px-5 pt-6 pb-6">
        <p className="flex items-baseline gap-2 font-display text-wordmark font-semibold tracking-title">
          <span className="size-1 shrink-0 -translate-y-1 rounded-full bg-primary" />
          Multifus
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-micro tracking-micro text-muted-foreground/70">
            v{version}
          </p>
          <LanguagePicker current={language} />
        </div>
      </div>
      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map(({ name, label, Icon }) => {
          return (
            <li key={name}>
              <NavButton
                item={{ name, label, Icon }}
                isCurrent={name === current}
                onNavigate={onNavigate}
              />
            </li>
          )
        })}
      </ul>
      <div className="m-3 flex shrink-0 flex-col gap-1.5 rounded-lg border border-border/80 bg-background/40 px-3 py-2.5">
        <p className="flex items-center gap-2 text-note">
          <Lamp state={connected > 0 ? 'live' : 'offline'} />
          <span className="text-foreground/85">
            {plural(connected, {
              one: '# personnage connecté',
              other: '# personnages connectés'
            })}
          </span>
        </p>
        <p className="pl-4 text-mini text-muted-foreground/80">
          {authorizationLine(authorization)}
        </p>
      </div>
    </nav>
  )
}

type NavButtonProps = Readonly<{
  item: NavItem
  isCurrent: boolean
  onNavigate: (screen: ScreenName) => void
}>

const NavButton = ({ item, isCurrent, onNavigate }: NavButtonProps) => {
  const { name, label, Icon } = item

  return (
    <Button
      variant="ghost"
      aria-current={isCurrent ? 'page' : undefined}
      onClick={() => {
        onNavigate(name)
      }}
      className="relative h-9 w-full justify-start gap-2.5 px-2.5 text-row font-normal text-muted-foreground aria-[current=page]:bg-accent/70 aria-[current=page]:font-medium aria-[current=page]:text-accent-foreground"
    >
      <span
        aria-hidden
        data-active={isCurrent ? '' : undefined}
        className="absolute top-1/2 left-0 h-0 w-0.5 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-200 data-active:h-4 data-active:opacity-100"
      />
      <Icon className="size-glyph shrink-0" strokeWidth={1.75} />
      {i18n._(label)}
    </Button>
  )
}

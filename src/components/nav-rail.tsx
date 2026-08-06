import type { Character } from '@/@types/roster'
import type { ScreenName } from '@/@types/snapshot'
import type { Authorization } from '@/@types/system'
import { Lamp } from '@/components/lamp'
import { Button } from '@/components/ui/button'
import type { NavItem } from '@/constants/navigation'
import { NAV_ITEMS } from '@/constants/navigation'
import { strings } from '@/constants/strings'
import { authorizationLine } from '@/helpers/wording'

type NavRailProps = Readonly<{
  current: ScreenName
  characters: readonly Character[]
  authorization: Authorization
  version: string
  onNavigate: (screen: ScreenName) => void
}>

/**
 * The left rail: where one is, and how multifus is doing.
 *
 * The status block at the bottom is the reason this rail is not a row of tabs.
 * multifus is meant to be launched and forgotten, so the two facts that say
 * whether it is working at all have to be on screen whatever screen one is on.
 */
export const NavRail = ({
  current,
  characters,
  authorization,
  version,
  onNavigate
}: NavRailProps) => {
  const connected = characters.filter((character) => {
    return character.online
  }).length

  return (
    <nav className="flex w-rail shrink-0 flex-col border-r border-border bg-sidebar/70">
      <div className="flex flex-col gap-2 px-5 pt-6 pb-7">
        <p className="flex items-baseline gap-2 font-display text-wordmark font-semibold tracking-title">
          <span className="size-1 shrink-0 -translate-y-1 rounded-full bg-primary" />
          {strings.app.name}
        </p>
        <p className="font-mono text-micro tracking-micro text-muted-foreground/70">
          v{version}
        </p>
      </div>
      <ul className="flex flex-1 flex-col gap-0.5 px-3">
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
      <div className="m-3 flex flex-col gap-1.5 rounded-lg border border-border/80 bg-background/40 px-3 py-2.5">
        <p className="flex items-center gap-2 text-note">
          <Lamp isOnline={connected > 0} isAsleep={false} />
          <span className="text-foreground/85">
            {strings.status.connected(connected)}
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
      {label}
    </Button>
  )
}

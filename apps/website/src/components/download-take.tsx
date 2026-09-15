import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import type { SystemId } from '@/@types/system'
import { OutLink } from '@/components/out-link'
import { SystemPick } from '@/components/system-pick'
import { PAST_RELEASES, RELEASES } from '@/constants/site'
import { SYSTEM_FLOORS, SYSTEM_PACKAGES } from '@/constants/systems'

const PAST_TAKE = msg`Télécharger une version antérieure`

type DownloadTakeProps = Readonly<{
  shown: SystemId
  onPick: (system: SystemId) => void
}>

export const DownloadTake = ({ shown, onPick }: DownloadTakeProps) => {
  const { i18n } = useLingui()
  const takes = __RELEASE_LINKS__ ?? { macos: RELEASES, windows: RELEASES }

  return (
    <div className="flex flex-col items-start gap-5">
      <SystemPick shown={shown} onPick={onPick} />
      <div className="flex flex-col items-start gap-3">
        <Button
          variant="leaf"
          size="lead"
          nativeButton={false}
          className="h-auto max-w-full py-3 text-center whitespace-normal"
          render={
            /* oxlint-disable-next-line control-has-associated-label -- Base UI puts the children of the Button in this link, which the rule reads as empty */
            <a className="sighted" href={takes[shown]} />
          }
        >
          <DownloadSimpleIcon weight="bold" aria-hidden />
          {i18n._(SYSTEM_PACKAGES[shown])}
        </Button>
        <p className="engraved text-aside text-khaki">
          {i18n._(SYSTEM_FLOORS[shown])}
        </p>
      </div>
      <p className="text-aside">
        <OutLink href={PAST_RELEASES}>{i18n._(PAST_TAKE)}</OutLink>
      </p>
    </div>
  )
}

import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { OutLink } from '@/components/out-link'
import { RELEASES } from '@/constants/site'
import {
  SYSTEM_ELSEWHERE,
  SYSTEM_FLOORS,
  SYSTEM_OTHERS,
  SYSTEM_PACKAGES
} from '@/constants/systems'
import { useSystem } from '@/hooks/use-system'

export const DownloadTake = () => {
  const { i18n } = useLingui()
  const shown = useSystem()
  const other = SYSTEM_OTHERS[shown]

  return (
    <div className="flex flex-col items-start gap-5">
      <div className="flex flex-col items-start gap-3">
        <Button
          variant="leaf"
          size="lead"
          nativeButton={false}
          className="h-auto max-w-full py-3 text-center whitespace-normal"
          render={
            /* oxlint-disable-next-line anchor-has-content, control-has-associated-label -- Base UI pose les enfants du Button dans ce lien, que les deux règles lisent vide */
            <a className="sighted" href={RELEASES} />
          }
        >
          {i18n._(SYSTEM_PACKAGES[shown])}
        </Button>
        <p className="text-aside text-band">{i18n._(SYSTEM_FLOORS[shown])}</p>
      </div>
      <p className="text-tale">
        <OutLink href={RELEASES}>{i18n._(SYSTEM_ELSEWHERE[other])}</OutLink>
      </p>
    </div>
  )
}

import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { RELEASES } from '@/constants/site'
import { SYSTEM_FLOORS, SYSTEM_IDS, SYSTEM_PACKAGES } from '@/constants/systems'

export const DownloadPair = () => {
  const { i18n } = useLingui()

  return (
    <ul className="flex w-full flex-col gap-8 sm:flex-row sm:gap-6">
      {SYSTEM_IDS.map((system) => {
        return (
          <li key={system} className="flex flex-1 flex-col items-start gap-3">
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
              {i18n._(SYSTEM_PACKAGES[system])}
            </Button>
            <p className="text-aside text-band">
              {i18n._(SYSTEM_FLOORS[system])}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

import { t } from '@lingui/core/macro'
import type { Page } from '@/@types/onboarding'
import { PAGE_SCENES } from '@/constants/onboarding'

type SceneProps = Readonly<{
  page: Page
}>

export const Scene = ({ page }: SceneProps) => {
  return (
    <div aria-hidden className="grove pointer-events-none absolute inset-0">
      {Object.entries(PAGE_SCENES).map(([name, source]) => {
        return (
          <img
            key={name}
            src={source}
            alt=""
            data-here={name === page ? '' : undefined}
            className="drift absolute inset-0 size-full object-cover"
          />
        )
      })}
      <div className="grove-shade absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  )
}

export const SceneCredit = () => {
  return (
    <p className="text-center text-credit text-khaki/40">
      {t`Décor © Ankama Games. Multifus n’est pas un logiciel d’Ankama.`}
    </p>
  )
}

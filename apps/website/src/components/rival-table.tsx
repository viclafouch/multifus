import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { MarkGlyph } from '@/components/mark-glyph'
import { OutLink } from '@/components/out-link'
import {
  RIVAL_IDS,
  RIVALS,
  SURVEYED_ON,
  TRAIT_IDS,
  TRAIT_NAMES,
  TRAITS
} from '@/constants/rivals'
import { formatDate } from '@/helpers/day'

const TRAIT_COLUMN = msg`Ce qu’il fait`

const SURVEY_ANCHOR = 'releve'

export const RivalTable = () => {
  const { i18n } = useLingui()
  const surveyed = formatDate({ day: SURVEYED_ON, locale: i18n.locale })

  return (
    <div className="flex flex-col gap-3">
      <div className="plate overflow-x-auto">
        <table
          aria-describedby={SURVEY_ANCHOR}
          className="w-full min-w-lintel border-collapse text-left"
        >
          <thead>
            <tr className="rule border-b">
              <th
                scope="col"
                className="sticky left-0 bg-background px-4 py-4 text-aside font-normal text-band"
              >
                {i18n._(TRAIT_COLUMN)}
              </th>
              <th
                scope="col"
                className="px-3 py-4 text-center font-carve text-bar tracking-wide text-cream uppercase"
              >
                Multifus
              </th>
              {RIVAL_IDS.map((rival) => {
                const { name, code } = RIVALS[rival]

                return (
                  <th
                    key={rival}
                    scope="col"
                    className="px-3 py-4 text-center text-aside font-normal text-band"
                  >
                    <OutLink href={code}>{name}</OutLink>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {TRAIT_IDS.map((trait) => {
              return (
                <tr key={trait} className="rule border-b last:border-b-0">
                  <th
                    scope="row"
                    className="sticky left-0 bg-background px-4 py-3 text-tale font-normal text-cream"
                  >
                    {i18n._(TRAIT_NAMES[trait])}
                  </th>
                  <td className="px-3 py-3">
                    <MarkGlyph mark={TRAITS[trait].mine} />
                  </td>
                  {RIVAL_IDS.map((rival) => {
                    return (
                      <td key={rival} className="px-3 py-3">
                        <MarkGlyph mark={TRAITS[trait].theirs[rival]} />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p id={SURVEY_ANCHOR} className="text-aside text-band">
        {i18n._(msg`Relevé le ${{ surveyed }}, dans le code de chaque outil.`)}
      </p>
    </div>
  )
}

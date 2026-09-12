import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import type { Mark, RivalId, TraitId } from '@/@types/rival'
import { MarkGlyph } from '@/components/mark-glyph'
import { MarkTip } from '@/components/mark-tip'
import { OutLink } from '@/components/out-link'
import {
  HALF_NOTES,
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

const HALF_ANCHOR = 'moitie'

const NAME_CELL = 'rule sticky left-0 border-r bg-iron px-4 py-3.5'

export const RivalTable = () => {
  const { i18n } = useLingui()
  const surveyed = formatDate({ day: SURVEYED_ON, locale: i18n.locale })

  return (
    <div className="flex flex-col gap-5">
      <div className="glass ledger overflow-x-auto">
        <table
          aria-describedby={SURVEY_ANCHOR}
          className="w-full min-w-lintel border-collapse text-left"
        >
          <thead>
            <tr className="rule border-b">
              <th
                scope="col"
                className={cn(NAME_CELL, 'text-aside font-normal text-band')}
              >
                {i18n._(TRAIT_COLUMN)}
              </th>
              <th
                scope="col"
                className="mine px-3 py-3.5 text-center font-carve text-bar tracking-wide text-leaf-lit uppercase"
              >
                Multifus
              </th>
              {RIVAL_IDS.map((rival) => {
                const { name, code } = RIVALS[rival]

                return (
                  <th
                    key={rival}
                    scope="col"
                    className="px-3 py-3.5 text-center text-aside font-normal text-band"
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
                    className={cn(
                      NAME_CELL,
                      'text-tale font-normal text-cream'
                    )}
                  >
                    {i18n._(TRAIT_NAMES[trait])}
                  </th>
                  <td className="mine px-3 py-3">
                    <MarkGlyph mark={TRAITS[trait].mine} />
                  </td>
                  {RIVAL_IDS.map((rival) => {
                    return (
                      <td key={rival} className="px-3 py-3">
                        <MarkCell
                          mark={TRAITS[trait].theirs[rival]}
                          trait={trait}
                          rival={rival}
                        />
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

type MarkCellProps = Readonly<{
  mark: Mark
  trait: TraitId
  rival: RivalId
}>

const MarkCell = ({ mark, trait, rival }: MarkCellProps) => {
  const { i18n } = useLingui()
  const note = HALF_NOTES.find((half) => {
    return half.trait === trait && half.rival === rival
  })

  if (note === undefined) {
    return <MarkGlyph mark={mark} />
  }

  return (
    <MarkTip
      mark={mark}
      line={i18n._(note.line)}
      anchor={`${HALF_ANCHOR}-${trait}-${rival}`}
    />
  )
}

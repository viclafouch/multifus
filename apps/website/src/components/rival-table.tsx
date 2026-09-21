import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn, Flag } from '@multifus/retro'
import type { Mark, RivalId, TraitId } from '@/@types/rival'
import { MarkGlyph } from '@/components/mark-glyph'
import { MarkTip } from '@/components/mark-tip'
import { OutLink } from '@/components/out-link'
import { LANGUAGES } from '@/constants/languages'
import {
  HALF_NOTES,
  MINE_NOTES,
  PEEK_TRAITS,
  RIVAL_IDS,
  RIVALS,
  SURVEYED_ON,
  TRAIT_IDS,
  TRAIT_NAMES,
  TRAITS
} from '@/constants/rivals'
import { formatDate } from '@/helpers/day'

const TRAIT_COLUMN = msg`Ce que fait l’outil`

const SURVEY_ANCHOR = 'releve'

const HALF_ANCHOR = 'moitie'

const MINE_ANCHOR = 'choix'

const NAME_CELL =
  'rule sticky left-0 z-1 w-44 border-r bg-iron px-4 py-3.5 sm:w-auto'

type RivalTableProps = Readonly<{
  isPeek?: boolean
}>

export const RivalTable = ({ isPeek = false }: RivalTableProps) => {
  const { i18n } = useLingui()
  const surveyed = formatDate({ day: SURVEYED_ON, locale: i18n.locale })
  const traits = isPeek ? PEEK_TRAITS : TRAIT_IDS

  const ledger = (
    <div className="relative">
      <div className="glass ledger overflow-x-auto overscroll-x-none">
        <table
          aria-describedby={isPeek ? undefined : SURVEY_ANCHOR}
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
                    className="px-3 py-3.5 text-center text-aside font-normal whitespace-nowrap text-band"
                  >
                    <OutLink href={code}>{name}</OutLink>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {traits.map((trait) => {
              return (
                <tr key={trait} className="rule border-b last:border-b-0">
                  <th
                    scope="row"
                    className={cn(
                      NAME_CELL,
                      'text-tale font-normal text-cream'
                    )}
                  >
                    <TraitLabel trait={trait} />
                  </th>
                  <td className="mine px-3 py-3">
                    {isPeek ? (
                      <MarkGlyph mark={TRAITS[trait].mine} />
                    ) : (
                      <MineCell mark={TRAITS[trait].mine} trait={trait} />
                    )}
                  </td>
                  {RIVAL_IDS.map((rival) => {
                    return (
                      <td key={rival} className="px-3 py-3">
                        {isPeek ? (
                          <MarkGlyph mark={TRAITS[trait].theirs[rival]} />
                        ) : (
                          <MarkCell
                            mark={TRAITS[trait].theirs[rival]}
                            trait={trait}
                            rival={rival}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <span aria-hidden className="brink lg:hidden" />
      {isPeek ? <span aria-hidden className="shroud" /> : null}
    </div>
  )

  if (isPeek) {
    return ledger
  }

  return (
    <div className="flex flex-col gap-5">
      {ledger}
      <p id={SURVEY_ANCHOR} className="text-aside text-band">
        {i18n._(msg`Relevé le ${{ surveyed }}, dans le code de chaque outil.`)}
      </p>
    </div>
  )
}

type TraitLabelProps = Readonly<{
  trait: TraitId
}>

const TraitLabel = ({ trait }: TraitLabelProps) => {
  const { i18n } = useLingui()
  const name = i18n._(TRAIT_NAMES[trait])

  if (trait !== 'tongues') {
    return name
  }

  return (
    <>
      <span className="sr-only">{name}</span>
      <span aria-hidden className="flex items-center gap-1.5">
        {LANGUAGES.map((language) => {
          return (
            <span
              key={language}
              className="h-4 w-6 overflow-clip rounded-xs border border-band/45"
            >
              <Flag language={language} />
            </span>
          )
        })}
      </span>
    </>
  )
}

type MineCellProps = Readonly<{
  mark: Mark
  trait: TraitId
}>

const MineCell = ({ mark, trait }: MineCellProps) => {
  const { i18n } = useLingui()
  const note = MINE_NOTES.find((mine) => {
    return mine.trait === trait
  })

  if (note === undefined) {
    return <MarkGlyph mark={mark} />
  }

  return (
    <MarkTip
      mark={mark}
      line={i18n._(note.line)}
      anchor={`${MINE_ANCHOR}-${trait}`}
    />
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

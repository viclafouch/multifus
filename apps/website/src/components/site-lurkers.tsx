import React from 'react'
import type { PageId } from '@/@types/page'
import { MONSTER_RISE, MONSTER_SPAN } from '@/constants/monsters'
import { hauntsOf } from '@/lib/haunts'

type HauntGeometry = React.CSSProperties &
  Readonly<Record<'--haunt-span' | '--haunt-rise', number>>

type LurkerGeometry = React.CSSProperties &
  Readonly<
    Record<
      | '--lurker-span'
      | '--lurker-rise'
      | '--lurker-foot-span'
      | '--lurker-foot-rise',
      string
    >
  > &
  Readonly<Record<'--lurker-scale', number>>

type SiteLurkersProps = Readonly<{
  page: PageId
}>

export const SiteLurkers = ({ page }: SiteLurkersProps) => {
  return (
    <>
      {hauntsOf(page).map(({ span, rise, way, monster }) => {
        const ground: HauntGeometry = {
          '--haunt-span': span,
          '--haunt-rise': rise
        }
        const stance: LurkerGeometry = {
          '--lurker-span': `${MONSTER_SPAN}px`,
          '--lurker-rise': `${MONSTER_RISE}px`,
          '--lurker-foot-span': `${monster.footSpan}px`,
          '--lurker-foot-rise': `${monster.footRise}px`,
          '--lurker-scale': monster.scale
        }

        return (
          <div
            key={monster.src}
            className={way === 'east' ? 'haunt haunt-east' : 'haunt haunt-west'}
            style={ground}
          >
            <img
              src={monster.src}
              alt=""
              width={MONSTER_SPAN}
              height={MONSTER_RISE}
              loading="lazy"
              className="lurker"
              style={stance}
            />
          </div>
        )
      })}
    </>
  )
}

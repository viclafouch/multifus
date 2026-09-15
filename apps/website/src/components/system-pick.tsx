import React from 'react'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { SystemId } from '@/@types/system'
import { SYSTEM_IDS, SYSTEM_NAMES } from '@/constants/systems'

const PICK_LABEL = msg`Votre ordinateur`

type PickGeometry = React.CSSProperties &
  Readonly<Record<'--pick-count' | '--pick-at', number>>

type SystemPickProps = Readonly<{
  shown: SystemId
  onPick: (system: SystemId) => void
}>

export const SystemPick = ({ shown, onPick }: SystemPickProps) => {
  const { i18n } = useLingui()
  const geometry: PickGeometry = {
    '--pick-count': SYSTEM_IDS.length,
    '--pick-at': SYSTEM_IDS.indexOf(shown)
  }

  return (
    <div
      role="group"
      aria-label={i18n._(PICK_LABEL)}
      style={geometry}
      className="pick"
    >
      {SYSTEM_IDS.map((system) => {
        const handleClick = () => {
          onPick(system)
        }

        return (
          <button
            key={system}
            type="button"
            aria-pressed={system === shown}
            onClick={handleClick}
            className="picked sighted"
          >
            {SYSTEM_NAMES[system]}
          </button>
        )
      })}
    </div>
  )
}

import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'

const HOLD = msg`Pause`

const PLAY = msg`Lire`

type LoopSwitchProps = Readonly<{
  isPlaying: boolean
  onToggle: () => void
}>

export const LoopSwitch = ({ isPlaying, onToggle }: LoopSwitchProps) => {
  const { i18n } = useLingui()

  return (
    <button
      type="button"
      onClick={onToggle}
      className="canopy sighted absolute top-3 right-3 rounded-full px-4 py-1.5 font-carve text-legend tracking-wide text-khaki uppercase transition-colors hover:text-cream"
    >
      {i18n._(isPlaying ? HOLD : PLAY)}
    </button>
  )
}

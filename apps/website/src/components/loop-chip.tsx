import { useLingui } from '@lingui/react'
import type { LoopToggleProps } from '@/@types/page'
import { LOOP_HOLD, LOOP_PLAY } from '@/constants/wording'

export const LoopChip = ({ isPlaying, onToggle }: LoopToggleProps) => {
  const { i18n } = useLingui()

  return (
    <button
      type="button"
      onClick={onToggle}
      className="canopy sighted absolute top-3 right-3 rounded-full px-4 py-1.5 font-carve text-legend tracking-wide text-khaki uppercase transition-colors hover:text-cream"
    >
      {i18n._(isPlaying ? LOOP_HOLD : LOOP_PLAY)}
    </button>
  )
}

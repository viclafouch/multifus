import { useLingui } from '@lingui/react'
import { PauseIcon } from '@phosphor-icons/react/dist/ssr/Pause'
import { PlayIcon } from '@phosphor-icons/react/dist/ssr/Play'
import type { LoopToggleProps } from '@/@types/page'
import { LOOP_HOLD, LOOP_PLAY } from '@/constants/wording'

export const LoopCurtain = ({ isPlaying, onToggle }: LoopToggleProps) => {
  const { i18n } = useLingui()

  return (
    <button
      type="button"
      onClick={onToggle}
      data-playing={isPlaying ? '' : undefined}
      className="curtain"
    >
      <span className="beacon">
        {isPlaying ? (
          <PauseIcon weight="fill" aria-hidden />
        ) : (
          <PlayIcon weight="fill" aria-hidden />
        )}
      </span>
      <span className="engraved font-carve text-legend tracking-widest text-cream uppercase">
        {i18n._(isPlaying ? LOOP_HOLD : LOOP_PLAY)}
      </span>
    </button>
  )
}

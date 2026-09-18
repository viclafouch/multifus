import { useLingui } from '@lingui/react'
import { PauseIcon } from '@phosphor-icons/react/dist/ssr/Pause'
import { PlayIcon } from '@phosphor-icons/react/dist/ssr/Play'
import { LOOP_HOLD, LOOP_PLAY } from '@/constants/wording'
import { useIdlePointer } from '@/hooks/use-idle-pointer'

type LoopCurtainProps = Readonly<{
  isPlaying: boolean
  onToggle: () => void
}>

export const LoopCurtain = ({ isPlaying, onToggle }: LoopCurtainProps) => {
  const { i18n } = useLingui()
  const curtain = useIdlePointer(isPlaying)

  return (
    <button
      ref={curtain}
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
      <span className="engraved rubric text-cream">
        {i18n._(isPlaying ? LOOP_HOLD : LOOP_PLAY)}
      </span>
    </button>
  )
}

import { useLingui } from '@lingui/react'
import { Curtain } from '@multifus/retro'
import { PauseIcon } from '@phosphor-icons/react/dist/ssr/Pause'
import { PlayIcon } from '@phosphor-icons/react/dist/ssr/Play'
import { LOOP_HOLD, LOOP_PLAY } from '@/constants/wording'

type LoopCurtainProps = Readonly<{
  isPlaying: boolean
  onToggle: () => void
}>

export const LoopCurtain = ({ isPlaying, onToggle }: LoopCurtainProps) => {
  const { i18n } = useLingui()
  const word = i18n._(isPlaying ? LOOP_HOLD : LOOP_PLAY)

  return (
    <Curtain
      isPlaying={isPlaying}
      label={word}
      caption={<span className="engraved rubric text-cream">{word}</span>}
      onToggle={onToggle}
    >
      {isPlaying ? (
        <PauseIcon weight="fill" aria-hidden />
      ) : (
        <PlayIcon weight="fill" aria-hidden />
      )}
    </Curtain>
  )
}

import { Pause, Play } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Curtain } from '@multifus/retro'

type LoopCurtainProps = Readonly<{
  isPlaying: boolean
  onToggle: () => void
}>

export const LoopCurtain = ({ isPlaying, onToggle }: LoopCurtainProps) => {
  return (
    <Curtain
      isPlaying={isPlaying}
      label={isPlaying ? t`Mettre la vidéo en pause` : t`Lire la vidéo`}
      onToggle={onToggle}
    >
      {isPlaying ? (
        <Pause fill="currentColor" strokeWidth={0} aria-hidden />
      ) : (
        <Play fill="currentColor" strokeWidth={0} aria-hidden />
      )}
    </Curtain>
  )
}

import React from 'react'
import { Eye, X } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import { useStill } from '@/hooks/use-still'
import { FILM_MORPH } from '@/lib/morph'

type LoopPortholeProps = Readonly<{
  source: string
  caption: string
  onWatch: (from: number) => void
  onDismiss: () => void
}>

export const LoopPorthole = ({
  source,
  caption,
  onWatch,
  onDismiss
}: LoopPortholeProps) => {
  const isStill = useStill()
  const film = React.useRef<HTMLVideoElement>(null)
  const [isLeaving, setIsLeaving] = React.useState(false)
  const [duration, setDuration] = React.useState(0)

  const hasTide = !isStill && duration > 0

  const handleLeave = () => {
    if (isStill) {
      onDismiss()

      return
    }

    setIsLeaving(true)
  }

  return (
    <div
      data-leaving={isLeaving ? '' : undefined}
      className="porthole group/porthole relative ml-auto w-porthole"
      onAnimationEnd={(event) => {
        if (isLeaving && event.target === event.currentTarget) {
          onDismiss()
        }
      }}
    >
      <button
        type="button"
        aria-label={t`Voir la vidéo en grand`}
        className="sighted relative block aspect-loop w-full cursor-pointer"
        onClick={() => {
          onWatch(film.current?.currentTime ?? 0)
        }}
      >
        <video
          ref={film}
          src={source}
          aria-label={caption}
          style={{ viewTransitionName: isLeaving ? undefined : FILM_MORPH }}
          className="absolute inset-0 size-full object-cover"
          autoPlay={!isStill}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration)
          }}
          onEnded={handleLeave}
          onError={onDismiss}
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-night/20 transition-colors duration-300 group-hover/porthole:bg-night/55"
        />
        <span
          aria-hidden
          className="porthole-eye absolute top-1/2 left-1/2 grid size-9 origin-center -translate-x-1/2 -translate-y-1/2 scale-75 place-items-center rounded-full text-cream opacity-0 transition duration-300 group-hover/porthole:scale-100 group-hover/porthole:opacity-100"
        >
          <Eye className="size-4" strokeWidth={2} />
        </span>
      </button>
      <Button
        variant="slate"
        size="icon-tight"
        aria-label={t`Cacher l’aperçu`}
        className="absolute top-1.5 right-1.5 shadow-xs"
        onClick={handleLeave}
      >
        <X aria-hidden />
      </Button>
      {hasTide ? (
        <span
          aria-hidden
          style={{ animationDuration: `${duration}s` }}
          className="porthole-tide absolute inset-x-0 bottom-0 h-0.5"
        />
      ) : null}
    </div>
  )
}

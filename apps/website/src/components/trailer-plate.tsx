import React from 'react'
import { useLingui } from '@lingui/react'
import { TRAILER, TRAILER_TITLE } from '@/constants/trailer'
import { useLanguage } from '@/hooks/use-language'
import { usePageLoaded } from '@/hooks/use-page-loaded'
import { ENTRANCE_SIZES, sourcesOf } from '@/lib/media'
import { playerOf, YOUTUBE_ALLOWED } from '@/lib/youtube'

export const TrailerPlate = () => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const isPageLoaded = usePageLoaded()
  const [isReady, setIsReady] = React.useState(false)
  // YouTube shows its French thumbnail before play, whatever the page language
  const poster = TRAILER.posters[TRAILER.spoken]

  const handleReady = () => {
    setIsReady(true)
  }

  return (
    <div className="youtube-slot">
      <div className="stage carried youtube-bleed">
        <div className="youtube-screen relative">
          <img
            src={poster.full.src}
            srcSet={sourcesOf(poster)}
            sizes={ENTRANCE_SIZES}
            alt=""
            width={poster.full.width}
            height={poster.full.height}
            className="absolute inset-0 size-full object-cover"
          />
          {isPageLoaded ? (
            <iframe
              src={playerOf(TRAILER, language)}
              title={i18n._(TRAILER_TITLE)}
              allow={YOUTUBE_ALLOWED}
              allowFullScreen
              data-ready={isReady ? '' : undefined}
              className="youtube-film absolute inset-0 size-full"
              onLoad={handleReady}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

import type { Language } from '@/@types/language'
import type { Trailer } from '@/@types/page'

const YOUTUBE = 'https://www.youtube.com'

export const YOUTUBE_ALLOWED =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'

export const embedOf = (id: string) => {
  return `${YOUTUBE}/embed/${id}`
}

const captionsOf = (
  trailer: Trailer,
  language: Language
): Record<string, string> => {
  return language === trailer.spoken
    ? {}
    : { cc_load_policy: '1', cc_lang_pref: language }
}

export const playerOf = (trailer: Trailer, language: Language) => {
  const query = new URLSearchParams({
    playsinline: '1',
    rel: '0',
    color: 'white',
    hl: language,
    ...captionsOf(trailer, language)
  })

  return `${embedOf(trailer.id)}?${query}`
}

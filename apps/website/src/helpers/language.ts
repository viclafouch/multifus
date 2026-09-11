import type { Language } from '../@types/language.ts'
import { LANGUAGES, SOURCE_LANGUAGE } from '../constants/languages.ts'

export const languageOf = (pathname: string) => {
  const segment = pathname.split('/')[1]

  const found = LANGUAGES.find((language) => {
    return language === segment
  })

  return found ?? SOURCE_LANGUAGE
}

type OfferOfParams = Readonly<{
  spoken: readonly string[]
  current: Language
}>

const spokenHere = (tag: string) => {
  try {
    const { language: subtag } = new Intl.Locale(tag)

    return LANGUAGES.filter((language) => {
      return language === subtag
    })
  } catch {
    return []
  }
}

export const offerOf = ({ spoken, current }: OfferOfParams) => {
  const wanted = spoken.flatMap(spokenHere).at(0)

  if (wanted === undefined || wanted === current) {
    return null
  }

  return wanted
}

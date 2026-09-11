import { LANGUAGES, SOURCE_LANGUAGE } from '../constants/languages.ts'

export const languageOf = (pathname: string) => {
  const segment = pathname.split('/')[1]

  const found = LANGUAGES.find((language) => {
    return language === segment
  })

  return found ?? SOURCE_LANGUAGE
}

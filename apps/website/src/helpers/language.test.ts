import { describe, expect, it } from 'vitest'
import { languageOf } from '@/helpers/language'

describe('languageOf', () => {
  it('lit le français à la racine', () => {
    expect(languageOf('/')).toBe('fr')
    expect(languageOf('/roue-des-personnages')).toBe('fr')
  })

  it('lit la langue du premier segment', () => {
    expect(languageOf('/en')).toBe('en')
    expect(languageOf('/en/character-wheel')).toBe('en')
    expect(languageOf('/es/rueda-de-personajes')).toBe('es')
  })

  it('retombe sur le français devant un segment inconnu', () => {
    expect(languageOf('/de/etwas')).toBe('fr')
  })
})

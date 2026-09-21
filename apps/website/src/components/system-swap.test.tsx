import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup, screen } from '@testing-library/react'
import type { Language } from '@/@types/language'
import type { SystemId } from '@/@types/system'
import { SystemSwap } from '@/components/system-swap'
import { LANGUAGES } from '@/constants/languages'
import { SYSTEM_SHOT_ALTS, SYSTEM_SHOTS } from '@/constants/shots'
import { SYSTEM_IDS } from '@/constants/systems'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { showAt } from '@/test-router'

type ShowParams = Readonly<{
  language: Language
  shown: SystemId
  hasPicked?: boolean
}>

const show = ({ language, shown, hasPicked = true }: ShowParams) => {
  return showAt({
    at: pathOf({ page: 'download', language }),
    children: (
      <I18nProvider i18n={SPEAKERS[language]}>
        <SystemSwap shown={shown} hasPicked={hasPicked} />
      </I18nProvider>
    )
  })
}

const shotOf = (system: SystemId, language: Language = 'fr') => {
  return screen.getByAltText(SPEAKERS[language]._(SYSTEM_SHOT_ALTS[system]))
}

const layerOf = (system: SystemId) => {
  return shotOf(system).parentElement
}

const besides = (shown: SystemId) => {
  return SYSTEM_IDS.filter((system) => {
    return system !== shown
  })
}

describe('the two shots the download page swaps', () => {
  afterEach(() => {
    cleanup()
  })

  it('holds one shot per system, whichever is shown', () => {
    show({ language: 'fr', shown: 'macos' })

    for (const system of SYSTEM_IDS) {
      expect(shotOf(system)).toBeDefined()
    }
  })

  it.each(LANGUAGES)('takes the shots of the %s page', (language) => {
    show({ language, shown: 'macos' })

    for (const system of SYSTEM_IDS) {
      expect(shotOf(system, language).getAttribute('src')).toBe(
        SYSTEM_SHOTS[system][language].full.src
      )
    }
  })

  it.each(SYSTEM_IDS)('offers %s in two widths, each measured', (system) => {
    show({ language: 'fr', shown: system })

    const { full, small } = SYSTEM_SHOTS[system].fr

    expect(shotOf(system).getAttribute('srcset')).toBe(
      `${small.src} ${small.width}w, ${full.src} ${full.width}w`
    )
    expect(shotOf(system).getAttribute('sizes')).toContain('calc(100vw')
  })

  it.each(SYSTEM_IDS)('lights the shot of %s and hides the rest', (shown) => {
    show({ language: 'fr', shown })

    expect(layerOf(shown)?.className).toContain('opacity-100')
    expect(layerOf(shown)?.getAttribute('aria-hidden')).toBeNull()

    for (const system of besides(shown)) {
      expect(layerOf(system)?.className).toContain('opacity-0')
      expect(layerOf(system)?.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('leaves both shots to the priority the browser reads off the page', () => {
    show({ language: 'fr', shown: 'macos' })

    for (const system of SYSTEM_IDS) {
      expect(shotOf(system).getAttribute('fetchpriority')).toBeNull()
      expect(shotOf(system).getAttribute('loading')).toBeNull()
    }
  })

  it('fades once the reader has picked a system', () => {
    show({ language: 'fr', shown: 'windows' })

    for (const system of SYSTEM_IDS) {
      expect(layerOf(system)?.className).toContain('transition-opacity')
    }
  })

  it('swaps without a fade while the system is only detected', () => {
    show({ language: 'fr', shown: 'windows', hasPicked: false })

    for (const system of SYSTEM_IDS) {
      expect(layerOf(system)?.className).not.toContain('transition-opacity')
    }
  })
})

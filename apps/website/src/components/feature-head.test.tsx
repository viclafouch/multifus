import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider } from '@lingui/react'
import { cleanup } from '@testing-library/react'
import type { PageId } from '@/@types/page'
import { Blazon } from '@/components/blazon'
import { FeatureCard } from '@/components/feature-card'
import { MENU_FEATURES } from '@/constants/pages'
import { PAGE_PORTRAITS } from '@/constants/portraits'
import { pathOf } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { MOSAIC_SIZES } from '@/lib/media'
import { showAt } from '@/test-router'

const show = (children: React.ReactNode) => {
  const { container } = showAt({
    at: pathOf({ page: 'home', language: 'fr' }),
    children: <I18nProvider i18n={SPEAKERS.fr}>{children}</I18nProvider>
  })

  return [...container.querySelectorAll('img')].map((image) => {
    return image.getAttribute('src')
  })
}

describe('the head of a feature', () => {
  afterEach(() => {
    cleanup()
  })

  it.each(MENU_FEATURES)('signs the card that leads to %s', (feature) => {
    expect(show(<FeatureCard page={feature} sizes={MOSAIC_SIZES} />)).toContain(
      PAGE_PORTRAITS[feature]
    )
  })

  it.each(MENU_FEATURES)('crowns the title of the %s page', (feature) => {
    expect(show(<Blazon page={feature} />)).toStrictEqual([
      PAGE_PORTRAITS[feature]
    ])
  })

  it.each(['journal', 'legal'] as const satisfies readonly PageId[])(
    'leaves the %s title bare, no character stands for it',
    (page) => {
      expect(show(<Blazon page={page} />)).toStrictEqual([])
    }
  )
})

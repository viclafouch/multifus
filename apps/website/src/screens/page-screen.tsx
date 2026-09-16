import React from 'react'
import type { PageKind } from '@/@types/page'
import type { PageScreenProps } from '@/@types/screen'
import { SiteShell } from '@/components/site-shell'
import { PAGES } from '@/constants/pages'
import { AnkamaScreen } from '@/screens/ankama-screen'
import { ComparisonScreen } from '@/screens/comparison-screen'
import { DownloadScreen } from '@/screens/download-screen'
import { FeatureScreen } from '@/screens/feature-screen'
import { HomeScreen } from '@/screens/home-screen'
import { LegalScreen } from '@/screens/legal-screen'
import { MacScreen } from '@/screens/mac-screen'
import { PlainScreen } from '@/screens/plain-screen'
import { WindowsScreen } from '@/screens/windows-screen'

const PAGE_SCREENS = {
  home: HomeScreen,
  feature: FeatureScreen,
  mac: MacScreen,
  windows: WindowsScreen,
  download: DownloadScreen,
  comparison: ComparisonScreen,
  plain: PlainScreen,
  ankama: AnkamaScreen,
  legal: LegalScreen
} as const satisfies Record<PageKind, React.ComponentType<PageScreenProps>>

export const PageScreen = ({ page }: PageScreenProps) => {
  const PageBody = PAGE_SCREENS[PAGES[page].kind]

  return (
    <SiteShell page={page}>
      <PageBody page={page} />
    </SiteShell>
  )
}

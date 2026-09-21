import React from 'react'
import type { PageKind } from '@/@types/page'
import type { PageScreenProps } from '@/@types/screen'
import { DownloadSummons } from '@/components/download-summons'
import { SiteShell } from '@/components/site-shell'
import { PAGES } from '@/constants/pages'
import { PAGE_SUMMONS } from '@/constants/summons'
import { AnkamaScreen } from '@/screens/ankama-screen'
import { ComparisonScreen } from '@/screens/comparison-screen'
import { DownloadScreen } from '@/screens/download-screen'
import { FaqScreen } from '@/screens/faq-screen'
import { FeatureScreen } from '@/screens/feature-screen'
import { HomeScreen } from '@/screens/home-screen'
import { JournalScreen } from '@/screens/journal-screen'
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
  faq: FaqScreen,
  plain: PlainScreen,
  journal: JournalScreen,
  ankama: AnkamaScreen,
  legal: LegalScreen
} as const satisfies Record<PageKind, React.ComponentType<PageScreenProps>>

export const PageScreen = ({ page }: PageScreenProps) => {
  const PageBody = PAGE_SCREENS[PAGES[page].kind]
  const summons = PAGE_SUMMONS[page]

  return (
    <SiteShell page={page}>
      <PageBody page={page} />
      {summons === null ? null : <DownloadSummons summons={summons} />}
    </SiteShell>
  )
}

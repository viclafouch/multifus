import React from 'react'
import type { PageKind } from '@/@types/page'
import type { PageScreenProps } from '@/@types/screen'
import { SiteShell } from '@/components/site-shell'
import { PAGES } from '@/constants/pages'
import { ComparisonScreen } from '@/screens/comparison-screen'
import { DownloadScreen } from '@/screens/download-screen'
import { FeatureScreen } from '@/screens/feature-screen'
import { HomeScreen } from '@/screens/home-screen'
import { PlainScreen } from '@/screens/plain-screen'

const PAGE_BODIES = {
  home: HomeScreen,
  feature: FeatureScreen,
  download: DownloadScreen,
  comparison: ComparisonScreen,
  plain: PlainScreen
} as const satisfies Record<PageKind, React.ComponentType<PageScreenProps>>

export const PageScreen = ({ page }: PageScreenProps) => {
  const PageBody = PAGE_BODIES[PAGES[page].kind]

  return (
    <SiteShell page={page}>
      <PageBody page={page} />
    </SiteShell>
  )
}

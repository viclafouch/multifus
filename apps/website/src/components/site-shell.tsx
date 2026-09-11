import React from 'react'
import type { PageId } from '@/@types/page'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkipLink } from '@/components/skip-link'
import { CONTENT_ANCHOR } from '@/constants/site'

type SiteShellProps = Readonly<{
  page: PageId
  children: React.ReactNode
}>

export const SiteShell = ({ page, children }: SiteShellProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader page={page} />
      <main
        id={CONTENT_ANCHOR}
        tabIndex={-1}
        className="flex flex-1 scroll-mt-fall flex-col outline-none"
      >
        {children}
      </main>
      <SiteFooter page={page} />
    </div>
  )
}

import React from 'react'
import { cn } from '@multifus/retro'
import type { PageId } from '@/@types/page'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SiteLurkers } from '@/components/site-lurkers'
import { SiteWorld } from '@/components/site-world'
import { SkipLink } from '@/components/skip-link'
import { PAGE_DECORS } from '@/constants/decors'
import { CONTENT_ANCHOR } from '@/constants/site'
import { PAGE_TINTS } from '@/constants/tints'

type SiteShellProps = Readonly<{
  page: PageId
  children: React.ReactNode
}>

export const SiteShell = ({ page, children }: SiteShellProps) => {
  const decor = PAGE_DECORS[page]

  return (
    <div
      className={cn('relative flex min-h-screen flex-col', PAGE_TINTS[page])}
    >
      <SkipLink />
      <div aria-hidden className="lattice">
        <SiteLurkers page={page} />
      </div>
      <div aria-hidden className="aura" />
      {decor === null ? null : <SiteWorld decor={decor} />}
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

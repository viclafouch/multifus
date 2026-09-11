import React from 'react'
import { cn } from '@multifus/retro'
import type { PageId } from '@/@types/page'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type PageLinkProps = Readonly<{
  page: PageId
  children: React.ReactNode
  className?: string
}>

export const PageLink = ({ page, children, className }: PageLinkProps) => {
  const language = useLanguage()

  return (
    <a
      href={pathOf({ page, language })}
      className={cn('sighted transition-colors hover:text-cream', className)}
    >
      {children}
    </a>
  )
}

import React from 'react'
import { cn } from '@multifus/retro'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'

type OutLinkProps = Readonly<{
  href: string
  children: React.ReactNode
  isInline?: boolean
}>

export const OutLink = ({ href, children, isInline = false }: OutLinkProps) => {
  return (
    <a
      href={href}
      className={cn(
        'sighted rule border-b text-cream transition-colors hover:border-cream',
        isInline ? 'inline' : 'inline-flex items-center gap-1.5'
      )}
    >
      {children}
      <ArrowUpRightIcon
        weight="bold"
        aria-hidden
        className={cn('size-[0.9em]', isInline ? 'ml-1 inline' : null)}
      />
    </a>
  )
}

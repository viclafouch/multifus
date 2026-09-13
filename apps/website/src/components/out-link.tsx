import React from 'react'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'

type OutLinkProps = Readonly<{
  href: string
  children: React.ReactNode
}>

export const OutLink = ({ href, children }: OutLinkProps) => {
  return (
    <a
      href={href}
      className="sighted rule inline-flex items-center gap-1.5 border-b text-cream transition-colors hover:border-cream"
    >
      {children}
      <ArrowUpRightIcon weight="bold" aria-hidden className="size-[0.9em]" />
    </a>
  )
}

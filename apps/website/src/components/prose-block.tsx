import React from 'react'
import type { HeadingLevel } from '@/lib/heading'
import { HEADING_TAGS } from '@/lib/heading'

type ProseBlockProps = Readonly<{
  level: Exclude<HeadingLevel, 1>
  title: string
  children: React.ReactNode
}>

export const ProseBlock = ({ level, title, children }: ProseBlockProps) => {
  const Heading = HEADING_TAGS[level]

  return (
    <section className="rule flex flex-col gap-3 border-t pt-6">
      <Heading className="nameplate">{title}</Heading>
      {children}
    </section>
  )
}

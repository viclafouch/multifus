import React from 'react'
import { cn } from '@multifus/retro'

type ProseProps = Readonly<{
  children: React.ReactNode
  isWide?: boolean
}>

export const Prose = ({ children, isWide = false }: ProseProps) => {
  return (
    <p className={cn('text-tale text-band', isWide ? null : 'max-w-tale')}>
      {children}
    </p>
  )
}

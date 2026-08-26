import React from 'react'
import { cn } from '@/lib/utils'

type LegendProps = Readonly<{
  children: React.ReactNode
  className?: string
}>

export const Legend = ({ children, className }: LegendProps) => {
  return (
    <span
      className={cn(
        'text-micro font-medium tracking-micro text-muted-foreground/70 uppercase',
        className
      )}
    >
      {children}
    </span>
  )
}

import React from 'react'
import { cn } from '@/lib/utils'

type LegendProps = Readonly<React.ComponentProps<'span'>>

export const Legend = ({ className, children, ...rest }: LegendProps) => {
  return (
    <span
      {...rest}
      className={cn(
        'text-micro font-medium tracking-micro text-muted-foreground/70 uppercase',
        className
      )}
    >
      {children}
    </span>
  )
}

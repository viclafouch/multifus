import React from 'react'
import { cn } from '@/lib/utils'

/** Derived from `div` so a caller can hang a `data-*` on the surface. */
type PanelProps = Readonly<React.ComponentProps<'div'>>

/** A bordered surface. The only container this interface has. */
export const Panel = ({ className, children, ...rest }: PanelProps) => {
  return (
    <div
      {...rest}
      className={cn('rounded-xl border border-border bg-card/45', className)}
    >
      {children}
    </div>
  )
}

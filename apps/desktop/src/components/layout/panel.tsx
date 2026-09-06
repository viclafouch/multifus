import React from 'react'
import { cn } from '@/lib/utils'

type PanelProps = Readonly<React.ComponentProps<'div'>>

export const Panel = ({ className, children, ...rest }: PanelProps) => {
  return (
    <div {...rest} className={cn('plate', className)}>
      {children}
    </div>
  )
}

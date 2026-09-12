import React from 'react'
import { cn } from '@multifus/retro'

type WashProps = Readonly<{
  children: React.ReactNode
  className?: string
}>

export const Wash = ({ children, className }: WashProps) => {
  return (
    <div className={cn('relative flex flex-col', className)}>
      <span
        aria-hidden
        className="wash absolute -inset-x-4 -inset-y-14 -z-10"
      />
      {children}
    </div>
  )
}

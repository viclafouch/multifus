import React from 'react'
import { useArrival } from '@/hooks/use-arrival'
import { cn } from '@/lib/utils'

type MapTitleProps = Readonly<{
  children: React.ReactNode
  className?: string
}>

export const MapTitle = ({ children, className }: MapTitleProps) => {
  const title = useArrival()

  return (
    <h1
      ref={title}
      tabIndex={-1}
      className={cn(
        'limelight font-carve text-sign tracking-wide text-cream uppercase outline-none',
        className
      )}
    >
      {children}
    </h1>
  )
}

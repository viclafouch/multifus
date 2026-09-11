import React from 'react'
import { cn } from '@multifus/retro'
import { useArrival } from '@/hooks/use-arrival'

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

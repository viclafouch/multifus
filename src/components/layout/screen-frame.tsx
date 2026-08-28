import React from 'react'
import { cn } from '@/lib/utils'

type ScreenFrameProps = Readonly<{
  ratio: number
  width: number
  label: string
  className?: string
  children: React.ReactNode
}>

export const ScreenFrame = ({
  ratio,
  width,
  label,
  className,
  children
}: ScreenFrameProps) => {
  return (
    <div
      style={{ maxWidth: width }}
      className="w-full rounded-lg border border-border bg-card/70 p-2"
    >
      <div
        role="group"
        aria-label={label}
        style={{ aspectRatio: ratio }}
        className={cn(
          'warm-light overflow-hidden rounded-md border border-border/60 bg-background',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

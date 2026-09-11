import React from 'react'
import { cn } from '@multifus/retro'
import { SCREEN_SCENE } from '@/constants/world'

type ScreenFrameProps = Readonly<{
  ratio: number
  label: string
  className?: string
  ref?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}>

export const ScreenFrame = ({
  ratio,
  label,
  className,
  ref,
  children
}: ScreenFrameProps) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      style={{ aspectRatio: ratio }}
      className={cn('pane relative w-full', className)}
    >
      <img
        aria-hidden
        alt=""
        src={SCREEN_SCENE}
        className="pane-scene pointer-events-none absolute inset-0 size-full object-cover"
      />
      <span
        aria-hidden
        className="pane-shade pointer-events-none absolute inset-0"
      />
      {children}
    </div>
  )
}

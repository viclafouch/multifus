import React from 'react'
import { SCREEN_SCENE } from '@/constants/world'
import { cn } from '@/lib/utils'

type ScreenFrameProps = Readonly<{
  ratio: number
  label: string
  width?: number
  className?: string
  ref?: React.Ref<HTMLDivElement>
  children: React.ReactNode
}>

export const ScreenFrame = ({
  ratio,
  label,
  width,
  className,
  ref,
  children
}: ScreenFrameProps) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      style={{ aspectRatio: ratio, maxWidth: width }}
      className={cn('pane relative w-full', className)}
    >
      <img
        aria-hidden
        alt=""
        src={SCREEN_SCENE}
        className="pane-scene absolute inset-0 size-full object-cover"
      />
      <span aria-hidden className="pane-shade absolute inset-0" />
      {children}
    </div>
  )
}

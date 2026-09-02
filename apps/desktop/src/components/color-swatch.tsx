import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ColorSwatchProps = Readonly<{
  label: string
  tint: string
  isWorn: boolean
  isNear: boolean
  isTaken: boolean
  isBare: boolean
  onPick: () => void
  onNear: (isNear: boolean) => void
  children?: React.ReactNode
}>

export const ColorSwatch = ({
  label,
  tint,
  isWorn,
  isNear,
  isTaken,
  isBare,
  onPick,
  onNear,
  children
}: ColorSwatchProps) => {
  return (
    <Button
      variant="ghost"
      aria-pressed={isWorn}
      aria-label={label}
      className="size-auto rounded-full p-1.5 hover:bg-transparent"
      onClick={onPick}
      onPointerEnter={() => {
        onNear(true)
      }}
      onPointerLeave={() => {
        onNear(false)
      }}
      onFocus={() => {
        onNear(true)
      }}
      onBlur={() => {
        onNear(false)
      }}
    >
      <span
        aria-hidden
        data-bare={isBare ? '' : undefined}
        data-taken={isTaken ? '' : undefined}
        data-hovered={isNear ? '' : undefined}
        data-worn={isWorn ? '' : undefined}
        className={cn(
          'swatch flex size-swatch items-center justify-center rounded-full border text-muted-foreground/60',
          tint
        )}
      >
        {children}
      </span>
    </Button>
  )
}

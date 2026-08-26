import React from 'react'

type IconTileProps = Readonly<{
  children: React.ReactNode
}>

export const IconTile = ({ children }: IconTileProps) => {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/8 text-primary/80">
      {children}
    </span>
  )
}

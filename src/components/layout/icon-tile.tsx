import React from 'react'

type IconTileProps = Readonly<{
  children: React.ReactNode
}>

/** The bordered square a glyph sits in, wherever one is needed. */
export const IconTile = ({ children }: IconTileProps) => {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground">
      {children}
    </span>
  )
}

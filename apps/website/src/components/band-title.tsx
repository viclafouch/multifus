import React from 'react'

type BandTitleProps = Readonly<{
  children: React.ReactNode
}>

export const BandTitle = ({ children }: BandTitleProps) => {
  return (
    <h2 className="font-carve text-chapter tracking-hero text-cream uppercase">
      {children}
    </h2>
  )
}

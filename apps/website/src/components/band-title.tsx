import React from 'react'
import { Glint } from '@/components/glint'

type BandTitleProps = Readonly<{
  children: React.ReactNode
}>

export const BandTitle = ({ children }: BandTitleProps) => {
  return (
    <h2 className="flex flex-col gap-3.5">
      <span className="font-carve text-chapter tracking-hero text-cream uppercase">
        {children}
      </span>
      <Glint />
    </h2>
  )
}

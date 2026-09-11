import React from 'react'
import { BandTitle } from '@/components/band-title'

type PlateBlockProps = Readonly<{
  title: string
  children: React.ReactNode
}>

export const PlateBlock = ({ title, children }: PlateBlockProps) => {
  return (
    <div className="glass flex flex-col gap-4 p-6 sm:p-8">
      <BandTitle>{title}</BandTitle>
      {children}
    </div>
  )
}

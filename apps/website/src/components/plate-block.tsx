import React from 'react'
import { BandTitle } from '@/components/band-title'
import { Plate } from '@/components/plate'

type PlateBlockProps = Readonly<{
  title: string
  children: React.ReactNode
}>

export const PlateBlock = ({ title, children }: PlateBlockProps) => {
  return (
    <Plate isBare className="sm:p-8">
      <BandTitle>{title}</BandTitle>
      {children}
    </Plate>
  )
}

import React from 'react'
import { Panel } from '@multifus/retro'
import { BandTitle } from '@/components/band-title'

type PlateBlockProps = Readonly<{
  title: string
  children: React.ReactNode
}>

export const PlateBlock = ({ title, children }: PlateBlockProps) => {
  return (
    <Panel className="flex flex-col gap-4 p-6 sm:p-8">
      <BandTitle>{title}</BandTitle>
      {children}
    </Panel>
  )
}
